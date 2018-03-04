module.exports = {
  parse: async (event) => {
    const encodedData = CommonUtils.encodeBase64(event);
    const path = await CommonUtils.screenshot("http://localhost:1337/push/templates/USGSEarthquake/index.html#" + encodedData);
    return [{
      text: `【USGS 地震速报】\r\n${event.data.content}\r\n${event.data.link}`,
      pic: path
    }];
  }
};
