const assert = require("node:assert/strict");
const { test } = require("node:test");
const Sentry = require("@sentry/node");
const pushService = require("../api/services/PushService");
const parser = require("../api/services/EventParser/JMAEW");

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function history(channel, count, options = {}) {
    return Array.from({ length: count }, () => ({
        channel,
        account: "shiny",
        createdAt: new Date().toISOString(),
        ...options,
    }));
}

function prepare(t, channels, records = []) {
    const state = { pushes: [], specials: [], queries: [], messages: [], errors: [], updates: [], logs: [] };
    setGlobal(t, "PushRule", { findOne: async () => ({ rule: JSON.stringify({ channels }) }) });
    setGlobal(t, "PushHistory", {
        async find(criteria) {
            state.queries.push(criteria);
            return records.filter((record) =>
                record.account === criteria.account && criteria.channel.in.includes(record.channel) &&
                record.createdAt > criteria.createdAt[">"]);
        },
        update: (criteria) => ({ set: async (value) => state.updates.push({ criteria, value }) }),
    });
    setGlobal(t, "ShinyPushService", { push: async (payload) => {
        state.pushes.push(payload);
        return payload.channels.map((channel, index) => ({ id: index + 1, channel }));
    } });
    setGlobal(t, "PushLog", { create: async (record) => state.logs.push(record) });
    setGlobal(t, "SpecialPushService", { push: (...args) => state.specials.push(args) });
    t.mock.method(Sentry, "captureMessage", (message) => state.messages.push(message));
    t.mock.method(Sentry, "captureException", (error) => state.errors.push(error));
    return state;
}

function event(level = 3) {
    return { spiderName: "jma", level, data: { title: "预警", content: "预警正文" } };
}

test("Telegram pushes continue beyond 40 messages without consulting daily quotas", async (t) => {
    const state = prepare(t, ["telegram"], history("telegram", 100));
    await pushService.pushSocial(event(), 123);
    assert.equal(state.queries.length, 0);
    assert.equal(state.pushes.length, 1);
    assert.deepEqual(state.pushes[0].channels, ["telegram"]);
    assert.equal(state.pushes[0].account, "shiny");
    assert.equal(state.pushes[0].eventId, 123);
    assert.deepEqual(state.updates, [{ criteria: { id: { in: [1] } }, value: { event_id: 123 } }]);
    assert.equal(state.logs.length, 2);
    assert.deepEqual(state.messages, []);
    assert.deepEqual(state.errors, []);
});

test("a capped channel does not block Telegram or other channels, including special pushes", async (t) => {
    const state = prepare(t, ["weibo", "twitter", "telegram"], [
        ...history("weibo", 40), ...history("twitter", 39), ...history("telegram", 100),
    ]);
    t.mock.method(parser, "parse", async () => [{ text: "预警正文" }, { special: "ew_notice" }]);
    const input = { ...event(), spiderName: "JMAEW" };
    await pushService.pushSocial(input, 123);
    assert.equal(state.pushes.length, 1);
    assert.deepEqual(state.pushes[0].channels, ["twitter", "telegram"]);
    assert.deepEqual(state.specials, [["ew_notice", ["twitter", "telegram"], 123]]);
    assert.equal(state.messages.length, 1);
    assert.match(state.messages[0], /weibo.*本地24小时/);
    assert.deepEqual(state.queries[0].channel, { in: ["weibo", "twitter"] });
});

test("Twitter and Weibo stop at 40 recent jobs for the shiny account", async (t) => {
    const state = prepare(t, ["weibo", "twitter"], [...history("weibo", 40), ...history("twitter", 40)]);
    await pushService.pushSocial(event(), 123);
    assert.deepEqual(state.pushes, []);
    assert.deepEqual(state.specials, []);
    assert.equal(state.messages.length, 2);
});

test("other accounts and jobs older than 24 hours do not consume the current quota", async (t) => {
    const state = prepare(t, ["weibo", "twitter", "telegram"], [
        ...history("weibo", 39), ...history("twitter", 39),
        ...history("weibo", 50, { account: "other" }),
        ...history("twitter", 50, { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }),
        ...history("telegram", 100),
    ]);
    await pushService.pushSocial(event(), 123);
    assert.equal(state.pushes.length, 1);
    assert.deepEqual(state.pushes[0].channels, ["weibo", "twitter", "telegram"]);
    assert.deepEqual(state.messages, []);
    const cutoff = Date.parse(state.queries[0].createdAt[">"]);
    assert.ok(Math.abs(Date.now() - cutoff - 24 * 60 * 60 * 1000) < 5000);
});

test("level 4 messages bypass the daily quota on all channels", async (t) => {
    const state = prepare(t, ["weibo", "twitter", "telegram"], [
        ...history("weibo", 100), ...history("twitter", 100), ...history("telegram", 100),
    ]);
    await pushService.pushSocial(event(4), 123);
    assert.equal(state.queries.length, 0);
    assert.equal(state.pushes.length, 1);
    assert.deepEqual(state.pushes[0].channels, ["weibo", "twitter", "telegram"]);
    assert.deepEqual(state.messages, []);
});

test("a quota lookup failure is reported and still allows dispatch", async (t) => {
    const state = prepare(t, ["weibo", "telegram"]);
    const failure = new Error("History unavailable");
    t.mock.method(PushHistory, "find", async () => { throw failure; });
    await pushService.pushSocial(event(), 123);
    assert.equal(state.pushes.length, 1);
    assert.deepEqual(state.pushes[0].channels, ["weibo", "telegram"]);
    assert.deepEqual(state.errors, [failure]);
});
