const path = require("path");
const Sentry = require("@sentry/node");

module.exports = {
    /**
     * 生成一个随机Token
     */
    generateToken: function () {
        const crypto = require("crypto");
        const uuid = crypto.randomUUID();
        const shasum = crypto.createHash("sha1");
        return shasum.update(uuid).digest("hex");
    },
    /**
     * 根据偏移返回yyyy-mm-dd hh:mm:ss时间
     * @param offset
     * @returns {string}
     */
    generateDateTimeByOffset: (offset) => {
        const nowTime = new Date();
        const targetTime = new Date(nowTime.valueOf() + offset);
        return `${targetTime.getFullYear()}-${
            targetTime.getMonth() + 1 >= 10 ? targetTime.getMonth() + 1 : "0" + (targetTime.getMonth() + 1)
        }-${targetTime.getDate() >= 10 ? targetTime.getDate() : "0" + targetTime.getDate()} ${
            targetTime.getHours() >= 10 ? targetTime.getHours() : "0" + targetTime.getHours()
        }:${targetTime.getMinutes() >= 10 ? targetTime.getMinutes() : "0" + targetTime.getMinutes()}:${
            targetTime.getSeconds() >= 10 ? targetTime.getSeconds() : "0" + targetTime.getSeconds()
        }`;
    },
    /**
     * 随机文件名
     * @param extension
     * @returns {string}
     */
    generateRandomFileName: (extension = "png") => {
        return `${Math.random().toString(36).slice(3)}.${extension}`;
    },
    /**
     * 事件编码为base64
     * @param event
     * @returns {string}
     */
    encodeBase64: (event) => {
        const data = event.data;
        try {
            if (sails) {
                data.__apiKeys = sails.config.common.__apiKeys; // 插入 可能用到的 API Key
            }
        } catch (e) {
            // pass
        }
        return Buffer.from(encodeURIComponent(JSON.stringify(data))).toString("base64");
    },
    screenshot: async (url, prefix = "image") => {
        return new Promise(async (resolve) => {
            let transaction;
            let rendered = false;
            try {
                const outputPath = path.resolve(
                    __dirname,
                    `../../output/${prefix}_${new Date().valueOf().toString()}.png`
                );
                transaction = Sentry.startTransaction({
                    op: "render",
                    name: `${prefix}_${new Date().valueOf().toString()}.png`,
                });
                const browser = await BrowserService.getBrowser();
                const page = await browser.newPage();
                setTimeout(() => {
                    // Timeout
                    if (!rendered) {
                        Sentry.captureMessage("Rendering images timeout.");
                        page.close();
                        resolve();
                    }
                }, 15000);
                await page.goto(url);
                await page.screenshot({
                    path: outputPath,
                });
                await page.close();
                rendered = true;
                resolve(outputPath);
            } catch (e) {
                resolve();
                Sentry.captureException(e);
            } finally {
                transaction.finish();
            }
        });
    },
    convertType: (data, type = "string") => {
        if (type === "string") {
            return data;
        }
        if (type === "integer") {
            return parseInt(data);
        }
        if (type === "boolean") {
            return data === "true" ? true : false;
        }
        if (type === "json") {
            try {
                return JSON.parse(data);
            } catch (e) {
                // pass
            }
        }
        return data;
    },
    // Sleep
    sleep: (time) => new Promise((resolve) => setTimeout(resolve, time)),
    // 审查黑名单词替换
    replaceCensorshipWords: (text) => {
        const TextMap = {
            台湾: "中国台湾",
            尖閣諸島: "钓鱼岛",
        };
        let result = text;
        for (const key of Object.keys(TextMap)) {
            result = result.replaceAll(key, TextMap[key]);
        }
        return result;
    },
};
