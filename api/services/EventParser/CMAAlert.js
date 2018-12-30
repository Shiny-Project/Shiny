module.exports = {
  parse: async event => {
    const encodedData = CommonUtils.encodeBase64(event);
    const path = await CommonUtils.screenshot("http://localhost:1337/push/templates/CMAAlert/index.html#" + encodedData);

    return [{
      text: `【CMA全国级气象预警速报】\r\n${event.data.content}\r\n`,
      pic: path,
      deleteImage: true
    }];
  }
};
