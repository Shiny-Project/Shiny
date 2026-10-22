module.exports = {
    parse: async (event) => {
        const axios = require("axios");
        const { content, location, depth } = event.data;
        const response = await axios.post("http://localhost:3000/Map/earthquake", {
            earthquake: JSON.stringify({ content, location, depth, source: "USGS" }),
        }, { timeout: 30000 });
        if (typeof response.data.path !== "string" || !response.data.path) {
            throw new Error("USGS 地震地图未返回图片路径");
        }
        return [
            {
                text: `【USGS 地震速报】\r\n${event.data.content}\r\n`,
                pic: response.data.path,
            },
        ];
    },
};
