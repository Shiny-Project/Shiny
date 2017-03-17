/**
 * KeywordScore.js
 *
 * @description :: Event - Keyword - Score
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    keyword: {
      type: 'string'
    },
    score:{
      type: 'float'
    },
    event: {
      model: 'Data'
    }
  }
};

