/**
 * KeywordScore.js
 *
 * @description :: Event - Keyword - Score
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    keyword: {
      type: 'string'
    },
    score:{
      type: 'number',
      columnType: 'float'
    },
    event: {
      model: 'Data'
    }
  }
};

