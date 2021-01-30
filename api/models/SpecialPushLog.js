/**
 * SpecialPushLog.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: "special_push_log",
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        name: {
            type: "string",
        },
        description: {
            type: "string",
        },
        last_trigger: {
            type: "ref",
            columnType: "datetime",
        },
    },
};
