/**
 * PushLog.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: "push_log",
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
        job_id: {
            model: "pushhistory",
        },
    },
};
