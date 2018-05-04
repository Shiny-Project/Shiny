/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 绑定设备与账户或者直接注册
   * @param request
   * @param response
   * @returns {*}
   */
  create: function (request, response) {
    let email = request.param('email');
    let password = request.param('password');

    if (!email || !password) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }

    User.findOne({
      'email': email
    }).then(user => {
      if (user) {
        return response.error(403, 'user_already_existed', '用户已经存在');
      }
      else {
        // 新用户
        User.create({
          'email': email,
          'password': EncryptionService.doEncryption(password),
        }).then(newUser => {
          return response.success({
            'id': newUser.id
          })
        }).catch(err => {
          return response.error(500, 'database_error', '数据库通信错误');
        })
      }
    })
  },
  /**
   * 查询用户信息
   * @param request
   * @param response
   * @returns {*}
   */
  info: function (request, response) {
    let id = request.param('id');

    if (!id) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }


    User.findOne({
      id
    }).then(user => {
      if (!user) {
        return response.error(404, 'user_not_found', '不存在的用户')
      }
      delete user.password;
      delete user.fingerprint;
      delete user.token;
      return response.success(user);
    })
  },
  /**
   * 登录
   * @param request
   * @param response
   * @returns {*}
   */
  login: function (request, response) {
    let email = request.param('email');
    let password = request.param('password');

    if (!email || !password) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'email': email
    }).then(user => {
      if (!user) {
        return response.error(404, 'user_not_found', '不存在的用户');
      }

      if (EncryptionService.compare(password, user.password)) {
        // 登录成功
        let remember_token = CommonUtils.generateToken();
        request.session.uid = user.id;

        response.cookie('uid', user.id, {
          maxAge: 60 * 60 * 24 * 365
        });
        response.cookie('remember_token', remember_token, {
          maxAge: 60 * 60 * 24 * 365
        });
        response.cookie('token', EncryptionService.doEncryption(user.id + user.password + remember_token), {
          // uuid+密码拼接 保证 改密码后失效 并每次登陆唯一
          maxAge: 60 * 60 * 24 * 365
        });

        if (!user.token) {
          user.token = new Buffer(require('node-uuid').v4()).toString('base64');
          user.save().then(() => {
            return response.success({
              'uid': user.id,
              'token': user.token
            });
          }).catch(e => {

          });
        }
        response.success({
          token: user.token
        })
      }
      else {
        return response.error(403, 'wrong_password', '密码错误');
      }
    }).catch(e => {
      return response.error(500, 'database_error', '数据库通信错误');
    })
  },
  /**
   * 登出
   * @param request
   * @param response
   */
  logout: function (request, response) {
    request.session.uid = undefined;
    response.clearCookie('uid');
    response.clearCookie('token');
    response.clearCookie('remember_token');
    return response.success();
  },
  /**
   * 获得订阅列表
   */
  subscription: async function (request, response) {
    const token = request.param('token');
    if (!token) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }
    try {
      const user = await User.findOne({
        token
      });
      if (!user) {
        return response.error(404, 'user_not_found', '用户不存在');
      }
      if (user.subscription) {
        return response.success(JSON.parse(user.subscription));
      } else {
        return response.success([]);
      }
    } catch (e) {
      return response.error(500, 'database_error', '数据库通信错误');
    }
  },
  /**
   * 订阅
   * @param request
   * @param response
   * @returns {*}
   */
  subscribe: async function (request, response) {
    const token = request.param('token');
    const spiderName = request.param('spiderName');
    if (!token || !spiderName) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }
    try {
      const user = await User.findOne({
        token
      });
      if (!user) {
        return response.error(404, 'user_not_found', '用户不存在');
      }
      const subscription = [];
      if (user.subscription) {
        subscription.push(...JSON.parse(user.subscription));
      }
      if (subscription.includes(spiderName)) {
        return response.error(403, 'duplicated_spider', '该 Spider 已经订阅');
      }
      subscription.push(spiderName);
      await User.update({
        token
      }, {
        subscription: JSON.stringify(subscription)
      });
      return response.success(subscription);
    } catch (e) {
      return response.error(500, 'database_error', '数据库通信错误');
    }
  },
  /**
   * 取消订阅
   * @param request
   * @param response
   */
  unsubscribe: async function (request, response) {
    const token = request.param('token');
    const spiderName = request.param('spiderName');
    if (!token || !spiderName) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }
    try {
      const user = await User.findOne({
        token
      });
      if (!user) {
        return response.error(404, 'user_not_found', '用户不存在');
      }
      let subscription = [];
      if (user.subscription) {
        subscription.push(...JSON.parse(user.subscription));
      }
      if (!subscription.includes(spiderName)) {
        return response.error(403, 'duplicated_spider', '该 Spider 未被订阅');
      }
      const index = subscription.findIndex(i => i === spiderName);
      subscription = [
        ...subscription.slice(0, index),
        ...subscription.slice(index + 1)
      ];
      await User.update({
        token
      }, {
        subscription: JSON.stringify(subscription)
      });
      return response.success(subscription);
    } catch (e) {
      return response.error(500, 'database_error', '数据库通信错误');
    }
  }
};

