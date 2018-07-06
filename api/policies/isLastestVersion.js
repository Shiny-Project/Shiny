/**
 * isLatestVersion
 *
 * @module      :: Policy
 * @description :: 验证是否是最新版本
 *
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
  console.log(req.headers());
  next();
};
