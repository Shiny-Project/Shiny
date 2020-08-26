/**
 * JMAController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const { InfluxDB, FluxTableMetaData, flux } = require("@influxdata/influxdb-client");
module.exports = {
    query: (request, response) => {
        const startTime = request.param("startTime");
        const endTime = request.param("endTime");
        const blockId = request.param("blockId");
        const measurement = request.param("measurement");
        if (!startTime || !endTime || !blockId) {
            return response.error(400, "missing_parameters", "缺少必要参数");
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
        let query = flux`
            from(bucket: "Weather") 
                |> range(start: ${startTime.toISOString()}, end: ${endTime.toISOString()})
        `;
        if (measurement) {
            query += flux`
                |> filter(fn: (r) => r._measurement == ${measurement})
            `
        }
    },
};
