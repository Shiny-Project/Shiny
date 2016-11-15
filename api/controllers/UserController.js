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
      return response.error(403, 'miss_parameters', '缺少必要参数');
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
    }).then(user=> {
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
        }).catch(err=> {
          return response.error(500, 'database_error', '数据库通信错误');
        })
      }
      else {
        // 新用户
        User.create({
          'email': email,
          'password': EncryptionService.doEncryption(password),
          'fingerprint': fingerprint
        }).then(newUser=> {
          return response.success({
            'id': newUser.id
          })
        }).catch(err=> {
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
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'fingerprint': fingerprint
    }).then(user=> {
      if (user) {
        return response.error(403, 'existed_device', '设备已经被注册');
      }

      User.create({
        'fingerprint': fingerprint
      }).then(user=> {
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
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }


    User.findOne({
      'or':[
        {
          'id': id || ''
        },
        {
          'fingerprint': fingerprint || ''
        }
      ]
    }).populate('subscriptions').then(user => {
      if (!user) {
        return response.error(404, 'unexisted_user', '不存在的用户')
      }
      delete user.password;
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
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    if (fingerprint){
      User.findOne({
        'fingerprint': fingerprint
      }).then(user=>{
        if (!user){
          return response.error(403, 'unexisted_device', '未注册的设备');
        }

        if (user.email){
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
    else{
      User.findOne({
        'email': email
      }).then(user => {
        if (!user) {
          return response.error(404, 'unexisted_user', '不存在的用户');
        }

        if (EncryptionService.compare(password, user.password)) {
          // 登录成功
          let remenber_token = CommonUtils.generateToken();
          request.session.uid = user.id;

          response.cookie('uid', user.id, {
            maxAge: 60 * 60 * 24 * 365
          });
          response.cookie('remenber_token', remenber_token, {
            maxAge: 60 * 60 * 24 * 365
          });
          response.cookie('token', EncryptionService.doEncryption(user.id + user.password + remenber_token), {
            // uuid+密码拼接 保证 改密码后失效 并每次登陆唯一
            maxAge: 60 * 60 * 24 * 365
          });

          return response.success({
            'uid': user.id
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
  logout:function (request, response) {
    request.session.uid = undefined;
    response.clearCookie('uid');
    response.clearCookie('token');
    response.clearCookie('remenber_token');
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
  isBinded:function (request, response) {
    let fingerprint = request.param('fingerprint');

    if (!fingerprint){
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'fingerprint': fingerprint
    }).then(user=>{
      if (user && user.email){
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
   * 订阅
   * @param request
   * @param response
   * @returns {*}
   */
  subscribe:function (request, response) {
    let uid = request.session.uid;
    let subscriptionId = request.param('subscriptionId');

    if (!subscriptionId){
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'id': uid
    }).then(user=>{
      user.subscriptions.add(subscriptionId);
      user.save().then(()=>{
        return response.success();
      }).catch(e=>{
        return response.error(500, 'database_error', '数据库通信错误');
      })
    })
  },
  unsubscribe: function (request, response) {
    let uid = request.session.uid;
    let subscriptionId = request.param('subscriptionId');

    if (!subscriptionId){
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'id': uid
    }).then(user=>{
      user.subscriptions.remove(subscriptionId);
      user.save().then(()=>{
        return response.success();
      }).catch(e=>{
        return response.error(500, 'database_error', '数据库通信错误');
      })
    })

  }
};

