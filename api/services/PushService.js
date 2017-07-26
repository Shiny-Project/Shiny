module.exports = {
  /**
   * 向中控发送websocket包
   * @param type
   * @param body
   */
  sendSocket: function (type, body) {
    let io = require('socket.io-client');
    let socket = io.connect('http://websocket.shiny.kotori.moe:3737', {
      reconnect: true
    });
    socket.on('connect', function () {
      socket.emit('event', JSON.stringify(body));
      socket.close();
    });

    let socket2 = io.connect('http://shiny.kotori.moe:3737', {
      reconnect: true
    });
    socket2.on('connect', function () {
      socket.emit('event', JSON.stringify(body));
      socket2.close();
    });

  },
  /**
   * 发送微博
   * @param text
   * @param id
   */
  sendWeibo: function (text, id = 0) {
    let accessKey = sails.config.common.weibo_access_key;
    let request = require('request');
    console.log(`向微博发送了自动推送 Access Token = ${accessKey}`);
    console.log();
    try{
      request.post({url: 'https://api.weibo.com/2/statuses/share.json', form: {
        access_token : accessKey,
        status : text + 'https://shiny.kotori.moe/Data/view#' + id
      }});
    }
    catch (e){
      console.log(e);
      // Whatever..
    }
  },
  sendTeleGram: function (text) {
    let request = require('request');
    let botAPIKey = sails.config.common.telegramBotAPIKey;
    let channel = sails.config.common.telegramChannal;
    try{
      request.post({
        url: `https://api.telegram.org/bot${botAPIKey}/sendMessage`,
        form: {
          chat_id: `@${channel}`,
          text: text,
          parse_mode: "HTML"
        }
      });
    }
  }
};
