var rooms = [];

exports = module.exports = function(app){
  app.io.on('connection', function(socket){  
    
    console.log('Un cliente se conectó.');



    socket.on('petition-rooms', function(){
      socket.emit('get-rooms',rooms);
    });
    
    socket.on('post-room', function(room){
      rooms.push(room);
      
      socket.join(room, function(){
        
        
        app.io.of(room).on('message', function(msg){
          console.log(room + ':' +msg);
        });
        
        socket.emit('game-joined', room);
        
      });
      
      
    });
    
    socket.on('join-room', function(room){
      console.log(app.io.sockets.adapter.rooms);
      rooms.splice(rooms.indexOf(room),1);
      console.log(rooms);
        
      socket.join(room, function(){
        socket.emit('game-joined', room);
      });

    });
    
    
    socket.on('disconnect', function() {
      console.log('Un cliente se desconectó.');
    });
   
  });
}