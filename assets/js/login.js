$(document).ready(()=> {
  $('#login_fingerprint').attr('disabled', 'disabled');
  new Fingerprint2().get((result, components)=> {
    $.ajax({
      url: './User/info',
      data: {
        'fingerprint': result
      },
      success: data=> {
        if (!data.data.email) {
          $('#login_fingerprint').removeAttr('disabled');
          $('#tip').text('看起来您可以使用设备指纹登录哦');
        }
        else{
          $('#tip').text('已绑定用户只能使用密码登录');
        }
      },
      error: e=> {
        $('#tip').text('经过注册的设备才能使用设备指纹登录哦');
      }
    });

    $('#login_fingerprint').click(function () {
      let self = $(this);
      $.ajax({
        url: './User/login',
        data: {
          'fingerprint': result
        },
        type: 'POST',
        dataType: 'json',
        success: data=> {
          location.href = './kashikoikawaiielichika';
        },
        error:e=>{
          if (e.responseJSON && e.responseJSON.error && e.responseJSON.error.code){
            $('#tip').text({
              'wrong_password': '密码错误',
              'unexisted_user': '用户不存在'
            }[e.responseJSON.error.code]);
          }
        }
      })
    });

    $("#login").click(function(){
      let self = $(this);
      $.ajax({
        url: './User/login',
        type: 'POST',
        data:{
          'email': $('#email').val(),
          'password': $('#password').val()
        },
        dataType: 'json',
        success: response=>{
          location.href = './kashikoikawaiielichika';
        }
      })
    })
  });
});
