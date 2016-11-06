"use strict";
$(document).ready(()=>{
  /**
   * 获取localStorage列表
   * @param listName
   * @returns {Array}
   */
  function getList(listName){
    if (localStorage.getItem(listName) !== null){
      try{
        return JSON.parse(localStorage.getItem(listName));
      }
      catch(e){
        return [];
      }
    }
    else{
      return [];
    }
  }

  /**
   * 加塞localStorage列表
   * @param listName
   * @param item
   */
  function appendToList(listName, item){
    if (getList(listName) !== []){
      if (!isInList(listName, item)){
        var list = getList(listName);
        list.push(item);
        localStorage.setItem(listName, JSON.stringify(list));
      }
    }
  }

  /**
   * 从localStorage列表删除
   * @param listName
   * @param item
   */
  function removeFromList(listName, item){
    if (getList(listName) !== []){
      var list = getList(listName);
      var index = list.indexOf(item);
      if (index !== -1){
        list.splice(index, 1);
        localStorage.setItem(listName, JSON.stringify(list));
      }
      else{
        console.log('这一项并不存在于列表')
      }
    }
  }

  /**
   * 判断是否存在于localStorage列表
   * @param listName
   * @param item
   * @returns {boolean}
   */
  function isInList(listName, item){
    return getList(listName) && getList(listName).includes(item) || false;
  }

  new Vue({
    el: '#app',
    data: {
      events:[{
        level: '提示',
        spiderName: 'Mirai',
        hash: '',
        title: '欢迎使用迷之平台',
        content: '按照预案您已经连接到服务器，当有事件触发时将会以不同方式提示您。如果您是第一次使用，请允许本站弹出通知。<br> 下方的功能区的按钮是有可能可以按的。',
        link: 'javascript:;'
      }]
    },
    ready: function () {
      // 连接Websocket
      var socket = io('http://api.kotori.moe:3737');
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
          showNotification = function (title, content, link, cover) {
            var notice = new Notification(title, {
              body: content,
              icon: cover || 'http://ww4.sinaimg.cn/large/a7e7af92gw1f70efh3ly1j206y06yglz.jpg'
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
          ['title', 'content', 'link', 'cover'].forEach(key =>{
            item[key] = event && event.data && event.data[key] || undefined;
          });
          ["hash", "spiderName"].forEach(key => {
            item[key] = event && event[key]
          });

          if (isInList('block', item.spiderName)){
            return;
          }

          if (isInList('star', item.spiderName)){
            // 特别关注 提示音TODO
          }

          item.level = levelChart[event && event.level] || '未知等级事件';
          if (item.title && item.content && item.link){
            if (event.level && event.level >= 3){
              showNotification(item.title, item.content, item.link, item.cover);
              item.title = '<span style="color:red">' + item.title + '<span/>';
            }

            this.events.unshift(item);
          }
          else{
            console.log('事件缺少必要参数');
            console.log('收到的广播内容:' + data);
          }
        }
        catch(e){
          console.log(e);
          console.log('收到的广播内容:' + data);
          console.log('无法解析事件');
        }
      });
    },
    methods:{
      removeEvent: function (index) {
        this.events.splice(index, 1)
      },
      block: function (index) {
        var spiderName = this.events[index].spiderName;
        if (!isInList('star', spiderName)){
          appendToList('block', spiderName);
        }
        else{
          removeFromList('star', spiderName);
          appendToList('block', spiderName)
        }
      },
      star: function (index) {
        var spiderName = this.events[index].spiderName;
        if (!isInList('block', spiderName)){
          appendToList('star', spiderName);
        }
        else{
          removeFromList('block', spiderName);
          appendToList('star', spiderName)
        }
      },
      login:function () {
        window.open('./login');
      }
    }
  })
});
