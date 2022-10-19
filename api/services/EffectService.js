const Sentry = require("@sentry/node");
class EffectService {
    async get(key) {
        const cachedValue = CacheService.get(`effect_${key}`);
        if (cachedValue) {
            return cachedValue;
        }
        const effect = await Effect.findOne({ key });
        if (!effect) {
            return;
        }
        const effectValue = CommonUtils.convertType(effect.value, effect.contentType);
        CacheService.set(`effect_${key}`, effectValue);
        return effectValue;
    }
}

module.exports = new EffectService();
