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
          location.href = './login'
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
      if (!$('#password1').val() || !$('#password2').val() || !$('#email').val()){
        $('#tip').text('请填写所有项目');
        return;
      }
      if ($('#password1').val() !== $('#password2').val()){
        $('#tip').text('两次输入的密码不一致');
        return;
      }

      $.ajax({
        url: './User/create',
        type: 'POST',
        data:{
          email: $('#email').val(),
          password: $('#password2').val(),
          fingerprint: result
        },
        success: data=>{
          location.href = './login';
        },
        error: e=>{
          if (e.responseJSON && e.responseJSON.error && e.responseJSON.error.code){
            $('#tip').text(e.responseJSON.error.message);
            $('#bind,#later').removeAttr('disabled');
          }
        }
      })
    })
  });
});
