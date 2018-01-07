/**
 * ServerController
 *
 * @description :: Server-side logic for managing Servers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 添加可用的 Shiny 服务器节点
   * @param request
   * @param response
   * @returns {Promise.<void>}
   */
	add: async (request, response) => {
	  let serverName = request.param('serverName');
	  let serverHost = request.param('serverHost');
	  let serverType = request.param('serverType');
	  if (!serverHost || !serverName || !serverType){
      return response.error(403, 'miss_parameters', '事件缺少必要参数');
    }

    try{
	    let newRecord = await Server.create({
        "name": serverName,
        "host": serverHost,
        "type": serverType
      });
	    return response.success(newRecord);
    }
    catch (e){
	    return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 列出所有的 Shiny 服务器节点
   * @param request
   * @param response
   * @returns {Promise.<void>}
   */
  list: async (request, response) => {
	  try{
	    let result = await Server.find();
	    return response.success(result);
    }
    catch (e){
	    console.log(e);
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 删除 Shiny 服务器节点
   * @param request
   * @param response
   * @returns {Promise.<void>}
   */
  delete: async (request, response) => {
	  let serverName = request.param("serverName");
	  if (!serverName){
      return response.error(403, 'miss_parameters', '事件缺少必要参数');
    }
    try{
	    await Server.destroy({
        "name": serverName
      });
	    return response.success();
    }
    catch (e){
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};

