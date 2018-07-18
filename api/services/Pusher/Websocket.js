module.exports = {
  sendSocket: (type, body) => {
    let io = require('socket.io-client');
    let socket = io.connect('http://websocket.shiny.kotori.moe:3737', {
      reconnect: true
    });
    socket.on('connect', function () {
      socket.emit('event', JSON.stringify(body));
      socket.close();
    });
  }
};
