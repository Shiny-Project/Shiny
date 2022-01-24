const puppeteer = require("puppeteer");
const Sentry = require("@sentry/node");

class BrowserService {
    browser = null;
    constructor() {
        (async () => {
            try {
                const browser = await puppeteer.launch({
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--ignore-certificate-errors",
                        "--no-first-run",
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                    ],
                    devtools: false,
                    defaultViewport: {
                        width: 1920,
                        height: 1080,
                    },
                });
                this.browser = browser;
                console.log("Browser initialized");
            } catch (e) {
                console.log("Browser initialization error");
                Sentry.captureException(e);
            }
        })();
    }

    async getBrowser() {
        while (!this.browser) {
            await CommonUtils.sleep(100);
        }
        return this.browser;
    }
}

module.exports = new BrowserService();
