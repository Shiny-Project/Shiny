module.exports = {
    primaryKey: "id",
    attributes: {
        id: {
            type: "number",
            autoIncrement: true,
        },
        api_key: {
            type: "string",
        },
        api_secret_key: {
            type: "string",
        },
        tag: {
            collection: "Server",
            via: "key_pair",
        },
    },
};
