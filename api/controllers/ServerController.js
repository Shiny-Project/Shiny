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
	  const serverName = request.param('serverName');
	  const serverHost = request.param('serverHost');
	  const serverType = request.param('serverType');
	  const serverGroup = request.param('serverGroup');
	  if (!serverHost || !serverName || !serverType || !serverGroup){
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }
    let parsedServerGroup;
    try {
	    parsedServerGroup = JSON.parse(serverGroup);
    } catch (e) {
	    return response.error(400, 'bad_server_group', 'Server Group 必须是合法的 JSON');
    }
    if (!Array.isArray(parsedServerGroup)) {
      return response.error(400, 'bad_server_group', 'Server Group 必须是数组');
    }

    try{
	    let newRecord = await Server.create({
        "name": serverName,
        "host": serverHost,
        "type": serverType,
        "serverGroup": JSON.stringify(parsedServerGroup),
        "info": '{}'
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
	    const result = await Server.find().populate('key_pair');
	    for (const server of result) {
	      server.info = JSON.parse(server.info);
      }
	    return response.success(result);
    }
    catch (e){
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
	  let serverId = request.param("serverId");
	  if (!serverId){
      return response.error(400, 'missing_parameters', '事件缺少必要参数');
    }
    try{
	    await Server.destroy({
        "id": serverId
      });
	    return response.success();
    }
    catch (e){
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};

