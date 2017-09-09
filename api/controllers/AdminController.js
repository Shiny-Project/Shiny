/**
 * AdminController
 *
 * @description :: Server-side logic for managing Admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	index: (request, response) => {
	  return response.view('admin/index');
  },
  server: (request, response) => {
	  return response.view('admin/server');
  }
};

