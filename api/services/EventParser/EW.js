module.exports = {
  parse: async (event) => {
    const encodedData = CommonUtils.encodeBase64(event);
    const path = await CommonUtils.screenshot("http://localhost:1337/push/templates/JMA/EW.html#" + encodedData, 'ew');
    const parseResult = [];
    let text = '';
    if (!event.data.isRelease) {
      text = `【${event.data.alertType.join('、')}特别警报解除】
      ${event.data.areas.join('、')}
      `
    } else {
      text = `【${event.data.alertType.join('、')}特别警报】
      ${event.data.areas.join('、')}
      `
    }
    parseResult.push({
      text,
      pic: path
    });
    if (event.data.isRelease) {
      parseResult.push({
        special: 'ew_notice'
      });
    }
    return parseResult;
  }
};
