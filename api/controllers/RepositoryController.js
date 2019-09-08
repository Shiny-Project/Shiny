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
      console.log(e);
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};

