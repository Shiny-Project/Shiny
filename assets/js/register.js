$(document).ready(()=>{
  $('#register_fingerprint').click(function(){
    $(this).attr('disabled', 'disabled');
    $(this).text('Please wait.');
    let self = $(this);
    new Fingerprint2().get((result, components)=>{
      $.ajax({
        url: './User/createByFingerprint',
        type: 'POST',
        data:{
          fingerprint: result
        },
        dataType: 'json',
        success: function (data) {
          location.href = './bind';
        },
        error: function (e) {
          if (e.responseJSON && e.responseJSON.error && e.responseJSON.error.code == 'existed_device'){
            location.href = './bind';
          }
          self.removeAttr('disabled');
        }
      })
    });
  });
  $('#register_fingerprint').click();
});
