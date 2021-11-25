module.exports = {
    tableName: "alert_time",
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        type: {
            type: "string",
        },
        time: { type: "ref", columnType: "datetime" },
        action: {
            type: "string",
        },
        action_type: {
            type: "string",
        },
        level: {
            type: "string",
        },
        location: {
            type: "string",
        },
    },
};
