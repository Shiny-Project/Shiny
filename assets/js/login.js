$(document).ready(()=>{
  $('#login').click(function(){
    $(this).attr('disabled', 'disabled');
    let self = $(this);
    $.ajax({
      url: './User/login',
      type: 'POST',
      data:{
        email: $('#email').val(),
        password: $('#password').val()
      },
      dataType: 'json',
      success: function (data) {
        location.href = './kashikoikawaiielichika';
      },
      error: function (e) {
        console.log(e.responseJSON);
        self.removeAttr('disabled');
      }
    })
  })
});
