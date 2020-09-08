/**
 * JMAController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const { InfluxDB, flux } = require("@influxdata/influxdb-client");
const _ = require('lodash');
module.exports = {
    query: async (request, response) => {
        const allowedFactors = [
            "averagePressure",
            "averageSeaLevelPressure",
            "precipitation",
            "oneHourMaxPrecipitation",
            "tenMinuteMaxPrecipitation",
            "averageTemperature",
            "highestTemperature",
            "lowestTemperature",
            "averageHumidity",
            "lowestHumidity",
            "averageWindSpeed",
            "maximumWindSpeed",
            "maximumWindDirection",
            "maximumGustSpeed",
            "maximumGustDirection",
            "daylightHours",
            "showFall",
            "showDepth",
            "dayWeatherDescription",
            "nightWeatherDescription",
        ];
        const startTime = request.param("startTime");
        const endTime = request.param("endTime");
        const blockId = request.param("blockId");
        const factors = request.param("factors");
        if (!startTime || !endTime || !blockId || !factors) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        if (!Array.isArray(factors) || factors.length === 0) {
            return response.error(
                400,
                "bad_parameters",
                "factors 参数必须为数组且不为空"
            );
        }
        if (factors.some((i) => !allowedFactors.includes(i))) {
            return response.error(400, "bad_parameters", "factors 参数不合法");
        }
        if (factors.length > 3) {
            return response.error(400, "bad_parameters", "查询的 column 过多");
        }
        if (
            isNaN(new Date(startTime).valueOf()) ||
            isNaN(new Date(endTime).valueOf())
        ) {
            return response.error(400, "bad_time_range", "时间格式有误");
        }
        if (new Date(startTime).valueOf() > new Date(endTime).valueOf()) {
            return response.error(400, "bad_time_range", "时间格式有误");
        }
        if (
            new Date(endTime).valueOf() - new Date(startTime).valueOf() >
            180 * 24 * 60 * 60 * 1000
        ) {
            return response.error(400, "bad_time_range", "时间跨度过大");
        }
        if (
            new Date(startTime).valueOf() <
            new Date("2010-01-01 00:00:00+0900").valueOf()
        ) {
            return response.error(
                400,
                "bad_time_start_point",
                "时间起点超出范围"
            );
        }
        if (new Date(endTime).valueOf() > new Date().valueOf() + 86400 * 1000) {
            return response.error(
                400,
                "bad_time_end_point",
                "时间终点超出范围"
            );
        }
        let query =
            flux`
            from(bucket: "Weather") 
                |> range(start: ` +
            new Date(startTime).toISOString() +
            flux`, stop: ` +
            new Date(endTime).toISOString() +
            flux`)
                |> filter(fn: (r) => r._measurement == "weather")
                |> filter(fn: (r) => r.blockId == "${blockId}")
        `;
        query +=
            flux`
            |> filter(fn: (r) => ` +
            factors.map((f) => `r["_field"] == "${f}"`).join(" or ") +
            ")";
        const host = sails.config.common.INFLUXDB_HOST;
        const token = sails.config.common.INFLUXDB_TOKEN;
        const org = sails.config.common.INFLUXDB_ORG;
        const queryApi = new InfluxDB({ url: host, token }).getQueryApi(org);
        const result = await queryApi.collectRows(query);
        if (!result || !result.length) {
            return response.error(404, "data_not_found", "当前查询区间数据不可用");
        }
        const groupedResult = _.groupBy(result, '_time');
        const parsedResult = {
            blockId: +result[0].blockId,
            location: result[0].location,
            data: [],
        };
        Object.entries(groupedResult).forEach(entry => {
            const [key, values] = entry;
            const item = {
                time: key,
            };
            for (const value of values) {
                item[value['_field']] = value['_value']
            };
            parsedResult.data.push(item);
        })
        return response.success(parsedResult);
    },
};
