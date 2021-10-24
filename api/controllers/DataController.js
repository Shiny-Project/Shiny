/**
 * DataController
 *
 * @description :: Server-side logic for managing data
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const Sentry = require("@sentry/node");

module.exports = {
    /**
     * 添加数据项
     * @param request
     * @param response
     */
    add: async function (request, response) {
        // 校验签名
        let events;
        let createdEvents = [];

        try {
            events = JSON.parse(request.param("event"));
        } catch (e) {
            console.log(request.param("event"));
            return response.error(400, "invalid_parameters", "参数不合法:JSON解析失败");
        }

        if (!Array.isArray(events)) {
            events = [events];
        }
        try {
            for (const event of events) {
                if (!(event.spiderName && event.level && event.hash && event.data)) {
                    return response.error(400, "missing_parameters", "事件缺少必要参数");
                }

                if (typeof event.data === "string") {
                    return response.error(400, "invalid_parameter", "请勿序列化 data 字段");
                }

                event.hash = event.hash.toString(); // 将hash统一转换为字符串

                // 查询重复事件
                const existedEvent = await Data.findOne({
                    hash: event.hash,
                });
                if (existedEvent) {
                    continue;
                }
                const eventData = event.data;
                const result = await Data.create({
                    publisher: event.spiderName,
                    channel: event.channel,
                    level: event.level,
                    hash: event.hash,
                    data: typeof event.data === "object" ? JSON.stringify(event.data) : event.data, // 字符类型入库
                }).fetch();

                createdEvents.push(result);

                if (event.level > 0) {
                    // 推送部分
                    const messageBody = {
                        level: event.level,
                        spiderName: event.spiderName,
                        channel: event.channel,
                        data: eventData, // 以object类型推送
                        hash: event.hash,
                        eventId: result.id,
                    };
                    PushService.sendSocket("normal", messageBody);
                    // 推送到微博
                    PushService.pushSocial(event, result.id);
                }
            }
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
        return response.success(createdEvents);
    },
    /**
     * 获取最新事件
     * @param request
     * @param response
     */
    recent: async function (request, response) {
        let page = request.param("page") || 1;
        let publishers = request.param("publishers");
        let condition = {};

        if (publishers) {
            condition["publisher"] = publishers.split(",");
        }

        try {
            const total = await Data.count(condition);
            const events = await Data.find(condition)
                .sort("id desc")
                .paginate(page - 1, 20);
            events.forEach((event) => {
                event.data = JSON.parse(event.data);
            });

            return response.success({
                total,
                events,
            });
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 获得近期统计
     * @param request
     * @param response
     * @returns {Promise<void>}
     */
    statistics: async (request, response) => {
        const Promise = require("bluebird");
        const _ = require("lodash");
        const DataQueryAsync = Promise.promisify(Data.getDatastore().sendNativeQuery);
        Promise.all([
            DataQueryAsync(
                "SELECT `publisher`, count(*) as count FROM `data` WHERE `createdAt` >= $1 GROUP BY `publisher` ORDER BY `count` DESC",
                [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000)]
            ),
            DataQueryAsync("SELECT `id`, `level`, `publisher`, `createdAt` FROM `data` WHERE `createdAt` >= $1", [
                CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000),
            ]),
            DataQueryAsync("SELECT `status`, count(*) as count FROM `job` WHERE `createdAt` >= $1 GROUP BY `status`", [
                CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000),
            ]),
        ])
            .then((data) => {
                let result = {};
                let recentEvents = data[1]["rows"];
                let jobStatus = data[2]["rows"];

                result["spiderRanking"] = {
                    "1day": data[0]["rows"],
                };

                let levelRanking = _.countBy(recentEvents, (i) => `Level ${i.level}`);
                result["levelRanking"] = Array.from(Object.keys(levelRanking), (key) => {
                    return {
                        level: key,
                        count: levelRanking[key],
                    };
                });

                result["jobStatus"] = jobStatus;

                return response.success(result);
            })
            .catch((e) => {
                Sentry.captureException(e);
                return response.error(500, "database_error", "数据库读写错误");
            });
    },
    /**
     * 获得事件详情和关联任务信息
     * @param {*} request
     * @param {*} response
     * @returns
     */
    detail: async (request, response) => {
        const eventId = request.param("eventId");
        if (!eventId) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        if (!Number.isInteger(parseInt(eventId))) {
            return response.error(400, "missing_parameters", "参数数据格式不正确");
        }
        try {
            const event = await Data.findOne({
                id: eventId,
            });
            if (!event) {
                return response.error(404, "event_not_found", "事件不存在");
            }
            event.data = JSON.parse(event.data);
            const jobs = await PushHistory.find({
                event_id: eventId,
            }).populate("logs");
            return response.success({
                id: event.id,
                event,
                jobs,
            });
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 事件到达回报打点
     * @param {*} request
     * @param {*} response
     */
    ack: async (request, response) => {
        const eventId = request.param("eventId");
        if (!eventId) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        if (!Number.isInteger(parseInt(eventId))) {
            return response.error(400, "missing_parameters", "参数数据格式不正确");
        }
        try {
            const result = await DataAck.create({
                event_id: eventId,
            }).fetch();
            return response.success(result);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 获得事件图片列表（公网地址）
     * @param {*} request
     * @param {*} response
     * @returns
     */
    event_images: async (request, response) => {
        const eventId = request.param("eventId");
        if (!eventId) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        if (!Number.isInteger(parseInt(eventId))) {
            return response.error(400, "missing_parameters", "参数数据格式不正确");
        }
        try {
            const event = await Data.findOne({
                id: eventId,
            });
            if (!event) {
                return response.error(404, "event_not_found", "事件不存在");
            }
            const eventData = JSON.parse(event.data);
            const images = [];
            if (eventData?.images?.length) {
                images.push(...eventData.images);
            }
            if (eventData?.shinyImages?.length) {
                images.push(...eventData.shinyImages);
            }
            if (!images.length) {
                return response.success([]);
            }
            return response.success(
                images.map((url) => {
                    return url.startsWith("/")
                        ? `${sails.config.common.IMAGE_HOST}${url.split("/").slice(-1).join()}`
                        : url;
                })
            );
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
