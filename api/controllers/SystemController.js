/**
 * SystemController
 *
 * @description :: Server-side logic for managing Systems
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  status: function (request, response) {
    let status = {
      'web': {
        name: 'Web后端',
        status: 'Working'
      },
      'API': {
        name: 'API',
        status: 'Working'
      },
      'websocket': {
        name: '推送服务',
        status: 'Probably down'
      },
      'spiders': {
        name: '爬虫',
        status: 'Working'
      }
    };
    Data.find({}).sort('id desc').then(data => {
      if (data.length > 0){
        let lastest = data[0];
        let diff = Math.round((new Date() - new Date(lastest.createdAt)) / 1000);
        if (diff > 3600*1.5){
          status.spiders.status = 'Probably down';
        }
      }
      else{
        status.spiders.status = 'Probably down';
      }
      let io = require('socket.io-client');
      let socket = io.connect('http://websocket.shiny.kotori.moe:3737', {
        reconnect: false
      });
      socket.on('connect', function () {
        status.websocket.status = 'Working';
        socket.close();
        return response.success(status);
      });
    });
  },
};

