const CommonUtils = require('./CommonUtils');

module.exports = {
  /**
   * 向中控发送websocket包
   * @param type
   * @param body
   */
  sendSocket: function (type, body) {
    const pusher = require('./Pusher/Websocket');
    pusher.sendSocket(type, body);
  },
  sendTeleGram: function (text) {
    const pusher = require('./Pusher/Telegram');
    pusher.sendTeleGram(text);
  },
  /**
   * 推送到社交平台
   * @param event
   * @param id
   */
  pushSocial: async function (event) {
    // Try to parse event
    let parseResults = [{
      text: undefined,
      pic: undefined
    }];
    switch (event.spiderName) {
      case 'CMAAlert': {
        const parser = require('./EventParser/CMAAlert');
        parseResults = await parser.parse(event);
        break;
      }
      case 'USGSEarthquake': {
        const parser = require('./EventParser/USGSEarthquake');
        parseResults = await parser.parse(event);
        break;
      }
      case 'Flood': {
        const parser = require('./EventParser/Flood');
        parseResults = await parser.parse(event);
        break;
      }
      case 'ew': {
        const parser = require('./EventParser/EW');
        const pusher = require('./Pusher/Weibo');
        parseResults = await parser.parse(event, pusher.sendWeibo);
        break;
      }
      case 'shindo_early_report': {
        const parser = require('./EventParser/ShindoEarlyReport');
        parseResults = await parser.parse(event);
        break;
      }
      case 'shindo_report': {
        const parser = require('./EventParser/ShindoReport');
        parseResults = await parser.parse(event);
        break;
      }
      case 'eew': {
        if (event.hash.endsWith('warning')) {
          const parser = require('./EventParser/EEW');
          parseResults = await parser.parse(event);
        } else {
          if (event.level === 4 || event.level === 5) {
            const WeiboPusher = require('./Pusher/Weibo');
            WeiboPusher.sendWeibo(`${event.data.title} : ${event.data.content}`, event.id).then(() => {
              //
            });
          }
          return;
        }
        break;
      }
      default: {
        if (event.level === 4 || event.level === 5) {
          const WeiboPusher = require('./Pusher/Weibo');
          WeiboPusher.sendWeibo(`${event.data.title} : ${event.data.content}`, event.id).then(() => {
            //
          });
        }
        return;
      }
    }
    const WeiboPusher = require('./Pusher/Weibo');
    for (const result of parseResults) {
      await WeiboPusher.sendWeibo(result.text, event.id, result.pic, result.deleteImage);
      await CommonUtils.sleep(2000);
    }
  }
};
