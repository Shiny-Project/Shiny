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
   * @param pic
   */
  sendWeibo: function (text, id = 0, pic = undefined) {
    const accessKey = sails.config.common.weibo_access_key;
    const request = require('request');
    const fs = require('fs');
    if (!pic) {
      try {
        request.post({
          url: 'https://api.weibo.com/2/statuses/share.json', form: {
            access_token: accessKey,
            status: text + 'https://shiny.kotori.moe/Data/view#' + id
          }
        }, (error, response) => {

        });
      }
      catch (e) {
        console.log(e);
        // Whatever..
      }
    } else {
      try {
        request.post({
          url: 'https://api.weibo.com/2/statuses/share.json', formData: {
            access_token: accessKey,
            status: text + 'https://shiny.kotori.moe/Data/view#' + id,
            pic: fs.createReadStream(pic)
          }
        }, (error, response) => {
          fs.unlink(pic);
        });
      }
      catch (e) {
        console.log(e);
        // Whatever..
      }
    }
  },
  sendTeleGram: function (text) {
    let request = require('request');
    let botAPIKey = sails.config.common.telegramBotAPIKey;
    let channel = sails.config.common.telegramChannel;
    try{
      request.post({
        url: `https://api.telegram.org/bot${botAPIKey}/sendMessage`,
        form: {
          chat_id: `@${channel}`,
          text: text
        }
      }, function(error, response, body){
        console.log(body);
      });
    }
    catch(e){
      console.log(e);
    }
  },
  /**
   * 推送到社交平台
   * @param event
   * @param id
   */
  pushSocial: async function(event, id = 0) {
    // Try to parse event
    let parseResults = [{
      text: undefined,
      pic: undefined
    }];
    switch (event.spiderName){
      case 'CMAAlertSpider': {
        const parser = require('./EventParser/CMAAlert');
        parseResults = await parser.parse(event);
        break;
      }
      default: {
        let text = '';
        text += `${event.data.title} : ${event.data.content}`.slice(0, 80);
        this.sendWeibo(text, id);
        return;
      }
    }
    for (const result of parseResults){
      this.sendWeibo(result.text, id, result.pic);
    }
  }
};
