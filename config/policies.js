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
	DataController:{
	  '*': false,
    'add': ['isPost', 'authSign'],
    'recent': true,
    'view': true,
    'info': true,
    'rate': 'isPost',
    'test': true,
    'statistics': true
  },
  JobController: {
    '*': false,
    'query': ['authSign'],
    'report': ['isPost', 'authSign'] 
  },
  UserController:{
    '*': false,
    'create': 'isPost',
    'createByFingerprint': 'isPost',
    'info': true,
    'login': 'isPost',
    'logout': true,
    'isLogin': 'isLogin',
    'controlPanel': 'isLogin',
    'isBinded': true,
    'subscribe': ['isPost', 'isLogin'],
    'unsubscribe': ['isPost', 'isLogin']
  },
  SpiderController:{
    '*': false,
    'list': true,
    'jobs': 'authSign'
  },
  ToolController: {
    '*': false,
    'parseYouTube': 'isPost'
  },
  ServerController: {
	  '*': false,
    'add': ['isPost', 'isAdmin'],
    'list': true,
    'delete': ['isPost', 'isAdmin']
  },
  AdminController: {
	  '*': 'isAdmin'
  },
  ApplicationController: {
	  '*': false,
    'createAPIKeyPairs': ['isAdmin', 'isPost'],
    'list': ['isAdmin'],
    'delete': ['isAdmin']
  },
  LogController: {
	  '*': false,
    'subscribe': true
  }
};
