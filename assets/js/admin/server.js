new Vue({
  el: "#app",
  data(){
    return {
      serverList: [],
      form: {
        name: "",
        type: "",
        host: ""
      }
    }
  },
  mounted(){
    $.ajax({
      url: "/Server/list",
      dataType: "json",
      success: res => {
        this.serverList = res.data;
      }
    })
  },
  methods: {
    add(){
      $.ajax({
        url: "/Server/add",
        type: "POST",
        data: {
          serverName: this.form.name,
          serverHost: this.form.host,
          serverType: this.form.type
        },
        success: res => {
          this.form.name = "";
          this.form.host = "";
          this.form.type = "";

          this.serverList.push(res.data)
        }
      })
    },
    remove(name){
      $.ajax({
        url: "/Server/delete",
        type: "POST",
        dataType: "json",
        data: {
          serverName: name
        },
        success: res => {
          this.serverList = this.serverList.filter(i => i.name !== name)
        }
      })
    }
  }
});
