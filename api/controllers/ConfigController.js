/**
 * ConfigController
 *
 * @description :: Server-side logic for managing config
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * 获得设置项
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  get: async (request, response) => {
    const key = request.param('key');
    if (!key) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }
    try {
      const value = await ConfigService.get(key);
      if (!value) {
        return response.error(404, 'config_not_found', '不存在该设置项');
      }
      return response.success({
        key,
        value
      });
    } catch (e) {
      return response.error(500, 'database_error', '数据库读写错误');
    }
  },
  /**
   * 设置设置项
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  set: async (request, response) => {
    const key = request.param('key');
    const value = request.param('value');
    if (!key || !value) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }
    try {
      const configItems = await Config.update({
        key
      }).set({
        value
      }).fetch();
      if (configItems.length > 0) {
        return response.success({
          key: configItems[0].key,
          value: configItems[0].value
        });
      } else {
        return response.error(404, 'config_not_found', '不存在该设置项');
      }
    } catch (e) {
      return response.error(500, 'database_error', '数据库读写错误');
    }
  }
};
