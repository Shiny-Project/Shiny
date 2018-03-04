module.exports = {
  parse: async event => {
    const puppeteer = require('puppeteer');
    const encodedData = Buffer.from(
      encodeURIComponent(
        JSON.stringify({
          ...event,
          __apiKeys: sails.config.common.__apiKeys
        }.data)
      )
    ).toString('base64');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setViewport({
      width: 1920,
      height: 1080
    });
    await page.goto("http://localhost:1337/push/templates/CMAAlert/index.html#" + encodedData);
    const fileName = Math.random().toString(36).slice(3) + '.png';
    await page.screenshot({
      path: './' + fileName
    });
    await browser.close();
    return [{
      text: `【CMA全国级气象预警速报】\r\n${event.data.content}\r\n${event.data.link}`,
      pic: './' + fileName
    }]
  }
};
