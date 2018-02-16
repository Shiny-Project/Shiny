/**
 * Server.js
 *
 * @description :: Server Management
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
    key_pair: {
      model: 'API',
      unique: true
    }
  }
};

