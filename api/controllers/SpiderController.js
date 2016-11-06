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
  }
};

