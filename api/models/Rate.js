/**
 * Rate.js
 *
 * @description :: User Rating
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    eventid:{
      type: 'integer'
    },
    rate:{
      type: 'integer'
    }
  }
};

