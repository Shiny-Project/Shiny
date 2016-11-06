module.exports = {
  /**
   * 摘要
   * @param string 要摘要的字符串
   * @returns string 摘要结果
   */
  doEncryption: function (string) {
    var bcrypt = require('bcryptjs');
    var salt = bcrypt.genSaltSync(8);
    return bcrypt.hashSync(string, salt);
  },
  compare: function (string, hash) {
    var bcrypt = require('bcryptjs');
    return bcrypt.compareSync(string, hash);
  }
};
