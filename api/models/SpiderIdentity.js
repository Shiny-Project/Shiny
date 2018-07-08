/**
 * @description :: 爬虫用各类凭据
 */

module.exports = {
  tableName: 'spider_identity',
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    name: {
      type: 'string'
    },
    identity: {
      type: 'string',
      columnType: 'text',
      defaultsTo: '{}'
    }
  }
};
