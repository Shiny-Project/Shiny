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
  },
  /**
   * 发送微博
   * @param text
   * @param id
   * @param pic
   */
  sendWeibo: async function (text, id = 0, pic = undefined) {
    // 微博字数
    const getLength = (str) => {
      const unicodeCharacters = str.match(/[^\x00-\x80]/g) || [];
      const otherCharacters = str.replace(/[^\x00-\x80]/g, "");
      return unicodeCharacters.length + Math.floor(otherCharacters.length / 2);
    };

    // 分隔超长微博
    const splitByLength = (str, length = 100) => {
      const result = [];
      let counter = 0;
      let tempStr = "";
      for (const i of str) {
        counter += getLength(i);
        tempStr += i;
        if (counter >= length) {
          result.push(`${tempStr} https://shiny.kotori.moe/`);
          tempStr = "";
          counter = 0;
        }
      }
      if (tempStr.length > 0) {
        result.push(`${tempStr} https://shiny.kotori.moe/`);
      }
      if (result.length > 1) {
        // 多条时显示发送序号
        return result.map((v, i) => `(${i + 1}/${result.length}) ${v}`);
      } else {
        return result;
      }
    };

    const accessKey = sails.config.common.weibo_access_key;
    const request = require('request-promise');
    const fs = require('fs');
    if (!pic) {
      for (const i of splitByLength(text)) {
        try {
          await request.post({
            url: 'https://api.weibo.com/2/statuses/share.json', form: {
              access_token: accessKey,
              status: i
            }
          });
        }
        catch (e) {
          console.log(e);
          // Whatever..
        }
        await CommonUtils.sleep(1000);
      }
    } else {
      for (const i of splitByLength(text)) {
        try {
          await request.post({
            url: 'https://api.weibo.com/2/statuses/share.json', formData: {
              access_token: accessKey,
              status: i,
              pic: fs.createReadStream(pic)
            }
          });
        }
        catch (e) {
          console.log(e);
        }
        await CommonUtils.sleep(1000);
      }
      fs.unlinkSync(pic);
    }
  },
  sendTeleGram: function (text) {
    let request = require('request');
    let botAPIKey = sails.config.common.telegramBotAPIKey;
    let channel = sails.config.common.telegramChannel;
    try {
      request.post({
        url: `https://api.telegram.org/bot${botAPIKey}/sendMessage`,
        form: {
          chat_id: `@${channel}`,
          text: text
        }
      }, function (error, response, body) {
        if (error) {
          console.log(response);
        }
      });
    }
    catch (e) {
      console.log(e);
    }
  },
  /**
   * 推送到社交平台
   * @param event
   * @param id
   */
  pushSocial: async function (event, id = 0) {
    // Try to parse event
    let parseResults = [{
      text: undefined,
      pic: undefined
    }];
    switch (event.spiderName) {
      case 'CMAAlertSpider': {
        const parser = require('./EventParser/CMAAlert');
        parseResults = await parser.parse(event);
        break;
      }
      case 'USGSEarthquake': {
        const parser = require('./EventParser/USGSEarthquake');
        parseResults = await parser.parse(event);
        break;
      }
      default: {
        this.sendWeibo(`${event.data.title} : ${event.data.content}`, id);
        return;
      }
    }
    for (const result of parseResults) {
      this.sendWeibo(result.text, id, result.pic).then(() => {
        //
      });
    }
  }
};
