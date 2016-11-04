/**
 * DataController
 *
 * @description :: Server-side logic for managing data
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var crypto = require('crypto');

module.exports = {
  /**
   * 添加数据项
   * @param request
   * @param response
   */
  add: function (request, response) {
    // 校验签名
    this.auth(request, response).then(()=>{
      var event;
      if (request.param('event') && request.param('event').spiderName){
        event = request.param('event');
      }
      else{
        try{
          event = JSON.parse(request.param('event'));
        }
        catch(e){
          console.log(request.param('event'));
          return response.error(403, 'invalid_parameters', '参数不合法:JSON解析失败');
        }
      }

      if (!(event.spiderName && event.level && event.hash && event.data)){
        return response.error(403, 'miss_parameters', '事件缺少必要参数');
      }
      event.hash = event.hash.toString(); // 将hash统一转换为字符串

      // 查询重复事件
      Data.findOne({
        hash: event.hash
      }).then(function (result) {
        if (result){
          return response.error(403, 'duplicated_item', '事件重复')
        }
        console.log(typeof event.data);
        Data.create({
          publisher: event.spiderName,
          level: event.level,
          hash: event.hash,
          data: typeof event.data == 'object' ? JSON.stringify(event.data) : event.data
        }).then(function (result) {
          // 开始推送事件
          var io = require('socket.io-client');
          var socket = io.connect('http://shiny.kotori.moe:3737', {
            reconnect: true
          });
          socket.on('connect', function () {
            socket.emit('event', JSON.stringify({
              level: event.level,
              spiderName: event.spiderName,
              data: event.data,
              hash: event.hash
            }));
          });
          return response.success();
        }).catch(function (e) {
          return response.error(500, 'database_error', '数据库读写错误')
        })
      }).catch(function (e) {
        return response.error(500, 'database_error', '数据库读写错误')
      })
    }).catch(()=>{
      return response.error(403, 'invalid_sign', '非法的签名');
    })
  },
  /**
   * 获取最新事件
   * @param request
   * @param response
   */
  recent: function (request, response) {
    Data.query('SELECT * FROM `data` WHERE 1 ORDER BY `id` DESC LIMIT 10', function(err, data){
      if (err){
        return response.error(500, 'database_error', '数据库读写错误');
      }
      for (var item of data){
        try{
          item.data = JSON.parse(item.data);
        }
        catch (err){
          return response.error(500, 'parse_data_error', 'yabai!yabai!');
        }
      }
      return response.success(data);
    })
  },
  /**
   * API 签名校验
   * @param request
   * @param response
   * @returns {Promise}
   */
  auth: function(request, response){
    return new Promise((resolve, reject) => {
      var event = request.param('event');
      var APIKey = request.param('api_key');
      var sign = request.param('sign');

      if (!APIKey){
        return response.error(403, 'need_api_identification', '需要提供API_KEY');
      }

      if (!sign){
        return response.error(403, 'need_sign', '需要提供签名');
      }

      API.findOne({
        'api_key': APIKey
      }).then(api => {
        if (!api){
          return response.error(403, 'unexisted_api_key', '不存在的APIKEY');
        }

        var shasum = crypto.createHash('sha1');
        shasum.update(api.api_key + api.api_secret_key + event);
        var server_side_sign = shasum.digest('hex');
        sign = sign.toLowerCase && sign.toLowerCase() || sign;

        if (sign !== server_side_sign){
          reject();
        }
        resolve();
      })
    })
  }
};
