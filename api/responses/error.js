/**
 * Custom Error Handler
 *
 * Usage:
 * return res.error(statusCode, errorCode, explanation)
 */

/**
 * 返回错误
 * @param statusCode
 * @param errorCode
 * @param explanation
 * @returns {*}
 */
module.exports = function error(statusCode, errorCode, explanation) {
    this.res.status(statusCode);
    return this.res.json({
        status: "fail",
        error: {
            code: errorCode,
            info: explanation,
        },
    });
};
