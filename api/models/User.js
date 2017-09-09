/**
 * User.js
 *
 * @description :: Shiny User Definition
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: 'integer'
    },
    email: {
      type: 'string',
      size: 255
    },
    password: {
      type: 'string',
      size: 255
    },
    token:{
      type: 'string',
      size: 255
    },
    admin: {
      type: 'boolean'
    },
    fingerprint:{
      type: 'string',
      size: 255
    },
    subscriptions: {
      collection: 'SpiderInfo',
      via: 'user',
      dominant: true
    }
  }
};

