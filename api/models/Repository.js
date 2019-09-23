/**
 * Repository.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'repository',
  primaryKey: 'id',
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
    },
    name: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    path: {
      type: 'string'
    },
    lines: {
      type: 'number'
    },
    revisions: {
      collection: 'Revision',
      via: 'repository_id'
    }
  },
};

