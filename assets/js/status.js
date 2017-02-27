$(() => {
  new Vue({
    el: '#app',
    data(){
      return {
        status: {
          'web': {
            name: 'Web后端',
            status: '...'
          },
          'API': {
            name: 'API',
            status: '...'
          },
          'websocket': {
            name: '推送服务',
            status: '...'
          },
          'spiders': {
            name: '爬虫',
            status: '...'
          }
        }
      };
    },
    ready(){
      let self = this;
      $.ajax({
        url: './System/status',
        dataType: 'json',
        success: res => {
          self.status = res.data;
        }
      })
    }
  })
});
