/**
 * DataTimeSeries.js
 *
 * @description :: 时间序列数据
 */

module.exports = {
    tableName: "data_time_series",
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        data: {
            type: "string",
            columnType: "text",
        },
        key: {
            type: "string",
            unique: true,
        },
    },
};
