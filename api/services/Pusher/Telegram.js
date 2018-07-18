module.exports = {
  sendTeleGram: function (text) {
    let request = require('request');
    let botAPIKey = sails.config.common.telegramBotAPIKey;
    let channel = sails.config.common.telegramChannel;
    try {
      request.post({
        url: `https://api.telegram.org/bot${botAPIKey}/sendMessage`,
        form: {
          chat_id: `@${channel}`,
          text: text
        }
      }, function (error, response, body) {
        if (error) {
          console.log(response);
        }
      });
    }
    catch (e) {
      console.log(e);
    }
  },
};
