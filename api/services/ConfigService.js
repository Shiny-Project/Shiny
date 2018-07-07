module.exports = {
  get: async (key) => {
    const configItem = await Config.findOne(key);
    return configItem && configItem.value || undefined;
  }
};
