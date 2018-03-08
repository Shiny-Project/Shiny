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
    Spider.find().then(list=>{
      return response.success(list);
    })
  },
  /**
   * 更新Spider刷新频率
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  updateFrequency: async function(request, response) {
    const spiderId = request.param('id');
    const frequency = request.param('frequency');
    if (!spiderId || ! frequency) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }
    try {
      await Spider.update({
        id: spiderId
      }, {
        info: JSON.stringify({
          expires: parseInt(frequency)
        })
      });
      return response.success();
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
};

