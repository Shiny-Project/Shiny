const axios = require("axios");
const Sentry = require("@sentry/node");
class ShinyPushService {
    async push(payload = {}) {
        const { channels = [], text, images = [], account } = payload;
        const createdJobs = (
            await axios.post("http://push.shiny.kotori.moe/push/send", {
                channels,
                text,
                images,
                account,
            })
        ).data;
        return createdJobs;
    }
}

module.exports = new ShinyPushService();
