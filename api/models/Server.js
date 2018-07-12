/**
 * Server.js
 *
 * @description :: Server Management
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
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
    group: {
      type: 'string',
      allowNull: true
    },
    info: {
      type: 'string',
      columnType: 'text'
    },
    key_pair: {
      model: 'API',
      unique: true
    }
  }
};

