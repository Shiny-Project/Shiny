module.exports = {
  /**
   * 创建新规则
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  create: async (request, response) => {
    const spiderName = request.param('spiderName');
    const rule = request.param('rule');

    if (!spiderName || !rule) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }

    try {
      const rule = await PushRule.findOne({
        spider_name: spiderName
      });
      if (rule) {
        return response.error(400, 'duplicated_rule', '该 spider 已经有规则');
      }
      JSON.parse(rule);
    } catch (e) {
      return response.response(400, 'bad_json', '无法解析JSON');
    }

    try {
      const result = await PushRule.create({
        spider_name: spiderName,
        rule
      });
      return response.success(result);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 删除规则
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  delete: async (request, response) => {
    const ruleId = request.param('id');
    if (!ruleId) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }

    try {
      await PushRule.destroy({
        id: ruleId
      });
      return response.success();
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 列出全部规则
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  list: async (request, response) => {
    try {
      const ruleList = await PushRule.find();
      for (const rule of ruleList) {
        rule.rule = JSON.parse(rule.rule);
      }
      return response.success(ruleList);
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  },
  /**
   * 编辑规则s
   * @param request
   * @param response
   * @returns {Promise<*>}
   */
  edit: async (request, response) => {
    const ruleId = request.param('id');
    const spiderName = request.param('spiderName');
    const rule = request.param('rule');

    if (!spiderName || !rule || !ruleId) {
      return response.error(400, 'missing_parameters', '缺少必要参数');
    }

    try {
      JSON.parse(rule);
    } catch (e) {
      return response.response(400, 'bad_json', '无法解析JSON');
    }

    try {
      const rule = await PushRule.findOne({
        spider_name: spiderName
      });
      if (rule) {
        return response.error(400, 'duplicated_rule', '该 spider 已经有规则');
      }
      const result = await PushRule.update({
        id: ruleId
      }).set({
        spider_name: spiderName,
        rule
      }).fetch();
      if (result.length > 0) {
        result[0].rule = JSON.parse(result[0].rule);
        return response.success(result[0]);
      } else {
        return response.error(404, 'rule_not_found', '不存在的规则');
      }
    } catch (e) {
      return response.error(500, "database_error", "数据库读写错误");
    }
  }
};
