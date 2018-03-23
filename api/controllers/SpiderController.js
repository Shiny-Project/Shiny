/**
 * SpiderController
 *
 * @description :: Server-side logic for managing Spiders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 获取 Spider 列表
   * @param request
   * @param response
   */
	list:function (request, response) {
    Spider.find().then(list=>{
      const result = list.forEach(spider => {
        spider.info = JSON.parse(spider.info);
      });
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
    const spiderId = request.param('spiderId');
    const frequency = request.param('frequency');
    if (!spiderId || !frequency) {
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
  /**
   * 删除 Spider
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  delete: async function(request, response){
    const spiderId = request.param('id');
    if (!spiderId) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }
    try {
      await Spider.destroy({
        "id": spiderId
      });
      return response.success();
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};

