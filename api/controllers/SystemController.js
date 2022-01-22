/**
 * SystemController
 *
 * @description :: Server-side logic for managing Systems
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { InfluxDB, flux } = require("@influxdata/influxdb-client");
const _ = require("lodash");
module.exports = {
    status: function (request, response) {
        let status = {
            web: {
                name: "Web后端",
                status: "Working",
            },
            API: {
                name: "API",
                status: "Working",
            },
            websocket: {
                name: "推送服务",
                status: "Probably down",
            },
            spiders: {
                name: "爬虫",
                status: "Working",
            },
        };
        Data.find({})
            .sort("id desc")
            .then((data) => {
                if (data.length > 0) {
                    let lastest = data[0];
                    let diff = Math.round((new Date() - new Date(lastest.createdAt)) / 1000);
                    if (diff > 3600 * 1.5) {
                        status.spiders.status = "Probably down";
                    }
                } else {
                    status.spiders.status = "Probably down";
                }
                let io = require("socket.io-client");
                let socket = io.connect("http://websocket.shiny.kotori.moe:3737", {
                    reconnect: false,
                });
                socket.on("connect", function () {
                    status.websocket.status = "Working";
                    socket.close();
                    return response.success(status);
                });
            });
    },
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
};
