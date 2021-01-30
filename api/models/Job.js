/**
 * Job.js
 *
 * @description :: 任务列表
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        type: {
            type: "string",
        },
        spider: {
            type: "string",
        },
        path: {
            type: "string",
        },
        info: {
            type: "string",
            columnType: "text",
            allowNull: true,
        },
        status: {
            type: "string",
        },
        done_by: {
            type: "string",
        },
    },
};
