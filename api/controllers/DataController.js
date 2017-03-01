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
    this.auth(request, response).then(()=>{
      let event;
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
        return response.error(403, 'miss_parameters', '事件缺少必要参数');
      }
      event.hash = event.hash.toString(); // 将hash统一转换为字符串

      // 查询重复事件
      Data.findOne({
        hash: event.hash
      }).then(function (result) {
        if (result){
          return response.error(403, 'duplicated_item', '事件重复')
        }
        let eventData = typeof event.data == 'object' ? event.data : JSON.parse(event.data);
        Data.create({
          publisher: event.spiderName,
          level: event.level,
          hash: event.hash,
          data: typeof event.data == 'object' ? JSON.stringify(event.data) : event.data // 字符类型入库
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
          if (event.level === 4 || event.level === 5){
            PushService.sendWeibo(`■■紧急速报(自动)■■ : ${typeof event.data == 'object' ? event.data.title + '  :  ' + event.data.content :
              JSON.parse(event.data).title + '  :  ' + JSON.parse(event.data.content)
              }`);
          }
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
  /**
   * 获取最新事件
   * @param request
   * @param response
   */
  recent: function (request, response) {
    let page = request.param('page')||1;
    Data.find({}).sort('id desc').paginate({page: page, limit: 10}).then(data=>{
      for (let item of data){
        try{
          item.data = JSON.parse(item.data);
        }
        catch (err){
          return response.error(500, 'parse_data_error', 'yabai!yabai!');
        }
      }
      return response.success(data);
    }).catch(e=>{
      console.log(e);
      return response.error(500, 'database_error', '数据库读写错误');
    });
  },
  /**
   * API 签名校验
   * @param request
   * @param response
   * @returns {Promise}
   */
  auth: function(request, response){
    return new Promise((resolve, reject) => {
      let event = request.param('event');
      let APIKey = request.param('api_key');
      let sign = request.param('sign');

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

        let shasum = crypto.createHash('sha1');
        shasum.update(api.api_key + api.api_secret_key + event);
        let server_side_sign = shasum.digest('hex');
        sign = sign.toLowerCase && sign.toLowerCase() || sign;

        if (sign !== server_side_sign){
          reject();
        }
        resolve();
      })
    })
  },
  view:function (request, response) {
    return response.view('data/view');
  },
  info:function (request, response) {
    let id = request.param('id');

    if(!id) {
      return response.error(403, 'miss_parameters', '事件缺少必要参数');
    }

    Data.findOne({
      id:id
    }).then(data=>{
      if (!data){
        return response.error(404, 'unexisted_item', '不存在的项目');
      }
      data.data = JSON.parse(data.data);
      return response.success(data);
    })
  },
  rate: function (request, response) {
    let eventId = request.param('eventid');
    let rate = request.param('rate');

    if (!eventId || !rate){
      return response.error(403, 'miss_parameters', '事件缺少必要参数');
    }

    rate = parseInt(rate);

    if (!(1 <= rate && rate <= 10)){
      return response.error(403, 'invalid_parameter', '参数不合法');
    }

    Rate.create({
      eventid: eventId,
      score: score
    }).then(res => {
      return response.success();
    }).catch(e => {
      console.log(e);
      return response.error(500, 'database_error', '数据库读写错误');
    })
  }
};
