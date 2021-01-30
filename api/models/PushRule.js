/**
 * @description :: 推送规则
 */

module.exports = {
    tableName: "push_rule",
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        spider_name: {
            type: "string",
        },
        rule: {
            type: "string",
            columnType: "text",
            defaultsTo: "{}",
        },
    },
};
