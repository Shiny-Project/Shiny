$(document).ready(()=>{
  $('#bind,#later').attr('disabled', 'disabled');
  new Fingerprint2().get((result, components)=>{
    $.ajax({
      url: './User/isBinded',
      data:{
        fingerprint: result
      },
      dataType: 'json',
      success: function (data) {
        if (data.data.isBinded){
          location.href = './User/login'
        }
        else{
          $('#bind,#later').removeAttr('disabled');
          $('#tip').text('注册成功. 现在您可以选择给自己的账号一个Email和密码，这样您可以在多设备之间同步设置。当然，您也可以拒绝。')
        }
      },
      error: function (e) {
        $('#tip').text('网络不大好吧.')
      }
    });
    $('#bind').click(function(){
      let self = $(this);

      $.ajax({
        url: './User/create'
      })
    })
  });
});
