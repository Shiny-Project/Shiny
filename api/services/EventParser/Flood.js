module.exports = {
  parse: async event => {
    const encodedData = CommonUtils.encodeBase64(event);
    const path = await CommonUtils.screenshot("http://localhost:1337/push/templates/Flood/index.html#" + encodedData);
    return [{
      text: `【洪水预警】\r\n${event.data.floodAlertTitle}\r\n`,
      pic: path,
      deleteImage: true
    }];
  }
};
