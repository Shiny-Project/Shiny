const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const controller = require("../api/controllers/DataController");
const parser = require("../api/services/EventParser/JMAEW");

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function response() {
    return {
        error: (status, code, message) => ({ status, code, message }),
        success: (data) => ({ status: 200, data }),
    };
}

const event = (spiderName) => ({
    spiderName, level: 4, hash: "ew-test-event",
    data: { title: "特别警报", content: "生效区域：横滨市北部", warning: { active: { "33": ["1410011"] } } },
});

test("legacy ew submissions succeed silently without storage or push", async (t) => {
    setGlobal(t, "Data", new Proxy({}, { get() { throw new Error("Database must not be accessed"); } }));
    setGlobal(t, "PushService", new Proxy({}, { get() { throw new Error("Push must not be accessed"); } }));
    for (const input of [event("ew"), { spiderName: "ew" }, [event("ew"), { spiderName: "ew" }]]) {
        const result = await controller.add({ param: () => JSON.stringify(input) }, response());
        assert.deepEqual(result, { status: 200, data: [] });
    }
});

test("JMAEW submissions retain their payload when legacy ew items appear in the same batch", async (t) => {
    const input = event("JMAEW");
    let saved, pushed;
    const social = [];
    setGlobal(t, "Data", {
        findOne: async () => undefined,
        create: (record) => ({ fetch: async () => (saved = { ...record, id: 1 }) }),
    });
    setGlobal(t, "DataPostProcessService", { doPostProcess() {} });
    setGlobal(t, "PushService", {
        sendSocket(type, message) { assert.equal(type, "normal"); pushed = message; },
        pushSocial(received, id) { social.push({ received, id }); },
    });
    for (const batch of [input, [event("ew"), input, { spiderName: "ew" }]]) {
        const result = await controller.add({ param: () => JSON.stringify(batch) }, response());
        assert.equal(result.status, 200);
        assert.equal(result.data.length, 1);
        assert.equal(saved.publisher, "JMAEW");
        assert.deepEqual(JSON.parse(saved.data), input.data);
        assert.equal(pushed.spiderName, "JMAEW");
        assert.deepEqual(pushed.data.warning, input.data.warning);
        await new Promise(setImmediate);
        assert.deepEqual(social.at(-1), { received: input, id: 1 });
    }
    assert.equal(social.length, 2);
});

test("JMAEW renders through Shiny-Map and keeps the emergency notice for active normal warnings", async (t) => {
    const input = event("JMAEW");
    t.mock.method(axios, "post", async (url, data) => {
        assert.equal(url, "http://localhost:3000/Map/ew");
        assert.deepEqual(JSON.parse(data.warning), input.data.warning);
        return { data: { path: "/maps/ew.png" } };
    });
    assert.deepEqual(await parser.parse(input), [
        { text: input.data.content, pic: "/maps/ew.png" },
        { special: "ew_notice" },
    ]);
});

test("released, cancelled, training and test warnings do not trigger the emergency notice", async (t) => {
    t.mock.method(axios, "post", async () => ({ data: { path: "/maps/ew.png" } }));
    for (const warning of [
        { ended: { "33": ["1410011"] } },
        { active: { "33": ["1410011"] }, infoType: "取消" },
        { active: { "33": ["1410011"] }, status: "訓練" },
        { active: { "33": ["1410011"] }, status: "試験" },
    ]) {
        const input = event("JMAEW");
        input.data.warning = warning;
        assert.deepEqual(await parser.parse(input), [{ text: input.data.content, pic: "/maps/ew.png" }]);
    }
});

test("PushService dispatches JMAEW events to the map parser", async (t) => {
    const input = event("JMAEW");
    const parse = t.mock.method(parser, "parse", async () => []);
    t.mock.method(require("@sentry/node"), "captureMessage", () => {});
    setGlobal(t, "PushRule", { findOne: async () => null });
    await require("../api/services/PushService").pushSocial(input, 1);
    assert.equal(parse.mock.calls.length, 1);
    assert.deepEqual(parse.mock.calls[0].arguments, [input]);
});
