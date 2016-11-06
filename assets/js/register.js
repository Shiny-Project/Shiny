$(document).ready(()=>{
  $('#login').click(function(){
    $(this).attr('disabled', 'disabled');
    let self = $(this);

    if ($("#password1").val() !== $('#password2')){
      console.log('两次密码不一致');
      self.removeAttr('disabled');
      return;
    }

    $.ajax({
      url: './User/create',
      type: 'POST',
      data:{
        email: $('#email').val(),
        password: $('#password').val()
      },
      dataType: 'json',
      success: function (data) {
        location.href = './login';
      },
      error: function (e) {
        console.log(e.responseJSON);
        self.removeAttr('disabled');
      }
    })
  })
});
