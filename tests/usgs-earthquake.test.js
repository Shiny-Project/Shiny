const assert = require("node:assert/strict");
const { test } = require("node:test");
const axios = require("axios");
const parser = require("../api/services/EventParser/USGSEarthquake");

test("USGS push renders through Shiny-Map and keeps the existing push text", async (t) => {
    const event = { data: {
        content: "M 6.3 - 197 km NW of Port-Olry, Vanuatu", location: "-13.9906 165.5892", depth: "-16000",
        link: "https://earthquake.usgs.gov/earthquakes/eventpage/example", __apiKeys: { GOOGLE_API_KEY: "unused" },
    } };
    const before = structuredClone(event);
    const original = axios.post;
    t.after(() => { axios.post = original; });
    axios.post = async (url, body, options) => {
        assert.equal(url, "http://localhost:3000/Map/earthquake");
        assert.deepEqual(JSON.parse(body.earthquake), {
            content: event.data.content, location: event.data.location, depth: event.data.depth, source: "USGS",
        });
        assert.equal(options.timeout, 30000);
        return { data: { path: "/maps/usgs.png" } };
    };
    assert.deepEqual(await parser.parse(event), [{
        text: `【USGS 地震速报】\r\n${event.data.content}\r\n`, pic: "/maps/usgs.png",
    }]);
    assert.deepEqual(event, before);
});

test("USGS push propagates map failures and rejects empty image paths", async (t) => {
    const original = axios.post;
    t.after(() => { axios.post = original; });
    const event = { data: { content: "M 5.0 - Japan", location: "35 139", depth: "-10000" } };
    for (const path of [undefined, null, "", 42]) {
        axios.post = async () => ({ data: { path } });
        await assert.rejects(parser.parse(event), /未返回图片路径/);
    }
    axios.post = async () => { throw new Error("Map unavailable"); };
    await assert.rejects(parser.parse(event), /Map unavailable/);
});
