module.exports = {

  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    api_key:{
      type: 'string'
    },
    api_secret_key:{
      type: 'string'
    },
    tag: {
      collection: 'Server',
      via: 'key_pair',
    }
  }
};
