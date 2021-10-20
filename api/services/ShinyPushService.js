const axios = require("axios");
class ShinyPushService {
    async push(payload = {}) {
        const { channels = [], text, images = [], account, eventId } = payload;
        const createdJobs = (
            await axios.post("http://push.shiny.kotori.moe/push/send", {
                channels,
                text,
                images,
                account,
                eventId,
            })
        ).data;
        return createdJobs;
    }
}

module.exports = new ShinyPushService();
