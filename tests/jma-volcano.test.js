const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const controller = require("../api/controllers/DataController");
const parser = require("../api/services/EventParser/JMAVolcano");
const pushService = require("../api/services/PushService");
// Captured from JMAVolcanoSpider using JMA's three unmodified VFVO50 samples.
const fixtures = require("./fixtures/jma-volcano.json");

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function prepare(t) {
    const state = { records: [], sockets: [], pushes: [], uploads: [], errors: [] };
    setGlobal(t, "Data", {
        findOne: async ({ hash }) => state.records.find((record) => record.hash === hash),
        create: (record) => ({ fetch: async () => {
            const saved = { ...record, id: state.records.length + 1 };
            state.records.push(saved);
            return saved;
        } }),
        update: async ({ id }, record) => Object.assign(state.records.find((item) => item.id === id), record),
    });
    setGlobal(t, "DataPostProcessService", { doPostProcess() {} });
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
    for (const [index, input] of fixtures.entries()) {
        const path = "/maps/volcano-" + input.data.warning.volcano.code + ".png";
        const record = state.records[index];
        assert.equal(record.publisher, "JMAVolcano");
        assert.equal(record.hash, input.hash);
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
});

test("map failures are reported in the background while the original event remains stored", async (t) => {
    const state = prepare(t);
    const error = new Error("Map renderer unavailable");
    t.mock.method(axios, "post", async () => { throw error; });
    const result = await submit(fixtures[0]);
    assert.equal(result.status, 200);
    await new Promise(setImmediate);
    assert.deepEqual(JSON.parse(state.records[0].data), fixtures[0].data);
    assert.deepEqual(state.errors, [error]);
    assert.deepEqual(state.pushes, []);
    assert.deepEqual(state.uploads, []);
});
