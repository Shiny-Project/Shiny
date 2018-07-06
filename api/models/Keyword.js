/**
 * Keyword.js
 *
 * @description :: Manage keywords of events.
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
    }
  }
};

