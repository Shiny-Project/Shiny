module.exports = {
  /**
   * 生成一个随机Token
   */
  generateToken: function () {
    var uuid = require('node-uuid').v4();
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha1');
    return shasum.update(uuid).digest('hex');
  },
  generateDateTimeByOffset: (offset) => {
    const nowTime = new Date();
    const targetTime = new Date(nowTime.valueOf() + offset);
    return `${targetTime.getFullYear()}-${
      (targetTime.getMonth() + 1) >= 10 ? (targetTime.getMonth() + 1) : '0' + (targetTime.getMonth() + 1)
    }-${
      targetTime.getDate() >= 10 ? targetTime.getDate() : '0' + targetTime.getDate()
    } ${
      targetTime.getHours() >= 10 ? targetTime.getHours() : '0' + targetTime.getHours()
    }:${
      targetTime.getMinutes() >= 10 ? targetTime.getMinutes() : '0' + targetTime.getMinutes()
    }:${
      targetTime.getSeconds() >= 10 ? targetTime.getSeconds() : '0' + targetTime.getSeconds()
    }`;
  }
};
