/**
 * LogController
 *
 * @description :: Server-side logic for managing Logs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    subscribe: (request, response) => {
        if (!request.isSocket) {
            return response.error(400, "invalid_request", "请求非法");
        }
        sails.sockets.join(request, "test");
        return response.success();
    },
};
