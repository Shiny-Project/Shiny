/**
 * 验证 API 签名
 * @param request
 * @param response
 * @param next
 */
module.exports = function (request, response, next) {
  let apiKey = request.param('api_key');
  let sign = request.param('sign');
  let crypto = require('crypto');
  if (!apiKey){
    return response.error(403, 'need_api_identification', '需要提供API_KEY');
  }

  if (!sign){
    return response.error(403, 'need_sign', '需要提供签名');
  }

  API.findOne({
    'api_key': apiKey
  }).then(api => {

    if (!api){
      return response.error(403, 'unexisted_api_key', '不存在的APIKEY');
    }

    let query = request.allParams();

    // 除去无需签名的字段
    delete query.api_key;
    delete query.sign;

    let paramsKeys = Object.keys(query).sort();
    let payload = apiKey + api.api_secret_key;

    for (let key of paramsKeys){
      // 将各个参数依次拼接
      payload += request.param(key);
    }

    let shasum = crypto.createHash('sha1');
    shasum.update(payload);
    let server_side_sign = shasum.digest('hex');
    sign = sign.toLowerCase && sign.toLowerCase() || sign;

    if (sign !== server_side_sign){
      return response.error(403, 'invalid_sign', '非法的签名');
    }

    next();
  });
};
