const CommonUtils = require('../../../api/services/CommonUtils');
module.exports = {
  'Tsunami Observation': (browser) => {
    const encodedData = CommonUtils.encodeBase64({
      data: {"title":"海啸到达时间和高度预测","content":"气象厅海啸到达时间和高度预测如下图","link":"https://s.wug.moe","estimation":[{"height":"1m","time":"到达中","name":"山形県","type":"notice"},{"height":"1m","time":"到达中","name":"新潟県上中下越","type":"notice"},{"height":"1m","time":"18日 22:30","name":"佐渡","type":"notice"},{"height":"1m","time":"18日 23:00","name":"石川県能登","type":"notice"}]}
    });
    browser.url('http://localhost:1337/push/templates/TsunamiEstimation/index.html#' + encodedData)
      .waitForElementVisible('body', 1000)
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-area', '山形県')
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-height', '1m')
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-time', '到达中')
      .assert.containsText('body > div > div > div:nth-child(4) > div.alert-item-type', '海啸注意报')
      .assert.cssClassPresent('body > div > div > div:nth-child(4) > div.alert-item-type', 'bold') // 类型为粗体
      .assert.cssClassPresent('body > div > div > div:nth-child(4) > div.alert-item-type', 'alert-notice') // 注意报样式
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-area', '新潟県上中下越')
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-height', '1m')
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-time', '到达中')
      .assert.containsText('body > div > div > div:nth-child(5) > div.alert-item-type', '海啸注意报')
      .assert.containsText('body > div > div > div:nth-child(6) > div.alert-item-area', '佐渡')
      .assert.containsText('body > div > div > div:nth-child(6) > div.alert-item-height', '1m')
      .assert.containsText('body > div > div > div:nth-child(6) > div.alert-item-time', '18日 22:30')
      .assert.containsText('body > div > div > div:nth-child(6) > div.alert-item-type', '海啸注意报')
      .assert.containsText('body > div > div > div:nth-child(7) > div.alert-item-area', '石川県能登')
      .assert.containsText('body > div > div > div:nth-child(7) > div.alert-item-height', '1m')
      .assert.containsText('body > div > div > div:nth-child(7) > div.alert-item-time', '18日 23:00')
      .assert.containsText('body > div > div > div:nth-child(7) > div.alert-item-type', '海啸注意报')
  }
};
