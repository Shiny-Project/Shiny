/**
 * Effect.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        key: {
            type: "string",
            required: true,
        },
        value: {
            type: "string",
            required: true,
        },
        type: {
            type: "number",
            defaultsTo: 1
        },
        contentType: {
            type: "string",
        },
        start: {
            type: "ref",
            columnType: "datetime",
        },
        end: {
            type: "ref",
            columnType: "datetime",
        },
        desc: {
            type: "string",
        },
    },
};
