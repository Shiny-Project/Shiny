/**
 * PushHistory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'push_history',
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    channel: {
      type: 'string',
    },
    status: {
      type: 'string'
    },
    info: {
      type: 'string',
      columnType: 'text',
      allowNull: true
    },
    text: {
      type: 'string',
      columnType: 'text',
      allowNull: true
    },
    event_id: {
      type: 'number'
    },
    image: {
      type: 'string',
      columnType: 'text',
      allowNull: true
    },
    logs: {
      collection: 'pushlog',
      via: 'job_id'
    }
  }
};

