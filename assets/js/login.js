$(document).ready(()=>{
  $('#login_fingerprint').attr('disabled','disabled');
  new Fingerprint2().get((result, components)=>{
    $.ajax({
      url: './User/info',
      data: {
        'fingerprint': result
      },
      success: data=>{
        $('#login_fingerprint').removeAttr('disabled');
        $('#tip').text('看起来您可以使用设备指纹登录哦');
      },
      error: e=>{
        $('#tip').text('经过注册的设备才能使用设备指纹登录哦');
      }
    })
  });
});
