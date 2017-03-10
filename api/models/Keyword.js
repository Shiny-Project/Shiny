/**
 * Keyword.js
 *
 * @description :: Manage keywords of events.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    eventid: {
      collection: 'Data',
      via: 'keywords'
    }
  }
};

