/**
 * DataController
 *
 * @description :: Server-side logic for managing data
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

let crypto = require('crypto');

module.exports = {
  /**
   * 添加数据项
   * @param request
   * @param response
   */
  add: function (request, response) {
    // 校验签名
    let event;
    if (request.param('event') && request.param('event').spiderName) {
      event = request.param('event');
    }
    else {
      try {
        event = JSON.parse(request.param('event'));
      }
      catch (e) {
        console.log(request.param('event'));
        return response.error(400, 'invalid_parameters', '参数不合法:JSON解析失败');
      }
    }

    if (!(event.spiderName && event.level && event.hash && event.data)) {
      return response.error(400, 'missing_parameters', '事件缺少必要参数');
    }

    if (typeof event.data === "string") {
      return response.error(400, 'invalid_parameter', '请勿序列化 data 字段');
    }

    event.hash = event.hash.toString(); // 将hash统一转换为字符串

    // 查询重复事件
    Data.findOne({
      hash: event.hash
    }).then(function (result) {
      if (result) {
        return response.error(403, 'duplicated_item', '事件重复')
      }
      let eventData = typeof event.data === 'object' ? event.data : JSON.parse(event.data);
      Data.create({
        publisher: event.spiderName,
        level: event.level,
        hash: event.hash,
        data: typeof event.data === 'object' ? JSON.stringify(event.data) : event.data // 字符类型入库
      }).then(function (result) {
        // 开始推送事件
        let messageBody = {
          level: event.level,
          spiderName: event.spiderName,
          data: eventData, // 以object类型推送
          hash: event.hash
        };

        PushService.sendSocket('normal', messageBody);
        // 对高优先度事件推送到微博
        if (event.level === 4 || event.level === 5) {
          PushService.sendWeibo(`■■重大事件速报■■ : ${(event.data.title + ':' + event.data.content).slice(0, 70)}`, result.id);
        }

        PushService.sendTeleGram(`Level.${event.level} - ${event.data.title}
${event.data.content}
${event.data.link}`);

        return response.success();
      }).catch(function (e) {
        return response.error(500, 'database_error', '数据库读写错误')
      })
    }).catch(function (e) {
      return response.error(500, 'database_error', '数据库读写错误')
    })
  },
  /**
   * 获取最新事件
   * @param request
   * @param response
   */
  recent: function (request, response) {
    let page = request.param('page') || 1;
    Data.find({}).sort('id desc').paginate({page: page, limit: 10}).populate('keywords').then(data => {
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
        [CommonUtils.generateDateTimeByOffset(-24 * 60 * 60 * 1000 * 30)])
    ]).then(data => {
      let result = {};
      let recentEvents = data[3];

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

      return response.success(result);
    }).catch(e => {
      return response.error(500, 'database_error', '数据库读写错误');
    });
  },
  test: (request, response) => {
    let socket = request.socket;
    let io = sails.io;

    // emit to all sockets (aka publish)
    // including yourself
    console.log(request.socket);
    io.sockets.emit('test', {thisIs: 'theMessage'});
    return response.success();
  }
};
