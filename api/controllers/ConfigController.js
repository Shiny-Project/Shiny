/**
 * ConfigController
 *
 * @description :: Server-side logic for managing config
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const Sentry = require("@sentry/node");

module.exports = {
    /**
     * 获得设置项
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    get: async (request, response) => {
        const key = request.param("key");
        if (!key) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            const value = await ConfigService.get(key);
            if (!value) {
                return response.error(404, "config_not_found", "不存在该设置项");
            }
            return response.success({
                key,
                value,
            });
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 设置设置项
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    edit: async (request, response) => {
        const key = request.param("key");
        const value = request.param("value");
        const contentType = request.param("contentType") || "string";
        if (!key || !value) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            const configItems = await Config.update({
                key,
            })
                .set({
                    value,
                    contentType,
                })
                .fetch();
            if (configItems.length > 0) {
                return response.success({
                    key: configItems[0].key,
                    value: CommonUtils.convertType(configItems[0].value, configItems[0].contentType),
                });
            } else {
                return response.error(404, "config_not_found", "不存在该设置项");
            }
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 列出全部设置项
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    list: async (request, response) => {
        try {
            const configItems = await Config.find();
            return response.success(
                configItems.map((item) => ({
                    ...item,
                    value: CommonUtils.convertType(item.value, item.contentType),
                }))
            );
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    delete: async (request, response) => {
        const key = request.param("key");
        if (!key) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            await Config.destroy({
                key,
            });
            return response.success();
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 创建设置项
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    create: async (request, response) => {
        const key = request.param("key");
        const value = request.param("value");
        const contentType = request.param("contentType") || "string";
        if (!key || !value) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            const configItem = await Config.findOne({
                key,
            });
            if (configItem) {
                return response.error(400, "duplicated_config", "设置项已经存在");
            }
            const createdConfig = await Config.create({
                key,
                value,
                contentType,
            }).fetch();
            return response.success(createdConfig);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
