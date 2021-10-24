module.exports = {
    sendSocket: (type, body) => {
        const io = require("socket.io-client");
        const socket = io.connect("http://websocket.shiny.kotori.moe:3737", {
            reconnect: true,
        });
        socket.on("connect", function () {
            socket.emit("event", JSON.stringify(body));
            socket.close();
        });
    },
};
