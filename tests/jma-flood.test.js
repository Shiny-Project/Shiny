const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const controller = require("../api/controllers/DataController");
const parser = require("../api/services/EventParser/JMAFlood");
const pushService = require("../api/services/PushService");
const postProcess = require("../api/services/DataPostProcessService");
// All fourteen original JMA samples, captured from the stateless JMAFloodSpider.
const fixtures = require("./fixtures/jma-flood.json");
let sequence = 0;

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function telegram(kind = "51", options = {}) {
    const input = structuredClone(fixtures[6]);
    const source = input.data.flood_data;
    const time = options.time || "2026-10-22T01:00:00Z";
    Object.assign(source, { code: options.code || source.code, time, reportTime: options.reportTime || time,
        serial: options.serial || "1", name: kind ? "最上川中流" : "", details: [], headline: "洪水电文主文" });
    source.warning = { status: options.status || "通常", infoType: options.infoType || "発表",
        rivers: kind ? [{ code: source.code, kind }] : [] };
    input.hash = input.data.hash = "flood-scenario-" + ++sequence;
    input.data.title = "当前洪水情报";
    input.data.content = "当前电文的正文";
    input.level = ["51", "53"].includes(kind) && source.warning.status === "通常" ? 4 : 3;
    return input;
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
        update: async ({ id }, value) => Object.assign(state.records.find((item) => item.id === id), value),
    });
    setGlobal(t, "DataTimeSeries", {
        find({ key }) {
            return { async sort(order) {
                assert.equal(order, "id desc");
                return state.series.filter((row) => row.key === key).sort((a, b) => b.id - a.id);
            } };
        },
        async create(record) {
            if (state.beforeSeriesWrite) await state.beforeSeriesWrite(record);
            state.series.push({ ...record, id: state.series.length + 1 });
        },
    });
    setGlobal(t, "DataPostProcessService", postProcess);
    setGlobal(t, "PushService", pushService);
    setGlobal(t, "PushRule", { findOne: async ({ spider_name }) => {
        assert.equal(spider_name, "JMAFlood");
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
    state.http = t.mock.method(axios, "post", async (url, body, options) => {
        assert.equal(url, "http://localhost:3000/Map/flood_warning");
        assert.equal(options.timeout, 30000);
        const warning = JSON.parse(body.warning);
        assert.ok(warning.rivers.length);
        return { data: { path: "/maps/flood-" + warning.rivers[0].kind + ".png" } };
    });
    return state;
}

function submit(input) {
    return controller.add({ param: () => JSON.stringify(input) }, {
        success: (data) => ({ status: 200, data }),
        error: (status, code, message) => ({ status, code, message }),
    });
}
const flush = () => new Promise(setImmediate);
async function accept(input) {
    const result = await submit(input);
    assert.equal(result.status, 200);
    await flush();
    return result;
}

test("post-processing only stores raw telegrams without reading history or deciding what to push", async (t) => {
    const state = prepare(t);
    t.mock.method(DataTimeSeries, "find", () => { throw new Error("Post-processing must not query history"); });
    for (const kind of ["51", "40", "10", null]) {
        const input = telegram(kind, kind ? {} : { infoType: "取消" });
        const result = await postProcess.doPostProcess({
            publisher: "JMAFlood", hash: input.hash, data: JSON.stringify(input.data),
        });
        assert.equal(result, undefined);
        assert.deepEqual(JSON.parse(state.series.at(-1).data), { ...input.data.flood_data, hash: input.hash });
    }
    assert.equal(state.series.length, 4);
    assert.equal(new Set(state.series.map((row) => row.key)).size, 1);
    assert.equal(state.http.mock.calls.length, 0);
    assert.equal(state.sockets.length, 0);
    assert.equal(state.pushes.length, 0);
});

test("all official telegrams enter history and notify the console; the parser only renders and pushes special warnings", async (t) => {
    const state = prepare(t);
    for (const input of fixtures) {
        state.series.length = 0; // Each original sample is an independent cold start.
        const before = state.pushes.length;
        await accept(input);
        assert.equal(state.series.length, 1);
        const stored = JSON.parse(state.series[0].data);
        assert.equal(stored.hash, input.hash);
        assert.deepEqual(stored, { ...input.data.flood_data, hash: input.hash });
        const special = ["51", "53"].includes(input.data.flood_data.warning.rivers[0].kind);
        assert.equal(state.pushes.length - before, special ? 1 : 0);
    }
    assert.equal(state.records.length, 14);
    assert.equal(state.sockets.length, 14);
    assert.equal(state.http.mock.calls.length, 4);
    assert.equal(state.uploads.length, 4);
    assert.deepEqual(state.errors, []);
});

test("central history connects L5 to its downgrade or release, then ignores ordinary subsequent updates", async (t) => {
    const state = prepare(t);
    const sequence = [["40", 0], ["51", 1], ["41", 2], ["31", 2], ["53", 3], ["10", 4], ["20", 4]];
    for (const [index, [kind, expected]] of sequence.entries()) {
        await accept(telegram(kind, { time: `2026-10-22T01:0${index}:00Z`, serial: String(index) }));
        assert.equal(state.pushes.length, expected);
    }
    assert.equal(state.series.length, sequence.length);
    assert.deepEqual([...new Set(state.series.map((row) => row.key))],
        [`jma_flood_${fixtures[6].data.flood_data.code}`]);
    assert.match(state.pushes[1].title, /泛滥特别警报降级 · 泛滥危险警报/);
    assert.match(state.pushes[3].title, /泛滥特别警报解除/);
    assert.deepEqual(state.pushes.map((job) => job.level), [4, 3, 4, 3]);
    for (const job of state.pushes) {
        const record = state.records.find((row) => row.id === job.eventId);
        assert.deepEqual(JSON.parse(record.data).shinyImages, job.images);
        assert.equal(JSON.parse(record.data).title, job.title);
        assert.equal(record.level, job.level);
        assert.ok(state.uploads.some((item) => item.paths[0] === job.images[0]));
    }
    assert.deepEqual(state.errors, []);
});

test("every lower kind is related when it immediately follows a special warning", async (t) => {
    const state = prepare(t);
    for (const [index, kind] of ["10", "20", "21", "22", "30", "31", "40", "41"].entries()) {
        await accept(telegram("51", { time: `2026-10-22T01:0${index}:00Z` }));
        await accept(telegram(kind, { time: `2026-10-22T01:0${index}:30Z` }));
        assert.equal(state.pushes.length, (index + 1) * 2);
        assert.equal(state.pushes.at(-1).images[0], `/maps/flood-${kind}.png`);
    }
    assert.deepEqual(state.errors, []);
});

test("a fresh central service resolves a downgrade using persisted rows rather than process history", async (t) => {
    const state = prepare(t);
    await accept(telegram());
    delete require.cache[require.resolve("../api/services/EventParser/JMAFlood")];
    await accept(telegram("40", { time: "2026-10-22T01:01:00Z" }));
    assert.equal(state.pushes.length, 2);
    assert.match(state.pushes[1].title, /特别警报降级/);
    assert.equal(state.series.length, 2);
});

test("bodyless cancellation recovers the stored warning, remains idempotent and does not cause a false later release", async (t) => {
    const state = prepare(t);
    await accept(telegram());
    delete require.cache[require.resolve("../api/services/EventParser/JMAFlood")];
    const cancellation = telegram(null, { infoType: "取消", time: "2026-10-22T01:01:00Z" });
    await accept(cancellation);
    assert.equal(state.pushes.length, 2);
    assert.match(state.pushes[1].title, /最上川中流.*电文取消/);
    const warning = JSON.parse(state.http.mock.calls[1].arguments[1].warning);
    assert.equal(warning.rivers[0].kind, "51");
    assert.equal(warning.infoType, "取消");
    assert.deepEqual((await accept(cancellation)).data, []);
    assert.equal(state.series.length, 2);
    const before = structuredClone(state.series);
    assert.match((await parser.parse(cancellation))[0].text, /最上川中流.*电文取消/);
    assert.deepEqual(state.series, before);
    assert.equal(state.series.length, 2);
    await accept(telegram("40", { time: "2026-10-22T01:02:00Z" }));
    assert.equal(state.pushes.length, 2);
    assert.equal(state.series.length, 3);
});

test("correction and cancellation of a related downgrade remain linked when publication times advance", async (t) => {
    const state = prepare(t);
    await accept(telegram());
    const reportTime = "2026-10-22T01:01:00Z";
    await accept(telegram("40", { time: reportTime, serial: "2" }));
    await accept(telegram("41", { time: "2026-10-22T01:02:00Z", serial: "2", infoType: "訂正" }));
    await accept(telegram(null, { time: "2026-10-22T01:03:00Z", serial: "2", infoType: "取消" }));
    assert.equal(state.pushes.length, 4);
    assert.match(state.pushes[2].title, /特别警报降级.*订正/);
    assert.match(state.pushes[3].title, /特别警报降级.*电文取消/);
    const warning = JSON.parse(state.http.mock.calls[3].arguments[1].warning);
    assert.equal(warning.rivers[0].kind, "41");
    assert.equal(warning.infoType, "取消");
    assert.equal(JSON.parse(state.series[3].data).reportTime, "2026-10-22T01:03:00Z");
    await accept(telegram("31", { time: "2026-10-22T01:04:00Z", serial: "3" }));
    assert.equal(state.pushes.length, 4);
    assert.deepEqual(state.errors, []);
});

test("correction and cancellation of a special-warning release use their own publication times", async (t) => {
    const state = prepare(t);
    await accept(telegram());
    await accept(telegram("10", { time: "2026-10-22T01:01:00Z", serial: "2" }));
    await accept(telegram("10", { time: "2026-10-22T01:02:00Z", serial: "2", infoType: "訂正" }));
    const cancellation = telegram(null, { time: "2026-10-22T01:03:00Z", serial: "2", infoType: "取消" });
    await accept(cancellation);
    assert.equal(state.pushes.length, 4);
    assert.match(state.pushes[2].title, /特别警报解除.*订正/);
    assert.match(state.pushes[3].title, /特别警报解除.*电文取消/);
    assert.deepEqual(state.pushes.map((job) => job.level), [4, 3, 3, 3]);
    const warning = JSON.parse(state.http.mock.calls[3].arguments[1].warning);
    assert.equal(warning.rivers[0].kind, "10");
    assert.equal(warning.infoType, "取消");
    assert.deepEqual(JSON.parse(state.series[3].data), { ...cancellation.data.flood_data, hash: cancellation.hash });
    assert.deepEqual(state.errors, []);
});

test("ordinary updates and their revisions stay unrelated even when timestamps and serials match a prior downgrade", async (t) => {
    const state = prepare(t);
    for (const specialBefore of [false, true]) {
        state.series.length = 0;
        const before = state.pushes.length;
        if (specialBefore) await accept(telegram());
        await accept(telegram("40", { time: "2026-10-22T01:01:00Z", serial: "2" }));
        const expected = before + (specialBefore ? 2 : 0);
        await accept(telegram("31", { time: "2026-10-22T01:01:00Z", serial: "2" }));
        await accept(telegram("31", { time: "2026-10-22T01:02:00Z", serial: "2", infoType: "訂正" }));
        await accept(telegram(null, { time: "2026-10-22T01:03:00Z", serial: "2", infoType: "取消" }));
        assert.equal(state.pushes.length, expected);
        assert.equal(state.http.mock.calls.length, expected);
    }
    assert.deepEqual(state.errors, []);
});

test("different rivers, training statuses and future source timestamps cannot supply a previous special warning", async (t) => {
    const state = prepare(t);
    await accept(telegram("51", { time: "2026-10-22T01:10:00Z" }));
    for (const options of [{ time: "2026-10-22T01:02:00Z" },
        { time: "2026-10-22T01:11:00Z", status: "訓練" },
        { time: "2026-10-22T01:11:00Z", code: "840410000100" }]) {
        await accept(telegram("40", options));
    }
    assert.equal(state.series.length, 4);
    assert.equal(state.pushes.length, 1);
    assert.equal(state.sockets.length, 4);
    assert.deepEqual(state.errors, []);
});

test("training and test publications preserve their markers and isolated history", async (t) => {
    const state = prepare(t);
    for (const status of ["訓練", "試験"]) {
        await accept(telegram("51", { status }));
        await accept(telegram("22", { status, time: "2026-10-22T01:01:00Z" }));
    }
    assert.equal(state.pushes.length, 4);
    assert.ok(state.pushes.every((job) => job.level === 3 && job.title.startsWith("【")));
    assert.match(state.pushes[1].title, /降级 · 泛滥注意报/);
    assert.equal(new Set(state.series.map((row) => row.key)).size, 1);
    assert.deepEqual(state.errors, []);
});

test("shared-key history selects the latest eligible publication rather than the last inserted row", async (t) => {
    const state = prepare(t);
    await accept(telegram("51", { time: "2026-10-22T01:00:00Z" }));
    await accept(telegram("40", { time: "2026-10-22T01:02:00Z" }));
    await accept(telegram("51", { time: "2026-10-22T00:59:00Z" }));
    await accept(telegram("51", { time: "2026-10-22T01:02:30Z", status: "訓練" }));
    await accept(telegram("51", { time: "2026-10-22T01:10:00Z" }));
    delete require.cache[require.resolve("../api/services/EventParser/JMAFlood")];
    await accept(telegram("31", { time: "2026-10-22T01:03:00Z" }));
    assert.equal(state.series.length, 6);
    assert.equal(new Set(state.series.map((row) => row.key)).size, 1);
    assert.equal(state.pushes.length, 5);
    assert.equal(JSON.parse(state.series[5].data).specialRelated, undefined);
    assert.deepEqual(state.errors, []);
});

test("same-time publications resolve announcement, correction and cancellation in telegram order", async (t) => {
    const state = prepare(t);
    await accept(telegram());
    await accept(telegram("40", { infoType: "訂正" }));
    await accept(telegram()); // A delayed original must not replace its correction as history.
    await accept(telegram(null, { infoType: "取消" }));
    assert.equal(state.pushes.length, 4);
    const warning = JSON.parse(state.http.mock.calls[3].arguments[1].warning);
    assert.equal(warning.rivers[0].kind, "40");
    assert.equal(warning.infoType, "取消");
    await accept(telegram("31", { time: "2026-10-22T01:01:00Z", serial: "2" }));
    assert.equal(state.pushes.length, 4);
    assert.equal(state.series.length, 5);
    assert.deepEqual(state.errors, []);
});

test("the parser excludes later stored rows at the same publication time and never writes push decisions back to history", async (t) => {
    const state = prepare(t);
    const ordinary = telegram("40"), special = telegram("51");
    for (const input of [ordinary, special]) {
        await postProcess.doPostProcess({ publisher: "JMAFlood", hash: input.hash, data: JSON.stringify(input.data) });
    }
    const before = structuredClone(state.series);
    assert.deepEqual(await parser.parse(ordinary), []);
    assert.equal((await parser.parse(special)).length, 1);
    assert.equal(state.http.mock.calls.length, 1);
    assert.deepEqual(state.series, before);
});

test("intake stays responsive while same-river time-series writes and history decisions remain ordered", async (t) => {
    const state = prepare(t);
    let release, started;
    const gate = new Promise((done) => { release = done; });
    const writing = new Promise((done) => { started = done; });
    t.after(async () => { release(); await flush(); });
    let writes = 0;
    state.beforeSeriesWrite = async () => { if (++writes === 1) { started(); await gate; } };
    const submitted = submit([telegram(), telegram("40", { time: "2026-10-22T01:01:00Z" })]);
    await writing;
    const result = await Promise.race([submitted, new Promise((_, reject) =>
        setImmediate(() => reject(new Error("Intake waited for history writes"))))]);
    assert.equal(result.status, 200);
    assert.equal(state.series.length, 0);
    assert.equal(state.sockets.length, 2);
    assert.equal(state.http.mock.calls.length, 0);
    release();
    await flush();
    assert.equal(state.series.length, 2);
    assert.equal(state.pushes.length, 2);
    assert.match(state.pushes[1].title, /降级/);
});

test("history write failure prevents social dispatch and releases the write queue for the next publication", async (t) => {
    const state = prepare(t);
    const error = new Error("Time-series storage unavailable");
    state.beforeSeriesWrite = async () => { throw error; };
    await accept(telegram());
    assert.deepEqual(state.errors, [error]);
    assert.equal(state.series.length, 0);
    assert.equal(state.sockets.length, 1);
    assert.equal(state.http.mock.calls.length, 0);
    state.beforeSeriesWrite = null;
    await accept(telegram("53", { time: "2026-10-22T01:01:00Z" }));
    assert.equal(state.pushes.length, 1);
});

test("render failures retain raw data and history; missing paths never become text-only pushes", async (t) => {
    const state = prepare(t);
    state.http.mock.restore();
    const error = new Error("Map renderer unavailable");
    t.mock.method(axios, "post", async () => { throw error; });
    const input = telegram();
    await accept(input);
    assert.equal(state.records.length, 1);
    assert.equal(state.series.length, 1);
    assert.equal(state.pushes.length, 0);
    assert.deepEqual(state.errors, [error]);
    const post = t.mock.method(axios, "post", async () => ({ data: {} }));
    await assert.rejects(parser.parse(input), /洪水地图未返回图片路径/);
    post.mock.restore();
});

test("the parser suppresses a manual dispatch when its current telegram has not been stored in history", async (t) => {
    const state = prepare(t);
    assert.deepEqual(await parser.parse(fixtures[0]), []);
    assert.deepEqual(await parser.parse(fixtures[6]), []);
    assert.equal(state.http.mock.calls.length, 0);
});
