"use strict";
$(document).ready(()=>{
  new Vue({
    el: '#app',
    data: {
      events:[]
    },
    ready: function () {
      // 连接Websocket
      var socket = io('192.168.71.128:3737');
      socket.on('event', (data) => {
        // 尝试按JSON解析
        try{
          var event = JSON.parse(data);
          console.log(event);
          var item = {};
          ["title", "content", "link"].forEach(key =>{
            item[key] = event && event.data && event.data[key] || undefined;
          });
          console.log(item);
          if (item.title && item.content && item.link){
            this.events.push(item);
          }
        }
        catch(e){
          console.log('无法解析事件');
        }
      });
    },
    methods:{
      removeEvent: function (index) {
        this.events.splice(index, 1)
      }
    }
  })
});
