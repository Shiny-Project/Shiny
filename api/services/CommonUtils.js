module.exports = {
  /**
   * 生成一个随机Token
   */
  generateToken: function () {
    var uuid = require('node-uuid').v4();
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha1');
    return shasum.update(uuid).digest('hex');
  }
};
