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
        try {
            const result = await API.create({
                api_key: crypto.randomBytes(16).toString("hex"),
                api_secret_key: crypto.randomBytes(32).toString("hex"),
                tag: request.param("tag"),
            });
            return response.success(await API.find().populate("tag"));
        } catch (e) {
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 列出全部 应用 APIKEY - SECRET 对
     * @param request
     * @param response
     * @returns {Promise<void>}
     */
    list: async (request, response) => {
        try {
            let result = {};
            result.keyPairs = await API.find().populate("tag");
            result.serverList = await Server.find();
            response.success(result);
        } catch (e) {
            console.log(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 删除 APIKEY - SECRET 对
     * @param request
     * @param response
     * @returns {Promise<void>}
     */
    delete: async (request, response) => {
        let id = request.param("applicationId");
        if (!id) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        try {
            const result = await API.destroy({
                id: id,
            });
            await Server.update({
                key_pair: id,
            }).set({
                key_pair: null,
            });
            return response.success(result);
        } catch (e) {
            console.log(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
