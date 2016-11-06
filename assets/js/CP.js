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
          self.subscriptions = response.data.subscriptions;
        }
      });
      $.ajax({
        url: './Spider/list',
        dataType:'json',
        success:response=>{
          self.spiderMarket = response.data;
        }
      });
    }
  })
});
