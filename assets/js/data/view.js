$(document).ready(()=>{
  new Vue({
    el: '#app',
    data:{
      title: '',
      content: '',
      url: '',
      level: 0,
      spiderName: '',
      hash: ''
    },
    methods:{

    },
    ready(){
      window.onhashchange = ()=>{
        location.reload();
      };
      $('#importance').change(function(){
        $('#slider_value').text($(this).val() + '%');
      });
      let id = location.hash.slice(1);
      let self = this;
      if (!id){
        return;
      }
      $.ajax({
        url: './info',
        data: {
          id: id
        },
        dataType: 'json',
        success: response=>{
          console.log(response);
          self.title = response.data.data.title;
          self.content = response.data.data.content.replace(/\n/ig, '<br>');
          self.url = response.data.data.link;
          self.cover = response.data.data.cover;
          self.spiderName = response.data.publisher;
          self.level = response.data.level;
          self.hash = response.data.hash;
        }
      })
    }
  })
});
