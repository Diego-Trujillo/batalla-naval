/*global $*/
/*global produceAlert*/

function postSignUp(){
  
  var username = $('#login-username').val();
  var user_password = $('#login-password').val();
  var user_password_repeat = $('#login-password-repeat').val();
  
  if(user_password !== user_password_repeat){
    produceAlert('alert-danger', 'Las contraseñas no coinciden.')
  }
  else if(username === '' || user_password === '' || user_password_repeat === ''){
    produceAlert('alert-danger',  'Todos los campos deben tener contenido');
  }
  else{
      $.post("/auth/new-user/", {name: username, password:user_password}, function(data){
      if(data.validity == true && data.loggedIn == true){
        produceAlert(data.message.type, data.message.content);
        setTimeout(function() {window.location.replace('/');}, 500);
      }
      else{
        produceAlert(data.message.type, data.message.content);
      }
    }); 
  }
  
  
}



$( "#signup-form" ).submit(function( event ) {
  event.preventDefault();
  postSignUp();
});

