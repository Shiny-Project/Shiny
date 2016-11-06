/**
 * SpiderInfo.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: 'string',
      size: 255
    },
    description: {
      type: 'text'
    },
    frequency: {
      type: 'string',
      size: 255
    },
    user: {
      collection: 'User',
      via: 'subscriptions'
    }
  }
};

