/**
 * PushController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const axios = require("axios");
const Sentry = require("@sentry/node");
const _ = require("lodash");
const AVAILABLE_CHANNELS = ["weibo", "twitter"];
module.exports = {
    /**
     * 手动 Push
     * @param {*} request
     * @param {*} response
     * @returns
     */
    push: async (request, response) => {
        const text = request.param("text");
        const channels = request.param("channel");
        const account = request.param("account");
        if (!text || !channel || !account) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        if (!Array.isArray(channels) || channels.some((channel) => !AVAILABLE_CHANNELS.includes(channel))) {
            return response.error(400, "invalid_channel", "无效的推送渠道");
        }
        try {
            // 交由 Shiny Push 进行推送
            const createdJobs = (
                await axios.post("http://push.shiny.kotori.moe/push/send", {
                    channels,
                    text,
                    account,
                })
            ).data;
            return response.success(createdJobs);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "shiny_push_error", "Shiny-Push 服务异常");
        }
    },
    /**
     * 获得可用渠道
     * @param {*} request
     * @param {*} response
     */
    channels: async (request, response) => {
        try {
            const accounts = await PushAccount.find();
            const channels = _.uniq(Array.from(accounts, (account) => account.platform));
            return response.success(channels);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
