module.exports = {
    parse: async (event) => {
        const axios = require("axios");
        const response = await axios.post("http://localhost:3000/Map/volcano_warning", {
            warning: JSON.stringify(event.data.warning),
        });
        return [{ text: event.data.content, pic: response.data.path }];
    },
};
