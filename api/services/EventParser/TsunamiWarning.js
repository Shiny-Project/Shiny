module.exports = {
  parse: async (event) => {
    const axios = require('axios');

    const response = await axios.post('http://localhost:3000/Map/tsunami_warning', {
      type: JSON.stringify(event.data.type),
      warning: JSON.stringify(event.data.warning)
    });

    return [{
      text: event.data.content,
      pic: response.data.path
    }];
  }
};
