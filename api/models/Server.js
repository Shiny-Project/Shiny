/**
 * Server.js
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
    /*
    * 服务器类型
    * central - 中控服务器
    * node - 爬虫结点服务器
    * websocket 推送中转
    */
    type: {
      type: "string"
    },
    name: {
      type: 'string',
    },
    host: {
      type: 'string'
    },
  }
};

