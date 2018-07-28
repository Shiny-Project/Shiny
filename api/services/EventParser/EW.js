module.exports = {
  parse: async (event, sendWeibo) => {
    const encodedData = CommonUtils.encodeBase64(event);
    const path = await CommonUtils.screenshot("http://localhost:1337/push/templates/JMA/EW.html#" + encodedData);
    if (!event.data.isRelease) {
      sendWeibo(`特别警报现正发表，意味着数十年一遇的气象灾害可能或正在发生。请注意人身安全，注意收听当地政府的各类通知。请保持冷静，跟随当地政府发布的避难信息行动。
      请保持高度警惕，特别警报往往意味着可能导致重大伤亡的气象灾害。`);
    }
    return [{
      text: `【特别警报】\r\n${event.data.content}\r\n${event.data.link}`,
      pic: path
    }];
  }
};