/**
 * Spider.js
 *
 * @description :: Spider信息表
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
      type: 'string'
    },
    path: {
      type: 'string'
    },
    info: {
      type: 'text'
    },
    trigger_count: {
      type: 'integer'
    },
    trigger_time: {
      type: 'datetime'
    }
  }
};

