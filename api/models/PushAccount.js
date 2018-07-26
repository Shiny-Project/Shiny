/**
 * 推送用账号
 */

module.exports = {
  tableName: 'push_account',
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    platform: {
      type: 'string',
    },
    name: {
      type: 'string'
    },
    credential: {
      type: 'string',
      columnType: 'text'
    }
  }
};
