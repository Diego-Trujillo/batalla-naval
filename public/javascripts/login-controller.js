/*global $*/
/*global produceAlert*/

function postLogin(){
  
  var username = $('#login-username').val();
  var user_password = $('#login-password').val();
  
  $.post("/auth/login/", {name: username, password:user_password}, function(data){
    if(data.validity == true && data.loggedIn == true){
      produceAlert(data.message.type, data.message.content);
      setTimeout(function() {window.location.replace('/');}, 500);
    }
    else{
      produceAlert(data.message.type, data.message.content);
    }
  }); 
}

$( "#login-form" ).submit(function( event ) {
  event.preventDefault();
  postLogin();
});

