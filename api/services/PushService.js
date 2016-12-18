module.exports = {
  /**
   * 向中控发送websocket包
   * @param type
   * @param body
   */
  sendSocket: function (type, body) {
    let io = require('socket.io-client');
    let socket = io.connect('http://shiny.kotori.moe:3737', {
      reconnect: true
    });
    socket.on('connect', function () {
      socket.emit('event', JSON.stringify({
        type: type,
        body: body
      }));
    });
  },
  /**
   * 发送微博
   * @param text
   */
  sendWeibo: function (text) {
    let accessKey = sails.config.common.weibo_access_key;
    let request = require('request');
    console.log(`向微博发送了自动推送 Access Token = ${accessKey}`);
    console.log();
    try{
      request.post({url: 'https://api.weibo.com/2/statuses/update.json', form: {
        access_token : accessKey,
        status : text
      }});
    }
    catch (e){
      console.log(e);
      // Whatever..
    }
  }
};
