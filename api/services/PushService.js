const Sentry = require("@sentry/node");
const dayjs = require("dayjs");
const _ = require("lodash");

module.exports = {
    /**
     * 向中控发送websocket包
     * @param type
     * @param body
     */
    sendSocket: function (type, body) {
        const pusher = require("./Pusher/Websocket");
        pusher.sendSocket(type, body);
    },
    /**
     * 推送到社交平台
     * @param event
     * @param eventId
     */
    pushSocial: async function (event, eventId) {
        // Try to parse event
        let parseResults = [
            {
                text: undefined,
                pic: undefined,
            },
        ];
        const parsingStartTime = new Date();
        switch (event.spiderName) {
            case "CMAAlert": {
                const parser = require("./EventParser/CMAAlert");
                parseResults = await parser.parse(event);
                break;
            }
            case "USGSEarthquake": {
                const parser = require("./EventParser/USGSEarthquake");
                parseResults = await parser.parse(event);
                break;
            }
            case "Flood": {
                const parser = require("./EventParser/Flood");
                parseResults = await parser.parse(event);
                break;
            }
            case "ew": {
                const parser = require("./EventParser/EW");
                parseResults = await parser.parse(event);
                break;
            }
            case "shindo_early_report": {
                const parser = require("./EventParser/ShindoEarlyReport");
                parseResults = await parser.parse(event);
                break;
            }
            case "shindo_report": {
                const parser = require("./EventParser/ShindoReport");
                parseResults = await parser.parse(event);
                break;
            }
            case "eew": {
                if (event.hash.endsWith("warning")) {
                    const parser = require("./EventParser/EEW");
                    parseResults = await parser.parse(event);
                } else {
                    parseResults = [
                        {
                            text: `${event.data.title} : ${event.data.content}`,
                        },
                    ];
                }
                break;
            }
            case "tsunami_warning": {
                const parser = require("./EventParser/TsunamiWarning");
                parseResults = await parser.parse(event);
                break;
            }
            case "tsunami_estimation": {
                const parser = require("./EventParser/TsunamiEstimation");
                parseResults = await parser.parse(event);
                break;
            }
            case "tsunami_observation": {
                const parser = require("./EventParser/TsunamiObservation");
                parseResults = await parser.parse(event);
                break;
            }
            case "JMATyphoon": {
                const parser = require("./EventParser/JMATyphoon");
                parseResults = await parser.parse(event);
                break;
            }
            case "jma": {
                parseResults = [
                    {
                        text: `${event.data.title} : ${event.data.content}`,
                    },
                ];
                break;
            }
            default: {
                parseResults = [
                    {
                        text: `${event.data.title} : ${event.data.content}`,
                    },
                ];
            }
        }
        const parsingEndTime = new Date();
        const pushRule = await PushRule.findOne({
            spider_name: event.spiderName,
        });
        if (!pushRule) {
            Sentry.captureMessage(`无对应推送规则 spiderName=${event.spiderName}`);
            return;
        }
        const parsedRule = JSON.parse(pushRule.rule);
        // 查询过去24小时推送数量 部分渠道有推送数量限制
        try {
            const records = await PushHistory.find({
                createdAt: {
                    ">": dayjs().subtract(1, "day").toISOString(),
                },
            });
            const groupedRecords = _.groupBy(records, "channel");
            for (const channel of parsedRule.channels) {
                if (groupedRecords[channel]) {
                    const filteredRecords = groupedRecords[channel].filter(record => record.account === 'shiny');
                    if (filteredRecords.length >= 40 && event.level <= 3) {
                        // 该渠道shiny账号24小时已经超过40条 只发送lv4以上消息
                        parseResults = [];
                    }
                }
            }

        } catch {}
        for (const item of parseResults) {
            if (item.text) {
                // 一般推送内容
                try {
                    // 交由 Shiny Push 进行推送
                    const createdJobs = await ShinyPushService.push({
                        channels: parsedRule.channels,
                        text: item.text,
                        images: item.pic ? [item.pic] : undefined,
                        eventId,
                        title: event.data.title,
                        level: event.level,
                        link: event.data.link,
                        account: "shiny"
                    });
                    const jobIds = Array.from(createdJobs, (i) => i.id);
                    // 绑定任务与事件
                    await PushHistory.update({
                        id: { in: jobIds },
                    }).set({
                        event_id: eventId,
                    });
                    try {
                        // 记录解析耗时
                        const recordPromiseArr = [];
                        for (const job of createdJobs) {
                            recordPromiseArr.push(
                                PushLog.create({
                                    channel: job.channel,
                                    status: "parsing_start",
                                    time: parsingStartTime,
                                    info: "{}",
                                    job_id: job.id,
                                })
                            );
                            recordPromiseArr.push(
                                PushLog.create({
                                    channel: job.channel,
                                    status: "parsing_end",
                                    time: parsingEndTime,
                                    info: "{}",
                                    job_id: job.id,
                                })
                            );
                        }
                        await Promise.all(recordPromiseArr);
                    } catch (e) {
                        Sentry.captureException(e);
                    }
                } catch (e) {
                    console.log("与 Shiny-Push 通信失败");
                    Sentry.captureException(e);
                }
                try {
                    if (item.pic) {
                        // 创建上传图片任务
                        await QueueService.sendMessage({
                            paths: [item.pic],
                        });
                        await Data.update(
                            {
                                id: eventId,
                            },
                            {
                                data: JSON.stringify({
                                    ...event.data,
                                    shinyImages: [item.pic],
                                }),
                            }
                        );
                    }
                } catch (e) {
                    console.log("添加上传图片任务失败");
                    Sentry.captureException(e);
                }
            }
            if (item.special) {
                // 特别推送内容
                SpecialPushService.push(item.special, parsedRule.channels, eventId);
            }
        }
    },
};
