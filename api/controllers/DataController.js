/**
 * DataController
 *
 * @description :: Server-side logic for managing data
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 添加数据项
   * @param request
   * @param response
   */
  add: async function (request, response) {
    // 校验签名
    let events;
    let createdEvents = [];

    try {
      events = JSON.parse(request.param('event'));
    }
    catch (e) {
      console.log(request.param('event'));
      return response.error(400, 'invalid_parameters', '参数不合法:JSON解析失败');
    }

    if (!Array.isArray(events)) {
      events = [events];
    }
    try {
      for (const event of events) {
        if (!(event.spiderName && event.level && event.hash && event.data)) {
          return response.error(400, 'missing_parameters', '事件缺少必要参数');
        }

        if (typeof event.data === "string") {
          return response.error(400, 'invalid_parameter', '请勿序列化 data 字段');
        }

        event.hash = event.hash.toString(); // 将hash统一转换为字符串

        // 查询重复事件
        const existedEvent = await Data.findOne({
          hash: event.hash
        });
        if (existedEvent) {
          continue;
        }
        const eventData = event.data;
        const result = await Data.create({
          publisher: event.spiderName,
          level: event.level,
          hash: event.hash,
          data: typeof event.data === 'object' ? JSON.stringify(event.data) : event.data // 字符类型入库
        });

        createdEvents.push(result);

        if (event.level > 0) {
          // 推送部分
          const messageBody = {
            level: event.level,
            spiderName: event.spiderName,
            data: eventData, // 以object类型推送
            hash: event.hash
          };
          PushService.sendSocket('normal', messageBody);
          // 对高优先度事件推送到微博
          if (event.level === 4 || event.level === 5) {
            PushService.pushSocial(event);
          }
          // 推送到 Telegram
          PushService.sendTeleGram(`Level.${event.level} - ${event.data.title}
${event.data.content}
${event.data.link}`);
        }
      }
    } catch (e) {
      return response.error(500, 'database_error', '数据库读写错误');
    }
    return response.success(createdEvents);
  },
  /**
   * 获取最新事件
   * @param request
   * @param response
   */
  recent: function (request, response) {
    let page = request.param('page') || 1;
    let publishers = request.param('publishers');
    let condition = {};

    if (publishers) {
      condition['publisher'] =publishers.split(',')
    }

    Data.find(condition).sort('id desc').paginate({page: page, limit: 20}).then(data => {
      for (let item of data) {
        try {
          item.data = JSON.parse(item.data);
        }
        catch (err) {
          return response.error(500, 'parse_data_error', 'yabai!yabai!');
        }
      }
      return response.success(data);
    }).catch(e => {
      console.log(e);
      return response.error(500, 'database_error', '数据库读写错误');
    });
  },
  view: function (request, response) {
    return response.view('data/view');
  },
  info: function (request, response) {
    let id = request.param('id');

    if (!id) {
      return response.error(403, 'miss_parameters', '事件缺少必要参数');
    }

    Data.findOne({
      id: id
    }).populate('keywords').then(data => {
      if (!data) {
        return response.error(404, 'unexisted_item', '不存在的项目');
      }
      data.data = JSON.parse(data.data);
      return response.success(data);
    })
  },
  /**
   * 评价事件重要度
   * @param request
   * @param response
   */
  rate: function (request, response) {
    let eventId = request.param('eventId');
    let score = request.param('score');

    if (!eventId || !score) {
      return response.error(403, 'miss_parameters', '事件缺少必要参数');
    }

    score = parseInt(score);

    if (!(1 <= score && score <= 10)) {
      return response.error(403, 'invalid_parameter', '参数不合法');
    }

    Rate.create({
      eventid: eventId,
      score: score
    }).then(res => {
      return response.success();
    }).catch(e => {
      return response.error(500, 'database_error', '数据库读写错误');
    })
  },
  /**
   * 获得近期统计
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  statistics: async (request, response) => {
    const Promise = require("bluebird");
    const _ = require("lodash");
    const DataQueryAsync = Promise.promisify(Data.query);
    Promise.all([
      DataQueryAsync("SELECT `publisher`, count(*) as count FROM `data` WHERE `createdAt` >= ? GROUP BY `publisher` ORDER BY `count` DESC",
        [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000)]),
      DataQueryAsync("SELECT `publisher`, count(*) as count FROM `data` WHERE `createdAt` >= ? GROUP BY `publisher` ORDER BY `count` DESC",
        [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000 * 3)]),
      DataQueryAsync("SELECT `publisher`, count(*) as count FROM `data` WHERE `createdAt` >= ? GROUP BY `publisher` ORDER BY `count` DESC",
        [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000 * 21)]),
      DataQueryAsync("SELECT `id`, `level`, `publisher`, `createdAt` FROM `data` WHERE `createdAt` >= ?",
        [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000 * 30)]),
      DataQueryAsync("SELECT `status`, count(*) as count FROM `job` WHERE `createdAt` >= ? GROUP BY `status`",
        [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000 * 30)])
    ]).then(data => {
      let result = {};
      let recentEvents = data[3];
      let jobStatus = data[4];

      result['spiderRanking'] = {
        '1day': data[0],
        '3days': data[1],
        '21days': data[2],
      };

      let levelRanking = _.countBy(recentEvents, i => `Level ${i.level}`);
      result['levelRanking'] = Array.from(Object.keys(levelRanking), key => {
        return {
          level: key,
          count: levelRanking[key]
        }
      });

      result['jobStatus'] = jobStatus;

      return response.success(result);
    }).catch(e => {
      return response.error(500, 'database_error', '数据库读写错误');
    });
  },
  test: async (request, response) => {
    return response.success();
  }
};
