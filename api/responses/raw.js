module.exports = function success(data) {
    return this.res.set("Content-Type", "application/octet-stream").send(data);
};
