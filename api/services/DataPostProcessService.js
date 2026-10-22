// Serialize pending writes per key; historical data stays in data_time_series.
const timeSeriesWrites = new Map();

class DataPostProcessService {
    async doPostProcess(event) {
        const { publisher, data } = event;
        const parsedData = JSON.parse(data);
        if (publisher === "JMATyphoon") {
            await this.recordJMATyphoon(parsedData);
        }
        if (publisher === "JMAFlood") {
            await this.recordJMAFlood(parsedData, event.hash);
        }
        if (publisher === "JMAVolcano") {
            await this.recordJMAVolcano(parsedData, event.hash);
        }
    }
    async recordJMAFlood(parsedData, hash) {
        const source = parsedData.flood_data;
        if (typeof source?.code !== "string" || !/^\d{12}$/.test(source.code)) {
            throw new Error("洪水电文缺少有效的河川预报区");
        }
        await this.recordTimeSeries(`jma_flood_${source.code}`, { ...source, hash });
    }
    async recordJMAVolcano(parsedData, hash) {
        const source = parsedData.volcano_data;
        if (!source) return; // Older spiders submit only the warning payload.
        if (typeof source.code !== "string" || !/^\d{3}$/.test(source.code)) {
            throw new Error("火山电文缺少有效的目标火山代码");
        }
        await this.recordTimeSeries(`jma_volcano_${source.code}`, { ...source, hash });
    }
    async recordTimeSeries(key, source) {
        const data = JSON.stringify(source);
        const previous = timeSeriesWrites.get(key) || Promise.resolve();
        const write = previous.catch(() => {}).then(() => DataTimeSeries.create({ key, data }));
        timeSeriesWrites.set(key, write);
        try {
            await write;
        } finally {
            if (timeSeriesWrites.get(key) === write) timeSeriesWrites.delete(key);
        }
    }
    async recordJMATyphoon(parsedData) {
        const { typhoon_data } = parsedData || {};
        const { current } = typhoon_data || {};
        const { number } = current || {};
        if (number) {
            try {
                await DataTimeSeries.create({
                    key: `jma_typhoon_${number}`,
                    data: JSON.stringify(typhoon_data),
                });
            } catch (e) {
                Sentry.captureException(e);
            }
        }
    }
    async recordAlert(parsedData) {
        const provinceMap = require("../constants/china_area/province_identifier_map");
        const cityMap = require("../constants/china_area/city_identifier_map");
        const dayjs = require("dayjs");
        const { alert_data: alertData } = parsedData;
        const { title, identifier, send_time: sendTime } = alertData || {};
        if (!title) {
            Sentry.captureMessage("事件数据后处理异常：缺少预警标题");
            return;
        }
        if (!identifier) {
            Sentry.captureMessage("事件数据后处理异常：缺少预警标识符");
            return;
        }
        if (!sendTime) {
            Sentry.captureMessage("事件数据后处理异常：缺少预警时间");
            return;
        }
        const regionId = identifier.slice(0, 4);
        if (!cityMap[regionId]) {
            Sentry.captureMessage("事件数据后处理异常：未知区域");
            return;
        }
        const region = cityMap[regionId];
        const regionName =
            cityMap[regionId].name === "市辖区"
                ? provinceMap[cityMap[regionId].provinceCode].name
                : cityMap[regionId].name;
        const [_, actionType, name, level] = title.match(/(发布|解除)(.+?)([红橙黄蓝]色)预警/);
        const time = dayjs(sendTime).format("YYYY-MM-DD hh:mm:ss");
        const location = regionId;
        // 数据校验
        if (!actionType || !name || !level) {
            Sentry.captureMessage("事件数据后处理异常：预警数据缺失");
            return;
        }
        if (!["发布", "解除"].includes(actionType)) {
            Sentry.captureMessage("事件数据后处理异常：预警动作不合法");
            return;
        }
        // TODO: 计算 action 值
        const createdEvent = await AlertTime.create({
            type: "china_weather_alert",
            time,
            action_type: actionType,
            name,
            level,
            location,
        });
    }
}

module.exports = new DataPostProcessService();
