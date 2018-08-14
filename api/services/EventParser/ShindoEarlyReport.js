module.exports = {
  parse: async event => {
    const axios = require('axios');

    const response = await axios.post('http://localhost:3000/Map/shindo_early_report', {
      shindo: event.data.shindo
    });

    return [{
      text: event.data.content,
      pic: response.data.path,
      deleteImage: false
    }];
  }
};
