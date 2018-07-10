/**
 * isLogin
 *
 * @module      :: Policy
 * @description :: 验证是否登录
 *
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
  if (req.param('token')) {
    // 如果采用token方式验证 则跳过其他流程
    next();
    return;
  }
  //console.log(req.session);
  if (req.session.uid) {
    next();
  }
  else {
    if (req.cookies.remenber_token && req.cookies.token && req.cookies.uid) {
      User.findOne({
        'id': req.cookies.uid
      }).then(user => {
        if (!user) {
          return res.error(403, 'need_login', '本方法需要登录');
        }
        if (EncryptionService.compare(user.id + user.password + req.cookies.remenber_token, req.cookies.token)) {
          // 登录状态有效
          req.session.uid = user.id;

          // 延长cookie有效期
          res.cookie('uid', user.id, {
            maxAge: 60 * 60 * 24 * 365
          });
          res.cookie('remenber_token', req.cookies.remenber_token, {
            maxAge: 60 * 60 * 24 * 365
          });
          res.cookie('token', req.cookies.token, {
            maxAge: 60 * 60 * 24 * 365
          });

          next();
        }
        else {
          return res.error(403, 'need_login', '本方法需要登录');
        }
      }).catch(e => {
        return res.error(403, 'need_login', '本方法需要登录');
      })
    }
    else {
      return res.error(403, 'need_login', '本方法需要登录');
    }
  }
};
