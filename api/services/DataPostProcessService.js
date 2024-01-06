class DataPostProcessService {
    async doPostProcess(event) {
        const { publisher, data } = event;
        const parsedData = JSON.parse(data);
        if (publisher === "JMATyphoon") {
            await this.recordJMATyphoon(parsedData);
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
