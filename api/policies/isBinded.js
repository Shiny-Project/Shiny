/**
 * 验证是否是绑定账号
 * @param request
 * @param response
 * @param next
 */
module.exports = function (request, response, next) {
    if (!request.session.uid) return response.error(403, "unbinded_user", "本页面需要绑定账号");

    let uid = request.session.uid;

    User.findOne({
        id: uid,
    })
        .then((user) => {
            if (user && user.email) next();
            else return response.error(403, "unbinded_user", "本页面需要绑定账号");
        })
        .catch((e) => {
            return response.error(403, "unbinded_user", "本页面需要绑定账号(Error)");
        });
};
