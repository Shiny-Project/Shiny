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
    let fingerprint = request.param('fingerprint');

    if (!email || !password || !fingerprint) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }

    User.findOne({
      or: [
        {
          'fingerprint': fingerprint
        },
        {
          'email': email
        }
      ]
    }).then(user => {
      if (user) {
        if (user.email) {
          // 已经注册完了
          return response.error(403, 'binded_user', '用户已经绑定');
        }

        // 用设备指纹注册但还没有绑定密码
        User.update({
          'id': user.id
        }, {
            email: email,
            password: EncryptionService.doEncryption(password)
          }).then(newUser => {
            return response.success({
              'id': newUser.id
            });
          }).catch(err => {
            return response.error(500, 'database_error', '数据库通信错误');
          })
      }
      else {
        // 新用户
        User.create({
          'email': email,
          'password': EncryptionService.doEncryption(password),
          'fingerprint': fingerprint
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
   * 根据设备指纹注册
   * @param request
   * @param response
   * @returns {*}
   */
  createByFingerprint: function (request, response) {
    let fingerprint = request.param('fingerprint');
    if (!fingerprint) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'fingerprint': fingerprint
    }).then(user => {
      if (user) {
        return response.error(403, 'existed_device', '设备已经被注册');
      }

      User.create({
        'fingerprint': fingerprint
      }).then(user => {
        return response.success({
          'uid': user.id
        });
      })
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
    let fingerprint = request.param('fingerprint');

    if (!id && !fingerprint) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }


    User.findOne({
      'or': [
        {
          'id': id || ''
        },
        {
          'fingerprint': fingerprint || ''
        }
      ]
    }).populate('subscriptions').then(user => {
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
    let fingerprint = request.param('fingerprint');

    if (!((email && password) || fingerprint)) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }

    if (fingerprint) {
      User.findOne({
        'fingerprint': fingerprint
      }).then(user => {
        if (!user) {
          return response.error(403, 'device_not_found', '未注册的设备');
        }

        if (user.email) {
          return response.error(403, 'binded_user', '已经绑定的用户只能使用密码登录');
        }
        request.session.uid = user.id;

        response.cookie('uid', user.id, {
          maxAge: 60 * 60 * 24 * 365
        });



        return response.success({
          'uid': user.id
        });
      })
    }
    else {
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

          user.token = new Buffer(require('node-uuid').v4()).toString('base64');

          user.save().then(() => {
            return response.success({
              'uid': user.id,
              'token': user.token
            });
          }).catch(e => {

          });
        }
        else {
          return response.error(403, 'wrong_password', '密码错误');
        }
      })
    }
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
  isLogin: function (request, response) {
    return response.success();
  },
  controlPanel: function (request, response) {
    return response.view('controlPanel');
  },
  /**
   * 判断是否已经绑定
   * @param request
   * @param response
   * @returns {*}
   */
  isBinded: function (request, response) {
    let fingerprint = request.param('fingerprint');

    if (!fingerprint) {
      return response.error(400, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'fingerprint': fingerprint
    }).then(user => {
      if (user && user.email) {
        return response.success({
          'isBinded': true
        });
      }
      return response.success({
        'isBinded': false
      });
    })
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

