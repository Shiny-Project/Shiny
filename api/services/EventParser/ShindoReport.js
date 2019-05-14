module.exports = {
  parse: async event => {
    const axios = require('axios');

    const response = await axios.post('http://localhost:3000/Map/shindo_report', {
      shindo: JSON.stringify(event.data.shindo),
      epicenter: JSON.stringify(event.data.epicenter)
    });

    return [{
      text: event.data.content,
      pic: response.data.path,
    }];
  }
};
