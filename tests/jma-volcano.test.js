const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const controller = require("../api/controllers/DataController");
const parser = require("../api/services/EventParser/JMAVolcano");
const pushService = require("../api/services/PushService");
const postProcess = require("../api/services/DataPostProcessService");
// Captured from JMAVolcanoSpider using JMA's three unmodified VFVO50 samples.
const fixtures = require("./fixtures/jma-volcano.json");
let sequence = 0;

function telegram(options = {}) {
    const input = structuredClone(fixtures[options.index || 0]);
    const source = input.data.volcano_data;
    const time = options.time || "2026-10-22T01:00:00Z";
    Object.assign(source, { time, reportTime: time, serial: String(++sequence), text: "" });
    source.warning.status = options.status || "通常";
    source.warning.infoType = options.infoType || "発表";
    if (options.kind) source.warning.volcano.kind = options.kind;
    if (options.bodyless) {
        source.name = "";
        source.warning = { status: source.warning.status, infoType: "取消", areas: [], responses: [] };
        source.text = "先ほどの電文を取り消します。";
        input.data.title = `火山 ${source.code} 喷火情报（电文取消）`;
        input.data.content = input.data.title + "\n" + source.text;
    }
    input.data.warning = structuredClone(source.warning);
    input.hash = input.data.hash = "volcano-scenario-" + sequence;
    input.level = source.warning.status !== "通常" || !source.warning.volcano ||
        ["11", "21", "35"].includes(source.warning.volcano.kind) ? 3 : 4;
    return input;
}

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function prepare(t) {
    const state = { records: [], series: [], sockets: [], pushes: [], uploads: [], errors: [] };
    setGlobal(t, "Data", {
        findOne: async ({ hash }) => state.records.find((record) => record.hash === hash),
        create: (record) => ({ fetch: async () => {
            const saved = { ...record, id: state.records.length + 1 };
            state.records.push(saved);
            return saved;
        } }),
        update: async ({ id }, record) => Object.assign(state.records.find((item) => item.id === id), record),
    });
    setGlobal(t, "DataTimeSeries", {
        find({ key }) { return { async sort(order) {
            assert.equal(order, "id desc");
            return state.series.filter((row) => row.key === key).sort((a, b) => b.id - a.id);
        } }; },
        async create(record) {
            if (state.beforeSeriesWrite) await state.beforeSeriesWrite(record);
            state.series.push({ ...record, id: state.series.length + 1 });
        },
    });
    setGlobal(t, "DataPostProcessService", postProcess);
    setGlobal(t, "PushService", pushService);
    setGlobal(t, "PushRule", { findOne: async ({ spider_name }) => {
        assert.equal(spider_name, "JMAVolcano");
        return { rule: JSON.stringify({ channels: ["test"] }) };
    } });
    setGlobal(t, "PushHistory", { find: async () => [], update: () => ({ set: async () => {} }) });
    setGlobal(t, "ShinyPushService", { push: async (job) => {
        state.pushes.push(job);
        return [{ id: state.pushes.length, channel: "test" }];
    } });
    setGlobal(t, "PushLog", { create: async () => {} });
    setGlobal(t, "QueueService", { sendMessage: async (job) => state.uploads.push(job) });
    t.mock.method(pushService, "sendSocket", (type, message) => state.sockets.push({ type, message }));
    t.mock.method(require("@sentry/node"), "captureException", (error) => state.errors.push(error));
    return state;
}

function submit(input) {
    return controller.add({ param: () => JSON.stringify(input) }, {
        success: (data) => ({ status: 200, data }),
        error: (status, code, message) => ({ status, code, message }),
    });
}

async function accept(input) {
    const result = await submit(input);
    assert.equal(result.status, 200);
    await new Promise(setImmediate);
    return result;
}

function mockMap(t) {
    return t.mock.method(axios, "post", async (url, body, options) => {
        assert.equal(url, "http://localhost:3000/Map/volcano_warning");
        assert.equal(options.timeout, 30000);
        return { data: { path: "/maps/volcano-" + JSON.parse(body.warning).volcano.code + ".png" } };
    });
}

test("volcano post-processing only appends raw telegrams under one volcano key", async (t) => {
    const state = prepare(t);
    t.mock.method(DataTimeSeries, "find", () => { throw new Error("Post-processing must not read history"); });
    const post = mockMap(t);
    for (const input of [telegram(), telegram({ bodyless: true })]) {
        assert.equal(await postProcess.doPostProcess({
            publisher: "JMAVolcano", hash: input.hash, data: JSON.stringify(input.data),
        }), undefined);
        assert.deepEqual(JSON.parse(state.series.at(-1).data), { ...input.data.volcano_data, hash: input.hash });
    }
    assert.deepEqual(state.series.map((row) => row.key), ["jma_volcano_306", "jma_volcano_306"]);
    assert.equal(post.mock.calls.length, 0);
    assert.equal(state.pushes.length, 0);
});

test("all official VFVO50 events render without mixing volcano, area and response codes", async (t) => {
    const post = t.mock.method(axios, "post", async (url, body) => {
        assert.equal(url, "http://localhost:3000/Map/volcano_warning");
        const warning = JSON.parse(body.warning);
        assert.equal(warning.volcano.code.length, 3);
        assert.ok(warning.areas.every((area) => area.code.length === 7));
        return { data: { path: "/maps/volcano-" + warning.volcano.code + ".png" } };
    });
    for (const input of fixtures) {
        const original = structuredClone(input);
        assert.deepEqual(await parser.parse(input), [{
            text: input.data.content, pic: "/maps/volcano-" + input.data.warning.volcano.code + ".png",
        }]);
        assert.deepEqual(input, original);
        assert.deepEqual(JSON.parse(post.mock.calls.at(-1).arguments[1].warning), input.data.warning);
    }
    assert.deepEqual(fixtures.map((input) => input.data.warning.volcano.kind), ["13", "15", "11"]);
    assert.deepEqual(fixtures.map((input) => input.data.warning.responses.length), [4, 1, 3]);
});

test("default coordinates, corrections, cancellations and training statuses survive map forwarding", async (t) => {
    for (const status of ["通常", "訓練", "試験"]) {
        for (const infoType of ["発表", "訂正", "取消"]) {
            const input = structuredClone(fixtures[0]);
            input.data.warning.status = status;
            input.data.warning.infoType = infoType;
            delete input.data.warning.volcano.coordinate;
            input.data.volcano_data.warning = structuredClone(input.data.warning);
            const post = t.mock.method(axios, "post", async (url, body) => {
                assert.deepEqual(JSON.parse(body.warning), input.data.warning);
                return { data: { path: "/maps/volcano.png" } };
            });
            assert.deepEqual(await parser.parse(input), [{ text: input.data.content, pic: "/maps/volcano.png" }]);
            post.mock.restore();
        }
    }
});

test("submission stores and broadcasts the event, renders it, and saves and queues the image once", async (t) => {
    const state = prepare(t);
    const post = t.mock.method(axios, "post", async (url, body) => {
        assert.equal(url, "http://localhost:3000/Map/volcano_warning");
        const code = JSON.parse(body.warning).volcano.code;
        return { data: { path: "/maps/volcano-" + code + ".png" } };
    });
    const result = await submit(fixtures);
    assert.equal(result.status, 200);
    assert.equal(result.data.length, 3);
    await new Promise(setImmediate);
    assert.equal(post.mock.calls.length, 3);
    assert.equal(state.pushes.length, 3);
    assert.equal(state.uploads.length, 3);
    assert.equal(state.series.length, 3);
    for (const [index, input] of fixtures.entries()) {
        const path = "/maps/volcano-" + input.data.warning.volcano.code + ".png";
        const record = state.records[index];
        assert.equal(record.publisher, "JMAVolcano");
        assert.equal(record.hash, input.hash);
        assert.deepEqual(JSON.parse(state.series[index].data), { ...input.data.volcano_data, hash: input.hash });
        assert.deepEqual(JSON.parse(record.data), { ...input.data, shinyImages: [path] });
        assert.deepEqual(state.sockets[index].message.data, input.data);
        const push = state.pushes.find((job) => job.eventId === record.id);
        assert.equal(push.text, input.data.content);
        assert.equal(push.title, input.data.title);
        assert.deepEqual(push.images, [path]);
        assert.ok(state.uploads.some((job) => job.paths[0] === path));
    }
    assert.deepEqual(state.errors, []);
    assert.deepEqual(await submit(fixtures), { status: 200, data: [] });
    await new Promise(setImmediate);
    assert.equal(post.mock.calls.length, 3);
    assert.equal(state.pushes.length, 3);
    assert.equal(state.series.length, 3);
});

test("the parser restores a bodyless cancellation from persisted history after reload without changing raw data", async (t) => {
    const state = prepare(t);
    const post = mockMap(t);
    const issue = telegram();
    await accept(issue);
    delete require.cache[require.resolve("../api/services/EventParser/JMAVolcano")];
    const cancellation = telegram({ bodyless: true, time: "2026-10-22T01:01:00Z" });
    await accept(cancellation);
    assert.equal(post.mock.calls.length, 2);
    assert.deepEqual(JSON.parse(post.mock.calls[1].arguments[1].warning), {
        ...issue.data.warning, infoType: "取消",
    });
    assert.equal(state.series.length, 2);
    assert.deepEqual(JSON.parse(state.series[1].data), { ...cancellation.data.volcano_data, hash: cancellation.hash });
    assert.match(state.pushes[1].title, /浅間山.*电文取消/);
    assert.match(state.pushes[1].text, /原电文状态：等级 3/);
    assert.ok(state.pushes[1].text.includes(cancellation.data.volcano_data.text));
    assert.doesNotMatch(state.pushes[1].title, /警报解除/);
    assert.deepEqual(state.pushes[1].images, ["/maps/volcano-306.png"]);
    const saved = state.records[1];
    assert.equal(saved.level, state.pushes[1].level);
    assert.deepEqual(JSON.parse(saved.data).volcano_data, cancellation.data.volcano_data);
    assert.equal(state.sockets[1].message.data.warning.volcano, undefined);
    assert.deepEqual((await accept(cancellation)).data, []);
    const before = structuredClone(state.series);
    await parser.parse(cancellation);
    assert.deepEqual(state.series, before);
    assert.deepEqual(state.errors, []);
});

test("cancellations without suitable history remain text events and never borrow another status, volcano or future telegram", async (t) => {
    const state = prepare(t);
    const post = mockMap(t);
    for (const options of [null, { status: "訓練" }, { index: 1 }, { time: "2026-10-22T01:10:00Z" }]) {
        state.series.length = 0;
        if (options) await accept(telegram(options));
        const before = post.mock.calls.length;
        const cancellation = telegram({ bodyless: true, time: "2026-10-22T01:01:00Z" });
        await accept(cancellation);
        assert.equal(post.mock.calls.length, before);
        assert.equal(state.pushes.at(-1).text, cancellation.data.content);
        assert.equal(state.pushes.at(-1).images, undefined);
        assert.equal(JSON.parse(state.series.at(-1).data).warning.volcano, undefined);
    }
    assert.deepEqual(state.errors, []);
});

test("cancellation geometry comes from the latest eligible publication rather than the last inserted row", async (t) => {
    const state = prepare(t);
    const post = mockMap(t);
    await accept(telegram());
    const correction = telegram({ kind: "12", infoType: "訂正", time: "2026-10-22T01:02:00Z" });
    correction.data.volcano_data.warning.areas = [];
    await accept(correction);
    await accept(telegram({ kind: "15", time: "2026-10-22T01:10:00Z" }));
    await accept(telegram({ kind: "15", status: "訓練", time: "2026-10-22T01:02:30Z" }));
    await accept(telegram({ index: 1, time: "2026-10-22T01:02:30Z" }));
    await accept(telegram({ kind: "11", time: "2026-10-22T00:59:00Z" }));
    await accept(telegram({ bodyless: true, time: "2026-10-22T01:03:00Z" }));
    const warning = JSON.parse(post.mock.calls.at(-1).arguments[1].warning);
    assert.equal(warning.volcano.kind, "12");
    assert.deepEqual(warning.areas, []);
    assert.deepEqual(warning.responses, correction.data.volcano_data.warning.responses);
    assert.equal(warning.infoType, "取消");
    assert.equal(state.series.length, 7);
    assert.deepEqual(state.errors, []);
});

test("same-time corrections and cancellations keep normal, training and test history separate", async (t) => {
    const state = prepare(t);
    const post = mockMap(t);
    for (const status of ["通常", "訓練", "試験"]) {
        await accept(telegram({ status, kind: "13" }));
        await accept(telegram({ status, kind: "12", infoType: "訂正" }));
        await accept(telegram({ status, bodyless: true }));
        const warning = JSON.parse(post.mock.calls.at(-1).arguments[1].warning);
        assert.equal(warning.volcano.kind, "12");
        assert.equal(warning.status, status);
        assert.equal(warning.infoType, "取消");
        assert.equal(state.pushes.at(-1).level, status === "通常" ? 4 : 3);
        if (status !== "通常") assert.ok(state.pushes.at(-1).title.startsWith("【"));
    }
    assert.equal(state.series.length, 9);
    assert.equal(new Set(state.series.map((row) => row.key)).size, 1);
    assert.deepEqual(state.errors, []);
});

test("same-volcano writes stay ordered while intake and console notifications remain responsive", async (t) => {
    const state = prepare(t);
    const post = mockMap(t);
    let release, started;
    const gate = new Promise((done) => { release = done; });
    const writing = new Promise((done) => { started = done; });
    t.after(async () => { release(); await new Promise(setImmediate); });
    let count = 0;
    state.beforeSeriesWrite = async () => { if (++count === 1) { started(); await gate; } };
    const pending = submit([telegram(), telegram({ bodyless: true, time: "2026-10-22T01:01:00Z" })]);
    await writing;
    const result = await Promise.race([pending, new Promise((_, reject) =>
        setImmediate(() => reject(new Error("Intake waited for history write"))))]);
    assert.equal(result.status, 200);
    assert.equal(state.sockets.length, 2);
    assert.equal(state.series.length, 0);
    assert.equal(post.mock.calls.length, 0);
    release();
    await new Promise(setImmediate);
    assert.equal(state.series.length, 2);
    assert.equal(state.pushes.length, 2);
    assert.equal(JSON.parse(post.mock.calls[1].arguments[1].warning).volcano.code, "306");
});

test("legacy warning payloads still render and missing map paths are rejected", async (t) => {
    const input = structuredClone(fixtures[0]);
    delete input.data.volcano_data;
    const post = mockMap(t);
    assert.deepEqual(await parser.parse(input), [{ text: input.data.content, pic: "/maps/volcano-306.png" }]);
    post.mock.restore();
    t.mock.method(axios, "post", async () => ({ data: {} }));
    await assert.rejects(parser.parse(input), /火山地图未返回图片路径/);
});

test("map failures are reported in the background while the original event remains stored", async (t) => {
    const state = prepare(t);
    const error = new Error("Map renderer unavailable");
    t.mock.method(axios, "post", async () => { throw error; });
    const result = await submit(fixtures[0]);
    assert.equal(result.status, 200);
    await new Promise(setImmediate);
    assert.deepEqual(JSON.parse(state.records[0].data), fixtures[0].data);
    assert.equal(state.series.length, 1);
    assert.deepEqual(state.errors, [error]);
    assert.deepEqual(state.pushes, []);
    assert.deepEqual(state.uploads, []);
});
