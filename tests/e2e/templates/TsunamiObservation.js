const CommonUtils = require('../../../api/services/CommonUtils');
module.exports = {
  'Tsunami Observation': (browser) => {
    const encodedData = CommonUtils.encodeBase64({
      data: {
        observation: [{
          name: '岩手釜石沖',
          height: '1m',
          time: '18日 11时'
        }, {
          name: '岩手宮古沖',
          height: '1m',
          time: '18日 11时'
        }]
      }
    });
    browser.url('http://localhost:1337/push/templates/TsunamiObservation/index.html#' + encodedData)
      .waitForElementVisible('body', 1000)
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-area', '岩手釜石沖')
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-height', '1m')
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-time', '18日 11时')
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-area', '岩手宮古沖')
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-height', '1m')
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-time', '18日 11时')
  }
};
