/**
 * Spider.js
 *
 * @description :: Spider信息表
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    name: {
      type: 'string'
    },
    path: {
      type: 'string',
      allowNull: true
    },
    description: {
      type: 'string',
      columnType: 'text'
    },
    info: {
      type: 'string',
      columnType: 'text'
    },
    trigger_count: {
      type: 'number'
    },
    trigger_time: {
      type: 'ref',
      columnType: 'datetime'
    }
  }
};

