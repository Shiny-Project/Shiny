/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 创建新用户
   * @param request
   * @param response
   * @returns {*}
   */
  create: function (request, response) {
    let email = request.param('email');
    let password = request.param('password');

    if (!email || !password) {
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'email': email
    }).then(user=> {
      if (user) {
        return response.error(403, 'existed_user', '该Email已经被占用');
      }

      password = EncryptionService.doEncryption(password);

      User.create({
        'email': email,
        'password': password
      }).then(user => {
        return response.success();
      }).catch(e=> {
        return response.error();
      })

    }).catch(e=> {
      return response.error();
    })
  },
  /**
   * 查询用户信息
   * @param request
   * @param response
   * @returns {*}
   */
  info:function (request, response) {
    let id = request.param('id');

    if (!id){
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'id': id
    }).populate('subscriptions').then(user => {
      if (!user){
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
  login:function (request, response) {
    let email = request.param('email');
    let password = request.param('password');

    if (!email || !password){
      return response.error(403, 'miss_parameters', '缺少必要参数');
    }

    User.findOne({
      'email': email
    }).then(user =>{
      if (!user){
        return response.error(404, 'unexisted_user', '不存在的用户');
      }

      if (EncryptionService.compare(password, user.password)){
        // 登录成功
        let remenber_token = CommonUtils.generateToken();
        request.session.uid = user.id;

        response.cookie('uid', user.id, {
          maxAge: 60*60*24*365
        });
        response.cookie('remenber_token', remenber_token , {
          maxAge: 60*60*24*365
        });
        response.cookie('token', EncryptionService.doEncryption(user.id + user.password + remenber_token), {
          // uuid+密码拼接 保证 改密码后失效 并每次登陆唯一
          maxAge: 60*60*24*365
        });

        return response.success({
          'uid': user.id
        });
      }
      else{
        return response.error(403, 'wrong_password', '密码错误');
      }
    })
  },
  isLogin:function (request, response) {
    return response.success();
  },
  controlPanel: function (request, response) {
    return response.view('controlPanel');
  }
};

