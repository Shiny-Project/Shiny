const Sentry = require("@sentry/node");
class SentryService {
    constructor() {
        Sentry.init({
            dsn: sails.config.common.SENTRY_DSN,
            tracesSampleRate: 1.0,
        });
    }
}

module.exports = new SentryService();
