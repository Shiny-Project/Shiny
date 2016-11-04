/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/
  autoreload:{
    active: true,
    usePolling: false,
    dirs: [
      "api/models",
      "api/controllers",
      "api/services",
      "config/locales",
      "views",
      "assets"
    ],
    ignored: [
      // Ignore all files with .ts extension
      "**.ts"
    ]
  },
  models: {
    connection: 'sqlServer',
    migrate: 'alter'
  },
  connections: {
    sqlServer: {
        adapter: 'sails-mysql',
        host: 'localhost',
        user: 'root', //optional
        password: '', //optional
        database: 'mirai' //optional
    }
  },
};
