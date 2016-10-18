/**
 * DataController
 *
 * @description :: Server-side logic for managing data
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var crypto = require('crypto');

module.exports = {
  add: function (request, response) {
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
        return response.error(403, 'miss_parameters', '时间缺少必要参数');
      }
      Data.findOne({
        hash: event.hash
      }).then(function (result) {
        if (result){
          return response.error(403, 'duplicated_item', '事件重复')
        }
        Data.create({
          publisher: event.spiderName,
          level: event.level,
          hash: event.hash,
          data: JSON.stringify(event.data)
        }).then(function (result) {
          // 开始向中控发socket
          var io = require('socket.io-client');
          var socket = io.connect('http://api.kotori.moe:3737', {
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
  recent: function (request, response) {
    Data.query('SELECT * FROM `data` WHERE 1 ORDER BY `id` DESC LIMIT 10', function(err, data){
      if (err){
        return response.error(500, 'database_error', '数据库读写错误');
      }
      for (var item of data){
        item.data = JSON.parse(item.data);
      }
      return response.success(data);
    })
  },
  auth: function(request, response){
    return new Promise((resolve, reject) => {
      var APIKey = request.param('api_key');
      var sign = request.param('sign');
      var event = request.param('event') || '';

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
        sign = sign.toLowerCase && sign.toLowerCase();
        if (sign !== server_side_sign){
          reject();
        }
        resolve();
      })
    })
  }
};
