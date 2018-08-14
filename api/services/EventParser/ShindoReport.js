module.exports = {
  parse: async event => {
    const request = require('request-promise');
    const response = await request.post({
      url: 'http://localhost:3000/Map/shindo_early_report',
      form: {
        shindo: event.data.shindo,
        epicenter: event.data.epicenter
      },
      json: true
    });

    return [{
      text: event.data.content,
      pic: response.path,
      deleteImage: false
    }];
  }
};
