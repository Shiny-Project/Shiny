const Sentry = require("@sentry/node");
module.exports = {
    /**
     * 创建
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    create: async (request, response) => {
        const platform = request.param("platform");
        const name = request.param("name");
        const credential = request.param("credential");
        if (!platform || !name || !credential) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            JSON.parse(credential);
        } catch (e) {
            return response.response(400, "bad_json", "无法解析JSON");
        }
        try {
            const result = await PushAccount.create({
                platform,
                name,
                credential,
            }).fetch();
            result.credential = JSON.parse(result.credential);
            return response.success(result);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 列出全部账号
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    list: async (request, response) => {
        try {
            const result = await PushAccount.find();
            for (const i of result) {
                i.credential = JSON.parse(i.credential);
            }
            return response.success(result);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 更新账号信息
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    edit: async (request, response) => {
        const platform = request.param("platform");
        const name = request.param("name");
        const credential = request.param("credential");
        const accountId = request.param("accountId");
        if (!platform || !name || !credential || !accountId) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            JSON.parse(credential);
        } catch (e) {
            return response.response(400, "bad_json", "无法解析JSON");
        }
        try {
            const result = await PushAccount.update({
                id: accountId,
            })
                .set({
                    platform,
                    name,
                    credential,
                })
                .fetch();
            if (result.length > 0) {
                result[0].credential = JSON.parse(result[0].credential);
                return response.success(result[0]);
            } else {
                return response.error(404, "account_not_found", "不存在的账号");
            }
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 删除账号
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    delete: async (request, response) => {
        const accountId = request.param("accountId");
        if (!accountId) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            await PushAccount.destroy({
                id: accountId,
            });
            return response.success();
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
