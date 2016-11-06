/**
 * isPost
 *
 * @module      :: Policy
 * @description :: 验证是否是POST提交
 *
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
  if (req.method === 'POST') {
    next();
  }
  else {
    return res.error(405, 'need_post', '本方法需要POST提交')
  }
};
