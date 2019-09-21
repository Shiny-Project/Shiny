/**
 * RepositoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  /**
   * 列出全部仓库
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  list: async (request, response) => {
    try {
      const repositories = await Repository.find().populate("revisions");
      return response.success(repositories);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 创建仓库
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  create: async (request, response) => {
      const name = request.param("name");
      const description = request.param("description");
      if (!name || !description) {
        return response.error(400, "missing_parameters", "缺少必要参数");
      }
      try {
        const newRepository = await Repository.create({
          name,
          description
        }).fetch();
        return response.success(newRepository);
      } catch (e) {
        return response.error(500, "database_error", "数据库读写错误");
      }
  },
  /**
   * 更新仓库信息
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  update: async (request, response) => {
    const repositoryId = request.param("id");
    const name = request.param("name");
    const description = request.param("description");
    if (!repositoryId || !name || !description) {
      return response.error(400, "missing_parameters", "缺少必要参数");
    }
    try {
      const updatedRepository = await Repository.update({
        id: repositoryId
      }, {
        name,
        description
      }).fetch();
      return response.success(updatedRepository);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 删除仓库
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  delete: async (request, response) => {
      const repositoryId = request.param("id");
      if (!repositoryId) {
        return response.error(400, "missing_parameters", "缺少必要参数");
      }
      try {
        await Repository.destroy({
          id: repositoryId
        });
        return response.success();
      } catch (e) {
        return response.error(500, "database_error", "数据库读写错误");
      }
  },
  /**
   * GitHub WebHook
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  webhook: async (request, response) => {
    if (!CryptoService.checkGitHubWebhookSign(request.body, sails.config.common.github_webhook_secret, request.headers["x-hub-signature"])) {
      return response.error(400, "invalid_sign", "");
    }
    try {
      const repositoryName = request.body.repository.name;
      const repository = await Repository.findOne({
        name: repositoryName
      });
      if (!repository) {
        return response.error(404, "repository_not_found", "不存在的仓库");
      }
      const revision = await Revision.create({
        repository_id: repository.id,
        commit_id: request.body.after,
        status: "normal",
        compare_url: request.body.compare
      });
      return response.success(revision);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};

