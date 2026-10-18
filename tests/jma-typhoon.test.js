const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const parser = require("../api/services/EventParser/JMATyphoon");
const controller = require("../api/controllers/DataController");
const weather = require("../api/controllers/Weather/JMAController");
const postProcess = require("../api/services/DataPostProcessService");
// Parsed from JMA's unmodified 10_04_03_170913_VPTW60.xml official sample.
const fixture = require("./fixtures/jma-typhoon.json");

function setGlobal(t, key, value) {
    const previous = Object.getOwnPropertyDescriptor(global, key);
    global[key] = value;
    t.after(() => previous ? Object.defineProperty(global, key, previous) : delete global[key]);
}

function event() {
    return { spiderName: "JMATyphoon", level: 3, hash: "typhoon-test", data: structuredClone(fixture) };
}

function response() {
    return {
        success: (data) => ({ status: 200, data }),
        error: (status, code, message) => ({ status, code, message }),
    };
}

function prepare(t, data = fixture.typhoon_data) {
    setGlobal(t, "CommonUtils", { replaceCensorshipWords: (text) => text });
    setGlobal(t, "DataTimeSeries", { find({ key }) {
        assert.equal(key, "jma_typhoon_1718");
        return { sort: async () => [{ id: 1, data: JSON.stringify(data) }] };
    } });
}

test("official forecasts carry all 12 error circles in meters through push and history APIs", async (t) => {
    prepare(t);
    let payload;
    t.mock.method(axios, "post", async (url, body) => {
        assert.equal(url, "http://localhost:3000/Map/typhoon_info");
        payload = JSON.parse(body.typhoon_info);
        return { data: { path: "/maps/typhoon.png" } };
    });
    const result = await parser.parse(event());
    assert.equal(result[0].pic, "/maps/typhoon.png");
    const forecasts = payload.points.filter((point) => point.type === 3);
    assert.equal(forecasts.length, 13); // One estimated position, then twelve forecasts.
    const circles = forecasts.flatMap((point) => point.circles || []);
    assert.equal(circles.length, 12);
    assert.deepEqual(circles.map((circle) => circle.radius),
        [30000, 40000, 60000, 70000, 80000, 90000, 100000, 110000, 200000, 310000, 480000, 650000]);
    for (const circle of circles) assert.equal(circle.type, 3);
    const expectedCoordinates = fixture.typhoon_data.estimations.map((point) => {
        const coordinate = point.coordinate || point.probability_circle.base_point;
        const [, latitude, longitude] = coordinate.match(/^([+-][\d.]+)([+-][\d.]+)\/$/);
        return [Number(longitude), Number(latitude)];
    });
    assert.deepEqual(forecasts.map((point) => point.coordinate), expectedCoordinates);
    const queried = await weather.queryTyphoonTimeSeries({ param: () => "1718" }, response());
    assert.equal(queried.status, 200);
    assert.deepEqual(queried.data.result, payload.points);
});

test("missing and invalid error radii keep forecast paths without emitting invalid circles", async (t) => {
    const data = structuredClone(fixture.typhoon_data);
    const radii = [undefined, null, "", " ", 0, "0", -1, "-20", "invalid", "Infinity", "1e309", "12.5"];
    const template = data.estimations.find((point) => point.probability_circle);
    data.estimations = radii.map((radius) => ({ ...template,
        probability_circle: { ...template.probability_circle, radius },
    }));
    prepare(t, data);
    let payload;
    t.mock.method(axios, "post", async (url, body) => {
        payload = JSON.parse(body.typhoon_info);
        return { data: { path: "/maps/typhoon.png" } };
    });
    await parser.parse(event());
    const forecasts = payload.points.filter((point) => point.type === 3);
    assert.equal(forecasts.length, radii.length);
    for (const point of forecasts.slice(0, -1)) assert.equal(point.circles, undefined);
    assert.deepEqual(forecasts.at(-1).circles, [{ type: 3, radius: 12500 }]);
    const queried = await weather.queryTyphoonTimeSeries({ param: () => "1718" }, response());
    assert.deepEqual(queried.data.result, payload.points);
});

function deferred() {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
}

test("submission returns and websocket publishes while social rendering waits for its time-series write", async (t) => {
    const gate = deferred(), writing = deferred(), pushed = deferred();
    t.after(async () => { gate.resolve(); await new Promise(setImmediate); });
    const records = [], requests = [];
    let sockets = 0;
    setGlobal(t, "CommonUtils", { replaceCensorshipWords: (text) => text });
    setGlobal(t, "Data", {
        findOne: async () => null,
        create: (record) => ({ fetch: async () => ({ ...record, id: 1 }) }),
    });
    setGlobal(t, "DataTimeSeries", {
        async create(record) { writing.resolve(); await gate.promise; records.push({ ...record, id: 1 }); },
        find() { return { sort: async () => records.slice() }; },
    });
    setGlobal(t, "DataPostProcessService", postProcess);
    setGlobal(t, "PushService", {
        sendSocket() { sockets++; assert.equal(records.length, 0); },
        pushSocial(input) {
            const result = parser.parse(input);
            pushed.resolve(result);
            return result;
        },
    });
    t.mock.method(axios, "post", async (url, body) => {
        requests.push(JSON.parse(body.typhoon_info));
        return { data: { path: "/maps/typhoon.png" } };
    });
    const submitted = controller.add({ param: () => JSON.stringify(event()) }, response());
    await writing.promise;
    const result = await Promise.race([
        submitted,
        new Promise((resolve, reject) => setImmediate(() => reject(new Error("Submission waited for post-processing.")))),
    ]);
    assert.equal(result.status, 200);
    assert.equal(result.data.length, 1);
    assert.equal(sockets, 1);
    assert.equal(records.length, 0);
    assert.equal(requests.length, 0);
    gate.resolve();
    const parsed = await pushed.promise;
    assert.equal(parsed[0].pic, "/maps/typhoon.png");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].remark, undefined);
    assert.equal(requests[0].points.flatMap((point) => point.circles || []).filter((circle) => circle.type === 3).length, 12);
});

test("a batch starts each background post-process once without one event delaying another", async (t) => {
    let id = 0;
    const gates = [null, deferred(), deferred()];
    const completed = [null, deferred(), deferred()];
    t.after(async () => { gates[1].resolve(); gates[2].resolve(); await new Promise(setImmediate); });
    const saves = [], sockets = [], social = [];
    setGlobal(t, "Data", {
        findOne: async () => null,
        create: (record) => ({ fetch: async () => ({ ...record, id: ++id }) }),
    });
    setGlobal(t, "DataPostProcessService", { doPostProcess(record) {
        saves.push(record.id);
        return gates[record.id].promise;
    } });
    setGlobal(t, "PushService", {
        sendSocket(type, message) { sockets.push(message.eventId); },
        pushSocial(input, recordId) { social.push(recordId); completed[recordId].resolve(); },
    });
    const first = event(), second = event();
    second.hash = "typhoon-test-next";
    second.data.typhoon_data.current.number = "1719";
    const submitted = controller.add({ param: () => JSON.stringify([first, second]) }, response());
    const result = await Promise.race([
        submitted,
        new Promise((resolve, reject) => setImmediate(() => reject(new Error("Batch waited for post-processing.")))),
    ]);
    assert.equal(result.status, 200);
    assert.equal(result.data.length, 2);
    assert.deepEqual(saves, [1, 2]);
    assert.deepEqual(sockets, [1, 2]);
    assert.deepEqual(social, []);
    gates[2].resolve();
    await completed[2].promise;
    assert.deepEqual(social, [2]);
    gates[1].resolve();
    await completed[1].promise;
    assert.deepEqual(social, [2, 1]);
});

test("background post-process and social push failures are reported without rejecting submission", async (t) => {
    const sentry = require("@sentry/node");
    const reported = [];
    t.mock.method(sentry, "captureException", (error) => { reported.push(error); });
    setGlobal(t, "Data", {
        findOne: async () => null,
        create: (record) => ({ fetch: async () => ({ ...record, id: 1 }) }),
    });
    const postError = new Error("Post-process failed");
    const pushError = new Error("Social push failed");
    let synchronous = false, sockets = 0, social = 0;
    setGlobal(t, "DataPostProcessService", { doPostProcess() {
        if (synchronous) throw postError;
        return Promise.reject(postError);
    } });
    setGlobal(t, "PushService", {
        sendSocket() { sockets++; },
        async pushSocial() { social++; throw pushError; },
    });
    for (const mode of [false, true]) {
        synchronous = mode;
        const result = await controller.add({ param: () => JSON.stringify(event()) }, response());
        assert.equal(result.status, 200);
        await new Promise(setImmediate);
    }
    assert.equal(sockets, 2);
    assert.equal(social, 2);
    assert.deepEqual(reported, [postError, pushError, postError, pushError]);
});
