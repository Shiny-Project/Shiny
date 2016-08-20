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
      var levelChart = {
        1: '一般事件',
        2: '有趣的事件',
        3: '重要事件',
        4: '紧急事件',
        5: '世界毁灭'
      };
      var showNotification;
      Notification.requestPermission((status) => {
        if (status === "granted"){
          /**
           * 显示通知
           * {string} title 通知标题, {string} content 通知内容, {string} link 通知链接
           */
          showNotification = function (title, content, link) {
            var notice = new Notification(title, {
              body: content
            });
            notice.onclick = () => {
              window.open(link);
            }
          }
        }
      });

      socket.on('event', (data) => {
        // 尝试按JSON解析
        try{
          var event = JSON.parse(data);
          var item = {};
          ["title", "content", "link"].forEach(key =>{
            item[key] = event && event.data && event.data[key] || undefined;
          });
          ["hash", "spiderName"].forEach(key => {
            item[key] = event && event[key]
          });

          item.level = levelChart[event && event.level];

          if (item.title && item.content && item.link){
            this.events.unshift(item);
            if (event.level && event.level >= 3){
              showNotification(item.title, item.content, item.link)
            }
          }
        }
        catch(e){
          console.log(e);
          console.log(data);
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
