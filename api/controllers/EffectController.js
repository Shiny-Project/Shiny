/**
 * EffectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Sentry = require("@sentry/node");

const EffectTypes = {
    TEMPORARY: 1,
    PERMANENT: 2,
};

module.exports = {
    list: async (request, response) => {
        try {
            const effects = await Effect.find({
                end: {
                    ">=": CommonUtils.generateDateTimeByOffset(0),
                },
            });
            return response.success(effects);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    create: async (request, response) => {
        const key = request.param("key");
        const value = request.param("value");
        const start = request.param("start");
        const end = request.param("end");
        const type = request.param("type");
        const desc = request.param("desc");
        if (!key || !value) {
            return response.error(400, "missing_parameters", "缺少必要参数");
        }
        if (+type === EffectTypes.TEMPORARY && (!start || !end)) {
            return response.error(400, "missing_parameters", "非永久有效需要指定开始结束时间");
        }
        try {
            const existedRecord = await Effect.findOne({
                key,
            });
            if (existedRecord) {
                return response.error(400, "duplicated_key", "键值重复");
            }
            const newEffect = {
                key,
                value,
                type,
                desc,
            };
            if (+type === EffectTypes.TEMPORARY) {
                newEffect.start = start;
                newEffect.end = end;
            }
            const createdEffect = await Effect.create(newEffect);
            return response.success(createdEffect);
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
            const effect = await Effect.findOne({
                key,
            });
            if (!effect) {
                return response.error(404, "effect_not_found", "键值不存在");
            }
            await effect.destroy();
            return response.success();
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
