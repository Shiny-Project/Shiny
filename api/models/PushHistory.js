/**
 * PushHistory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: "push_history",
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        channel: {
            type: "string",
        },
        status: {
            type: "string",
        },
        info: {
            type: "string",
            columnType: "text",
            allowNull: true,
        },
        text: {
            type: "string",
            columnType: "text",
            allowNull: true,
        },
        event_id: {
            type: "number",
            allowNull: true,
        },
        image: {
            type: "string",
            columnType: "text",
            allowNull: true,
        },
        time: { type: "ref", columnType: "datetime" },
        logs: {
            collection: "pushlog",
            via: "job_id",
        },
    },
};
