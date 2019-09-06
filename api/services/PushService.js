const CommonUtils = require('./CommonUtils');
const axios = require('axios');

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
   * @param eventId
   */
  pushSocial: async function (event, eventId) {
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
        parseResults = await parser.parse(event);
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
          parseResults = [{
            text: `${event.data.title} : ${event.data.content}`
          }];
        }
        break;
      }
      case 'tsunami_warning': {
        const parser = require('./EventParser/TsunamiWarning');
        parseResults = await parser.parse(event);
        break;
      }
      case 'tsunami_estimation': {
        const parser = require('./EventParser/TsunamiEstimation');
        parseResults = await parser.parse(event);
        break;
      }
      case 'tsunami_observation': {
        const parser = require('./EventParser/TsunamiObservation');
        parseResults = await parser.parse(event);
        break;
      }
      case 'jma': {
        parseResults = [{
          text: `${event.data.title} : ${event.data.content}`
        }];
        break;
      }
      default: {
        if (event.level === 4 || event.level === 5) {
          const WeiboPusher = require('./Pusher/Weibo');
          WeiboPusher.sendWeibo(`${event.data.title} : ${event.data.content}`, eventId).then(() => {
            //
          });
        }
        return;
      }
    }
    const pushRule = await PushRule.findOne({
      spider_name: event.spiderName
    });
    if (!pushRule) {
      // 无对应规则 fallback到旧模式
      const WeiboPusher = require('./Pusher/Weibo');
      for (const result of parseResults) {
        await WeiboPusher.sendWeibo(result.text, eventId, result.pic);
        await CommonUtils.sleep(2000);
      }
    } else {
      const parsedRule = JSON.parse(pushRule.rule);
      for (const item of parseResults) {
        if (item.text) {
          // 一般推送内容
          try {
            // 交由 Shiny Push 进行推送
            const createdJobs = (await axios.post('http://push.shiny.kotori.moe/push/send', {
              channels: parsedRule.channels,
              text: item.text,
              images: item.pic ? [item.pic] : undefined
            })).data;
            const jobIds = Array.from(createdJobs, i => i.id);
            // 绑定任务与事件
            await PushHistory.update({
              id: { in: jobIds }
            }).set({
              event_id: eventId
            });
          } catch (e) {
            console.log('与 Shiny-Push 通信失败');
            console.log(e);
          }
        }
        if (item.special) {
          // 特别推送内容
          SpecialPushService.push(item.special, parsedRule.channels, eventId);
        }
      }
    }
  }
};
