module.exports = function(req, res, next) {
  const token = req.headers["x-shiny-token"];
  if (!token) {
    return res.error(400, "missing_token", "缺少认证 Token");
  }
  if (token !== sails.config.common.shiny_token) {
    return res.error(400, "missing_token", "认证 Token 不合法");
  }
  next();
};
