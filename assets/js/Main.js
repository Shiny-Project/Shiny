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
        let list = getList(listName);
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
      let list = getList(listName);
      let index = list.indexOf(item);
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
        data:{
          title: '欢迎使用迷之平台',
          content: '按照预案您已经连接到服务器，当有事件触发时将会以不同方式提示您。如果您是第一次使用，请允许本站弹出通知。<br> 下方的功能区的按钮是有可能可以按的。<b>网页版本已经停止维护，我们恳请您下载下方的 Chrome 扩展。</b>',
          link: 'javascript:;'
        },
      }],
      isLogin: !!Cookies.get('uid')
    },
    ready: function () {
      // 连接Websocket
      let socket = io('http://api.kotori.moe:3737');
      let levelChart = {
        1: '一般事件',
        2: '有趣的事件',
        3: '重要事件',
        4: '紧急事件',
        5: '世界毁灭'
      };
      let showNotification;

      let subscriptionList = [];

      if (this.isLogin){
        $.ajax({
          url: './User/info',
          data: {
            'id': Cookies.get('uid')
          },
          type: 'GET',
          dataType: 'json',
          success: response=>{
            if (response.data.subscriptions){
              for (let spider of response.data.subscriptions){
                subscriptionList.push(spider.name);
              }
            }
            console.log('获取到订阅列表');
            console.log(subscriptionList);
          }
        })
      }

      Notification.requestPermission((status) => {
        if (status === "granted"){
          /**
           * 显示通知
           * {string} title 通知标题, {string} content 通知内容, {string} link 通知链接
           */
          showNotification = function (event) {
            let notice = new Notification(event.data.title, {
              body: event.data.content,
              icon: event.data.cover || 'http://ww4.sinaimg.cn/large/a7e7af92gw1f70efh3ly1j206y06yglz.jpg'
            });
            notice.onclick = () => {
              window.open(event.data.link);
            }
          }
        }
      });

      socket.on('event', (data) => {
        // 尝试按JSON解析
        try{
          console.log(data);
          let event = JSON.parse(data);

          if (this.isLogin && subscriptionList.indexOf(event.spiderName) === -1)
            // 不处理未订阅的内容
            return;

          if (isInList('block', event.spiderName)){
            return;
          }

          if (isInList('star', event.spiderName)){
            // 特别关注 提示音TODO
          }

          let levelText = levelChart[event && event.level] || '未知等级事件';

          if (event.data.title && event.data.content && event.data.link){
            // 推送必备参数齐全
            if (event.level && event.level >= 3){
              // 对于大于3的事件无差别推送
              showNotification(event);
              event.data.title = '<span style="color:red">' + event.data.title + '<span/>';
            }

            this.events.unshift(event);
          }
          else{
            console.log('事件缺少必要参数');
            console.log('收到的广播内容:');
            console.log(event);
          }
        }
        catch(e){
          console.log(e);
          console.log('收到的广播内容:');
          console.log(data);
          console.log('无法解析事件');
        }
      });
    },
    methods:{
      removeEvent: function (index) {
        this.events.splice(index, 1)
      },
      block: function (index) {
        let spiderName = this.events[index].spiderName;
        if (!isInList('star', spiderName)){
          appendToList('block', spiderName);
        }
        else{
          removeFromList('star', spiderName);
          appendToList('block', spiderName)
        }
      },
      star: function (index) {
        let spiderName = this.events[index].spiderName;
        if (!isInList('block', spiderName)){
          appendToList('star', spiderName);
        }
        else{
          removeFromList('block', spiderName);
          appendToList('star', spiderName)
        }
      },
      login:function () {
        location.href = 'https://console.shiny.kotori.moe/';
      },
      cp:function () {
        location.href = './kashikoikawaiielichika';
      }
    }
  })
});
