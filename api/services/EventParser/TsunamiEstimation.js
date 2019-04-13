module.exports = {
  parse: async event => {
    const encodedData = CommonUtils.encodeBase64(event);
    const path = await CommonUtils.screenshot("http://localhost:1337/push/templates/TsunamiEstimation/index.html#" + encodedData);

    return [{
      text: `【海啸高度及到达时间预测】`,
      pic: path,
      deleteImage: true
    }];
  }
};
