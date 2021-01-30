const SpecialPushTexts = require("./SpecialPush/Texts");
const axios = require("axios");
module.exports = {
    /**
     * 特别文本推送
     * @param name
     * @param channels
     * @param eventId
     * @returns {Promise<void>}
     */
    push: async (name, channels, eventId) => {
        const record = await SpecialPushLog.findOne({
            name,
        });
        if (!SpecialPushTexts[name]) {
            return;
        }
        const nowTime = new Date().valueOf();
        const lastTriggerTime = new Date(record.last_trigger).valueOf();
        if (nowTime - lastTriggerTime < 600000) {
            // 冷却时间 十分钟
            return;
        }
        for (const text of SpecialPushTexts[name]) {
            try {
                // 交由 Shiny Push 进行推送
                const createdJobs = (
                    await axios.post("http://push.shiny.kotori.moe/push/send", {
                        channels: channels,
                        text,
                    })
                ).data;
                const jobIds = Array.from(createdJobs, (i) => i.id);
                // 绑定任务与事件
                await PushHistory.update({
                    id: { in: jobIds },
                }).set({
                    event_id: eventId,
                });
            } catch (e) {
                console.log("与 Shiny-Push 通信失败");
                console.log(e);
            }
            await CommonUtils.sleep(2000);
        }
        // 更新最后触发时间
        await SpecialPushLog.update(
            {
                name,
            },
            {
                last_trigger: CommonUtils.generateDateTimeByOffset(0),
            }
        );
    },
};
