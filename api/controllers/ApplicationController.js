/**
 * ApplicationsController
 *
 * @description :: Server-side logic for managing Applications
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 创建新 APIKEY - SECRET 对
   * @param request
   * @param response
   */
  createAPIKeyPairs: async (request, response) => {
    const crypto = require("crypto");
    let result = await API.create({
      api_key: crypto.randomBytes(16).toString("hex"),
      api_secret_key: crypto.randomBytes(32).toString("hex"),
      tag: request.param("tag")
    });
    return response.success(result)
  },
  list: async (request, response) => {
    response.success(await API.find())
  },
  delete: async (request, response) => {
    let id = request.param("id");
    if (!id){
      return response.error(400, "missing_parameters", "缺少必要参数");
    }
    let result = await API.destroy({
      id: id
    });
    return response.success(result);
  }
};
