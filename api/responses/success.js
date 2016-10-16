/**
 * Custom Success Response Handler
 *
 * Usage:
 * return res.success(data)
 */


module.exports = function success(data) {
  return this.res.json({
    'status': 'success',
    'data': data
  });
};
