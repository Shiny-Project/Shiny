module.exports = async (request, response, next) => {
    if (!request.session.uid) {
        return response.error(403, "need_login", "本页面需要登陆");
    }

    try {
        let userInfo = await User.findOne({
            id: request.session.uid,
        });
        if (userInfo.admin) {
            next();
        } else {
            return response.error(403, "need_admin", "本页面需要管理员权限");
        }
    } catch (e) {
        return response.error(500, "database_error", "数据库读写错误");
    }
};
