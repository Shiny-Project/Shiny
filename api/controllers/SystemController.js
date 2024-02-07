/**
 * SystemController
 *
 * @description :: Server-side logic for managing Systems
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { InfluxDB, flux } = require("@influxdata/influxdb-client");
const dayjs = require('dayjs');
const _ = require("lodash");
module.exports = {
    latency: async (request, response) => {
        const host = sails.config.common.INFLUXDB_HOST;
        const token = sails.config.common.INFLUXDB_TOKEN;
        const org = sails.config.common.INFLUXDB_ORG;
        const queryApi = new InfluxDB({ url: host, token }).getQueryApi(org);
        const query = flux`from(bucket: "shiny-metrics")
                            |> range(start: -1h)
                            |> filter(fn: (r) => r["_measurement"] == "ttl")
                            |> filter(fn: (r) => r["_field"] == "websocket")
                            |> filter(fn: (r) => r["location"] == "sg")
                            |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
                            |> yield(name: "mean")`;
        const result = await queryApi.collectRows(query);
        if (!result || !result.length) {
            return response.error(404, "data_not_found", "当前查询区间数据不可用");
        }
        const groupedResult = _.groupBy(result, "_time");
        const parsedResult = [];
        Object.entries(groupedResult).forEach((entry) => {
            const [key, values] = entry;
            const item = {
                time: key,
            };
            for (const value of values) {
                item[value["_field"]] = value["_value"];
            }
            parsedResult.push(item);
        });
        return response.success(parsedResult);
    },
    test: async (request, response) => {
        const records = await PushHistory.find({
            createdAt: {
                '>': dayjs().subtract(1, 'day').toISOString(),
            }
        })
        return response.success(records)
    },
};
