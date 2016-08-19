/**
 * Job.js
 *
 * @description :: 任务列表
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
    info :{
      type: 'text'
    }
  }
};

