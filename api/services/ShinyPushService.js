const axios = require("axios");
const Sentry = require("@sentry/node");
class ShinyPushService {
    static push(payload = {}) {
        return new Promise(async (resolve, reject) => {
            const { channels = [], text, images = [], account } = payload;
            try {
                const createdJobs = (
                    await axios.post("http://push.shiny.kotori.moe/push/send", {
                        channels,
                        text,
                        images,
                        account,
                    })
                ).data;
                resolve(createdJobs);
            } catch (e) {
                Sentry.captureException(e);
                reject(e);
            }
        });
    }
}

module.exports = new ShinyPushService();
