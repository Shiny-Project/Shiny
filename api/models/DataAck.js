/**
 * Data.js
 *
 * @description :: 数据存储
 */

module.exports = {
    tableName: "data_ack",
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        event_id: {
            type: "number",
        },
    },
};
