/**
 * Data.js
 *
 * @description :: 数据存储
 */

module.exports = {

  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    data: {
      type: 'text'
    },
    level: {
      type: 'integer'
    },
    publisher: {
      type: 'string'
    },
    hash: {
      type: 'string'
    },
    keywords:{
      collection: 'KeywordScore',
      via: 'event'
    },
    analysed:{
      type: 'integer',
      defaultsTo: 0
    }
  }
};

