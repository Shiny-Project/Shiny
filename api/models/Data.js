/**
 * Data.js
 *
 * @description :: 数据存储
 */

module.exports = {
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
        level: {
            type: "number",
        },
        publisher: {
            type: "string",
        },
        channel: {
            type: "string",
            allowNull: true,
        },
        hash: {
            type: "string",
        },
        keywords: {
            collection: "KeywordScore",
            via: "event",
        },
    },
};
