/**
 * JMAController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const { InfluxDB, flux } = require("@influxdata/influxdb-client");
const _ = require("lodash");
const Sentry = require("@sentry/node");
const Protobufs = require("../../../proto");
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
            return response.error(400, "bad_parameters", "factors 参数必须为数组且不为空");
        }
        if (factors.some((i) => !allowedFactors.includes(i))) {
            return response.error(400, "bad_parameters", "factors 参数不合法");
        }
        if (factors.length > 3) {
            return response.error(400, "bad_parameters", "查询的 column 过多");
        }
        if (isNaN(new Date(startTime).valueOf()) || isNaN(new Date(endTime).valueOf())) {
            return response.error(400, "bad_time_range", "时间格式有误");
        }
        if (new Date(startTime).valueOf() > new Date(endTime).valueOf()) {
            return response.error(400, "bad_time_range", "时间格式有误");
        }
        if (new Date(endTime).valueOf() - new Date(startTime).valueOf() > 365 * 24 * 60 * 60 * 1000) {
            return response.error(400, "bad_time_range", "时间跨度过大");
        }
        if (new Date(startTime).valueOf() < new Date("2010-01-01 00:00:00+0900").valueOf()) {
            return response.error(400, "bad_time_start_point", "时间起点超出范围");
        }
        if (new Date(endTime).valueOf() > Date.now() + 86400 * 1000) {
            return response.error(400, "bad_time_end_point", "时间终点超出范围");
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
        const groupedResult = _.groupBy(result, "_time");
        const parsedResult = {
            blockId: +result[0].blockId,
            location: result[0].location,
            data: [],
        };
        Object.entries(groupedResult).forEach((entry) => {
            const [key, values] = entry;
            const item = {
                time: key,
            };
            for (const value of values) {
                item[value["_field"]] = value["_value"];
            }
            parsedResult.data.push(item);
        });
        const HistoryWeatherDataResponseSchema = Protobufs.lookup("HistoryWeatherDataResponse");
        const encodedResult = HistoryWeatherDataResponseSchema.encode(parsedResult).finish();
        return response.success({
            result: Buffer.from(encodedResult).toString("base64"),
        });
    },
    queryTyphoonTimeSeries: async (request, response) => {
        const number = request.param("number");
        if (!number) {
            return response.error(404, "bad_parameters", "需要指定台风编号");
        }
        try {
            const data = await DataTimeSeries.find({
                key: `jma_typhoon_${number}`,
            }).sort("id desc");
            if (!data?.length) {
                return response.error(404, "typhoon_not_found", "台风不存在");
            }
            const current = data[0];
            const currentTyphoonRecordId = current.id;
            const parseCoordinate = (coordinateStr) => {
                if (!coordinateStr) {
                    return;
                }
                const [_, operator1, coordinate1, operator2, coordinate2] = coordinateStr.match(
                    /^([+-])([0-9.]+)([+-])([0-9.]+)\/*$/
                );
                return [parseFloat(`${operator2}${coordinate2}`), parseFloat(`${operator1}${coordinate1}`)];
            };
            const parseIntensity = (item) => {
                const typhoonClass = item.typhoon_class;
                const intensityClass = item.intensity_class;
                if (typhoonClass === "台風（TY）" || typhoonClass === "台風(TY)") {
                    if (intensityClass === "猛烈な") {
                        return 5;
                    } else if (intensityClass === "非常に強い") {
                        return 4;
                    }
                    return 3;
                } else if (typhoonClass === "台風（STS）" || typhoonClass === "台風(STS)") {
                    return 2;
                }
                return 1;
            };
            const parseAreas = (area) => {
                const result = [];
                if (!area.wide_side.radius) {
                    return result;
                }
                if (area.wide_side.direction === "全域" || area.wide_side.direction === "") {
                    result.push({
                        radius: parseInt(area.wide_side.radius) * 1000,
                        direction: 1,
                    });
                    return result;
                }
                const DirectionMap = {
                    北: 2,
                    北東: 3,
                    東: 4,
                    東南: 5,
                    南: 6,
                    西南: 7,
                    西: 8,
                    北西: 9,
                };
                if (DirectionMap[area.wide_side.direction]) {
                    result.push({
                        radius: parseInt(area.wide_side.radius) * 1000,
                        direction: DirectionMap[area.wide_side.direction],
                    });
                }
                if (area.narrow_side) {
                    if (DirectionMap[area.narrow_side.direction]) {
                        result.push({
                            radius: parseInt(area.narrow_side.radius) * 1000,
                            direction: DirectionMap[area.narrow_side.direction],
                        });
                    }
                }
                return result;
            };
            const convertCircles = (item) => {
                const result = [];
                if (item.strong_wind_area) {
                    result.push(...parseAreas(item.strong_wind_area).map((i) => ({ ...i, type: 1 })));
                }
                if (item.storm_wind_area) {
                    result.push(...parseAreas(item.storm_wind_area).map((i) => ({ ...i, type: 2 })));
                }
                return result;
            };
            const result = data.reverse().map((item, index) => {
                const { createdAt: itemTime, id, data } = item;
                const type = id === currentTyphoonRecordId ? 2 : 1;
                const itemData = JSON.parse(data);
                const parsedCoordinate = parseCoordinate(itemData.current.coordinate);
                const intensity = parseIntensity(itemData.current);
                return {
                    type,
                    coordinate: parsedCoordinate,
                    intensity,
                    ...(type === 2
                        ? {
                              circles: convertCircles(itemData.current),
                          }
                        : {}),
                };
            });
            const currentData = JSON.parse(current.data);
            if (currentData.estimations?.length) {
                result.push(
                    ...currentData.estimations.map((item) => {
                        const coordinate = parseCoordinate(item.coordinate || item.probability_circle?.base_point);
                        const intensity = parseIntensity(item);
                        return {
                            type: 3,
                            coordinate,
                            intensity,
                        };
                    })
                );
            }
            return response.success({
                result,
            });
        } catch (e) {
            //console.log(e);
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
