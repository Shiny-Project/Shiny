const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const controller = require("../api/controllers/DataController");
const pushService = require("../api/services/PushService");
// Captured from JMAEruptionSpider using JMA's four unmodified VFVO56 samples.
const fixtures = require("./fixtures/jma-eruption.json");

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function prepare(t) {
    const state = { records: [], sockets: [], pushes: [], errors: [] };
    setGlobal(t, "Data", {
        findOne: async ({ hash }) => state.records.find((record) => record.hash === hash),
        create: (record) => ({ fetch: async () => {
            const saved = { ...record, id: state.records.length + 1 };
            state.records.push(saved);
            return saved;
        } }),
        update() { throw new Error("Text events must not write image paths"); },
    });
    setGlobal(t, "DataPostProcessService", { doPostProcess() {} });
    setGlobal(t, "PushService", pushService);
    setGlobal(t, "PushRule", { findOne: async ({ spider_name }) => {
        assert.equal(spider_name, "JMAEruption");
        return { rule: JSON.stringify({ channels: ["test"] }) };
    } });
    setGlobal(t, "PushHistory", { find: async () => [], update: () => ({ set: async () => {} }) });
    setGlobal(t, "ShinyPushService", { push: async (job) => {
        state.pushes.push(job);
        return [{ id: state.pushes.length, channel: "test" }];
    } });
    setGlobal(t, "PushLog", { create: async () => {} });
    setGlobal(t, "QueueService", { sendMessage() { throw new Error("Text events must not queue images"); } });
    t.mock.method(pushService, "sendSocket", (type, message) => state.sockets.push({ type, message }));
    t.mock.method(require("@sentry/node"), "captureException", (error) => state.errors.push(error));
    state.http = t.mock.method(axios, "post", async () => { throw new Error("Text events must not call Shiny-Map"); });
    return state;
}

function submit(input) {
    return controller.add({ param: () => JSON.stringify(input) }, {
        success: (data) => ({ status: 200, data }),
        error: (status, code, message) => ({ status, code, message }),
    });
}

test("official VFVO56 submissions are stored, broadcast and pushed as text without rendering or images", async (t) => {
    const state = prepare(t);
    const result = await submit(fixtures);
    assert.equal(result.status, 200);
    assert.equal(result.data.length, 4);
    await new Promise(setImmediate);
    assert.equal(state.pushes.length, 4);
    assert.equal(state.sockets.length, 4);
    assert.equal(state.http.mock.calls.length, 0);
    for (const [index, input] of fixtures.entries()) {
        const record = state.records[index];
        assert.equal(record.publisher, "JMAEruption");
        assert.equal(record.hash, input.hash);
        assert.deepEqual(JSON.parse(record.data), input.data);
        assert.deepEqual(state.sockets[index].message.data, input.data);
        const job = state.pushes.find((push) => push.eventId === record.id);
        assert.equal(job.text, input.data.content);
        assert.equal(job.title, input.data.title);
        assert.equal(job.link, input.data.link);
        assert.equal(job.images, undefined);
        assert.doesNotMatch(job.text, /^(?:喷发时间：|气象厅 .+ 发布（日本时间）)/m);
    }
    assert.match(state.pushes[0].title, /发生喷发/);
    assert.match(state.pushes[1].title, /疑似喷发/);
    assert.match(state.pushes[2].title, /订正/);
    assert.match(state.pushes[3].title, /电文取消/);
    assert.doesNotMatch(state.pushes[3].text, /喷发时间/);
    assert.deepEqual(state.errors, []);
    assert.deepEqual(await submit(fixtures), { status: 200, data: [] });
    await new Promise(setImmediate);
    assert.equal(state.pushes.length, 4);
    assert.equal(state.http.mock.calls.length, 0);
});

test("training and test eruptions retain their markers and level through text dispatch", async (t) => {
    const state = prepare(t);
    const inputs = ["訓練", "試験"].map((status) => {
        const input = structuredClone(fixtures[0]);
        input.hash += "-" + status;
        input.level = 3;
        input.data.eruption.status = status;
        const marker = status === "訓練" ? "【训练】" : "【试验】";
        input.data.title = marker + input.data.title;
        input.data.content = marker + input.data.content;
        return input;
    });
    assert.equal((await submit(inputs)).status, 200);
    await new Promise(setImmediate);
    assert.equal(state.pushes.length, 2);
    for (const [index, input] of inputs.entries()) {
        const job = state.pushes[index];
        assert.equal(job.level, 3);
        assert.equal(job.text, input.data.content);
        assert.equal(job.title, input.data.title);
        assert.equal(job.images, undefined);
    }
    assert.equal(state.http.mock.calls.length, 0);
    assert.deepEqual(state.errors, []);
});
