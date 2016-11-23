$(document).ready(function(){
  new Vue({
    el: '#app',
    data:{
      subscriptions:[],
      spiderMarket:[]
    },
    ready(){
      let self = this;
      $.ajax({
        url: './User/info',
        data:{
          'id': Cookies.get('uid')
        },
        dataType: 'json',
        success: response=>{
          let subscriptionList = [];

          for (let item of response.data.subscriptions){
            subscriptionList.push(item.id);
          }
          self.subscriptions = response.data.subscriptions;

          $.ajax({
            url: './Spider/list',
            dataType:'json',
            success:response=>{
              for (let spider of response.data){
                spider.isSubscribed = (subscriptionList.includes(spider.id));
              }
              self.spiderMarket = response.data;
            }
          });
        }
      });

    },
    methods:{
      subscribe(index){
        let subscriptionId = this.spiderMarket[index].id;

        if (this.spiderMarket[index].isSubscribed){
          return;
        }

        let self = this;
        $.ajax({
          'url': './User/subscribe',
          'data': {
            'subscriptionId': subscriptionId
          },
          type: 'POST',
          dataType: 'json',
          success: response=>{
            self.spiderMarket[index].isSubscribed = true;
            self.subscriptions.push(self.spiderMarket[index]);
          }
        })
      },
      unsubscribe(index){
        let subscriptionId = this.subscriptions[index].id;

        let self = this;
        $.ajax({
          'url': './User/unsubscribe',
          'data': {
            'subscriptionId': subscriptionId
          },
          type: 'POST',
          dataType: 'json',
          success: response=>{
            for (let spider of self.spiderMarket){
              if (spider.id == subscriptionId){
                spider.isSubscribed = false;
              }
            }
            self.subscriptions.splice(index, 1);
          }
        })
      },
      logout:function () {
        $.ajax({
          url: './User/logout',
          success:data=>{
            location.href = '/';
          }
        })
      }
    }
  })
});
