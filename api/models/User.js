/**
 * User.js
 *
 * @description :: Shiny User Definition
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    primaryKey: "id",
    attributes: {
        id: {
            autoIncrement: true,
            type: "number",
        },
        email: {
            type: "string",
        },
        password: {
            type: "string",
        },
        token: {
            type: "string",
        },
        admin: {
            type: "boolean",
        },
        fingerprint: {
            type: "string",
        },
        subscription: {
            type: "string",
            columnType: "text",
            allowNull: true,
        },
    },
};
