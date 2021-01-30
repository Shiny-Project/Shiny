const path = require("path");
module.exports = {
    /**
     * 生成一个随机Token
     */
    generateToken: function () {
        var uuid = require("node-uuid").v4();
        var crypto = require("crypto");
        var shasum = crypto.createHash("sha1");
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
        const outputPath = path.resolve(__dirname, `../../output/${prefix}-${new Date().valueOf().toString()}.png`);
        const puppeteer = require("puppeteer");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox"],
        });
        const page = await browser.newPage();
        page.setViewport({
            width: 1920,
            height: 950,
        });
        await page.goto(url);
        await page.screenshot({
            path: outputPath,
        });
        await browser.close();
        return outputPath;
    },
    // Sleep
    sleep: (time) => new Promise((resolve) => setTimeout(resolve, time)),
};
