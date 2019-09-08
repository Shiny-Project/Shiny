/**
 * RepositoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  list: async (request, response) => {
    try {
      const repositories = await Repository.find().populate('revisions');
      return response.success(repositories);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  webhook: async (request, response) => {
    if (!CryptoService.checkGitHubWebhookSign(request.body, sails.config.common.github_webhook_secret, request.headers['x-hub-signature'])) {
      return response.error(400, "invalid_sign", "");
    }
    try {
      const repositoryName = request.body.repository.name;
      const repository = await Repository.findOne({
        name: repositoryName
      });
      if (!repository) {
        return response.error(404, 'repository_not_found', '不存在的仓库');
      }
      const revision = await Revision.create({
        repository_id: repository.id,
        commit_id: request.body.after,
        status: 'normal',
        compare_url: request.body.compare
      });
      return response.success(revision);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};

