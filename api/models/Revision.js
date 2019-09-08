/**
 * Revision.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'revision',
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    repository_id: {
      model: 'Repository'
    },
    commit_id: {
      type: 'string'
    },
    status: {
      type: 'string'
    },
    compare_url: {
      type: 'string'
    }
  },

};

