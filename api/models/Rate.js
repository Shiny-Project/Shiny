/**
 * Rate.js
 *
 * @description :: User Rating
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    eventid:{
      type: 'number'
    },
    score:{
      type: 'number'
    }
  }
};

