/*global $*/

function produceAlert(type, message){
    $('#alert-area').html("<div class='alert "+ type +" alert-dismissible' style='margin-top: 10px; margin-bottom:-10px;' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button> " + message + "</div>");
}

$(document).ready(function(){
   $('a[href="#logout"]').click(function(){

      $.post("/auth/logout/", {}, function(data){
        if(data.validity == true && data.loggedIn == true){
          produceAlert(data.message.type, data.message.content);
        }
        else{
          produceAlert(data.message.type, data.message.content);
        }
        setTimeout(function() {window.location.replace('/');}, 500);
      }); 
      
   }); 
});