/**
 * SpecialPushLogControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const Sentry = require("@sentry/node");

module.exports = {
    get: async (request, response) => {
        const name = request.param("name");
        if (!name) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            const record = await SpecialPushLog.findOne({
                name,
            });
            if (!record) {
                return response.error(404, "record_not_found", "无对应记录");
            }
            return response.success(record);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    list: async (request, response) => {
        try {
            const records = await SpecialPushLog.find();
            return response.success(records);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
