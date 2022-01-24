const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

class SentryService {
    constructor() {
        Sentry.init({
            dsn: sails.config.common.SENTRY_DSN,
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
            ],
            tracesSampleRate: 1.0,
        });
    }
}

module.exports = new SentryService();
