/**
 * isLatestVersion
 *
 * @module      :: Policy
 * @description :: 验证是否是最新版本
 *
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = async function (req, res, next) {
  if (!req.headers['x-shiny-spider-version']) {
    return res.error(403, 'missing_version_header', '需要提供Spider版本');
  } else {
    if (req.headers['x-shiny-spider-version'] === await ConfigService.get('spiderVersion')) {
      next();
    } else {
      return res.error(403, 'need_upgrade', 'Spider版本需要升级');
    }
  }
};
