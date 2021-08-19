module.exports = {
    get: async (key) => {
        const configItem = await Config.findOne(key);
        return (configItem && CommonUtils.convertType(configItem.value, configItem.contentType)) || undefined;
    },
};
