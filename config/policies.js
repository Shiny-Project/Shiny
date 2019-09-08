/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions (`true` allows public     *
   * access)                                                                  *
   *                                                                          *
   ***************************************************************************/

  // '*': true,

  /***************************************************************************
   *                                                                          *
   * Here's an example of mapping some policies to run before a controller    *
   * and its actions                                                          *
   *                                                                          *
   ***************************************************************************/
  DataController: {
    '*': false,
    'add': ['isPost', 'authSign'],
    'recent': true,
    'view': true,
    'info': true,
    'rate': 'isPost',
    'detail': true,
    'statistics': true,
  },
  JobController: {
    '*': false,
    'query': ['isLatestVersion', 'authSign'],
    'report': ['isPost', 'authSign'],
    'recent': ['isLogin', 'isAdmin']
  },
  UserController: {
    '*': false,
    'create': 'isPost',
    'info': true,
    'login': 'isPost',
    'logout': true,
    'subscription': true,
    'subscribe': ['isPost', 'isLogin'],
    'unsubscribe': ['isPost', 'isLogin']
  },
  SpiderController: {
    '*': false,
    'list': true,
    'updateFrequency': ['isPost', 'isLogin', 'isAdmin'],
    'delete': ['isPost', 'isLogin', 'isAdmin'],
    'update': ['isPost', 'isLogin', 'isAdmin']
  },
  SpiderIdentityController: {
    '*': false,
    'list': ['isLogin', 'isAdmin'],
    'create': ['isPost', 'isLogin', 'isAdmin'],
    'edit': ['isPost', 'isLogin', 'isAdmin'],
    'delete': ['isPost', 'isLogin', 'isAdmin']
  },
  ServerController: {
    '*': false,
    'add': ['isPost', 'isLogin', 'isAdmin'],
    'list': true,
    'delete': ['isPost', 'isLogin', 'isAdmin']
  },
  PushAccountController: {
    '*': false,
    'create': ['isPost', 'isLogin', 'isAdmin'],
    'list': ['isLogin', 'isAdmin'],
    'delete': ['isPost', 'isLogin', 'isAdmin'],
    'edit': ['isPost', 'isLogin', 'isAdmin']
  },
  PushRuleController: {
    '*': false,
    'create': ['isPost', 'isLogin', 'isAdmin'],
    'list': ['isLogin', 'isAdmin'],
    'delete': ['isPost', 'isLogin', 'isAdmin'],
    'edit': ['isPost', 'isLogin', 'isAdmin']
  },
  ApplicationController: {
    '*': false,
    'createAPIKeyPairs': ['isPost', 'isLogin', 'isAdmin'],
    'list': ['isLogin', 'isAdmin'],
    'delete': ['isPost', 'isLogin', 'isAdmin']
  },
  LogController: {
    '*': false,
    'subscribe': true
  },
  ConfigController: {
    '*': false,
    'get': true,
    'edit': ['isPost', 'isLogin', 'isAdmin'],
    'list': ['isLogin', 'isAdmin'],
    'delete': ['isPost', 'isLogin', 'isAdmin'],
    'create': ['isPost', 'isLogin', 'isAdmin'],
  },
  ToolController: {
    '*': false,
    'parseYouTube': ['isPost']
  },
  SpecialPushLogController: {
    '*': false,
    'get': true
  },
  RepositoryController: {
    '*': false,
    'list': ['isLogin', 'isAdmin']
  }
};
