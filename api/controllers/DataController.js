/**
 * DataController
 *
 * @description :: Server-side logic for managing data
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  add: function (req, res) {

    try{
      var event = JSON.parse(req.param('event'));
    }
    catch(e){
      console.log(1);
      return res.error({
        'info': '参数不合法'
      })
    }
    if (!(event.spiderName && event.level && event.hash && event.data)){
      return res.error(403, 'miss parameters', {
        'info': '缺少必要参数'
      });
    }
    Data.findOne({
      hash: event.hash
    }).then(function (result) {
      if (result){
        return res.error(403, 'duplicated item', {
          'info': '事件重复'
        })
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
        return res.success();
      }).catch(function (e) {
        return res.error(500, 'database_error', {
          'info': '读写数据库错误'
        })
      })
    }).catch(function (e) {
      return res.error(500, 'database_error', {
        'info': '读写数据库错误'
      })
    })
  },
  recent: function (request, response) {
    Data.query('SELECT * FROM `data` WHERE 1 ORDER BY `id` DESC LIMIT 10', function(err, data){
      if (err){
        return response.error(500, 'database_error', '数据库错误');
      }
      data.data = JSON.parse(data.data);
      return response.success(data);
    })
  }
};
