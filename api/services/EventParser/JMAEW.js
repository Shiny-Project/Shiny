module.exports = {
    parse: async (event) => {
        const axios = require("axios");
        const response = await axios.post("http://localhost:3000/Map/ew", {
            warning: JSON.stringify(event.data.warning),
        });
        const results = [{ text: event.data.content, pic: response.data.path }];
        const warning = event.data.warning;
        if (
            (warning.status || "通常") === "通常" &&
            warning.infoType !== "取消" &&
            Object.values(warning.active || {}).some((areas) => areas.length)
        ) {
            results.push({ special: "ew_notice" });
        }
        return results;
    },
};
