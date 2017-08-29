/**
 * SpiderController
 *
 * @description :: Server-side logic for managing Spiders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 获取列表
   * @param request
   * @param response
   */
	list:function (request, response) {
    SpiderInfo.find().then(list=>{
      return response.success(list);
    })
  },
  jobs: async function (request, response) {
    let result = await Spider.find();
    let needFresh = [];
    for (let spider of result){
      let spiderInfo = JSON.parse(spider.info);
      if ((new Date() - new Date(spider.trigger_time))/1000 > spiderInfo.expires){
        needFresh.push(spider);
      }
    }
    // 更新上述时间
    result = await Spider.update({
      name: Array.from(needFresh, i => i.name)
    }, {
      trigger_time: new Date().toISOString()
    });
    return response.success(needFresh);
  }
};

