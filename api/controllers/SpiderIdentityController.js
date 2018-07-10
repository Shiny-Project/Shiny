/**
 * SpiderIdentityController
 *
 * @description :: Server-side logic for managing Spiders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  /**
   * 列出全部凭据
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  list: async (request, response) => {
    try {
      const identities = await SpiderIdentity.find();
      identities.forEach(identity => {
        try {
          identity.identity = JSON.parse(identity.identity)
        } catch (e) {
          identity.identity = {}
        }
      });
      return response.success(identities);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 编译凭据
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  edit: async (request, response) => {
    const identityId = request.param('identityId');
    const identity = request.param('identity');
    const name = request.param('name');
    if (!name || !identity || !identityId) {
      return response.error(400, 'missing_parameters', '事件缺少必要参数');
    }
    try {
      JSON.parse(identity);
    } catch (e) {
      return response.error(400, 'bad_json', '无法解析的JSON');
    }
    try {
      const result = await SpiderIdentity.update({
        id: identityId
      }).set({
        name,
        identity
      }).fetch();
      if (result.length > 0) {
        return response.success(result[0]);
      } else {
        return response.error(404, 'identity_not_found', '没有该凭据');
      }
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 创建凭据
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  create: async (request, response) => {
    const identity = request.param('identity');
    const name = request.param('name');
    let parsedIdentity;
    if (!name || !identity) {
      return response.error(400, 'missing_parameters', '事件缺少必要参数');
    }
    try {
      parsedIdentity = JSON.parse(identity);
    } catch (e) {
      return response.error(400, 'bad_json', '无法解析的JSON');
    }
    try {
      const result = await SpiderIdentity.create({
        name,
        identity
      });
      result.identity = parsedIdentity;
      return response.success(result);
    } catch (e) {
      console.log(e);
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 删除凭据
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  delete: async (request, response) => {
    const identityId = request.param('identityId');
    if (!identityId) {
      return response.error(400, 'missing_parameters', '事件缺少必要参数');
    }
    try {
      await SpiderIdentity.destroy({
        id: identityId
      });
      return response.success();
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};
