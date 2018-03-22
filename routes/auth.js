'use strict'

var express = require('express');
var router = express.Router();
var gameLogic = require('../game/game-logic');

const Game = require(__dirname + '/../models/game.js');
const Player = require(__dirname + '/../models/player.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/');
});

router.post('/login/', function(req, res, next){
  Player.findOne({name: req.body.name, password: req.body.password}, (err, player) => {
    if(err) res.json({validity: false, loggedIn: false, message: {content: 'Error interno, intente de nuevo más tarde.', type:'alert-danger'}});
    
    if(player !== undefined && player !== null){
      req.session.player_id = player._id;
      req.session.player_name = player.name;
      
      res.json({validity: true, loggedIn: true, message: {content: '¡Bienvenid@, '+ player.name +'!', type:'alert-success'}, player: {id: player._id, name: player.name}});
    }
    else{
      res.json({validity: true, loggedIn: false, message: {content: 'Combinación de usuario/contraseña incorrectos.', type:'alert-danger'}});
    }
    
  });
});

router.post('/new-user/', function(req, res, next){
  
    var newPlayer = new Player({name: req.body.name, password: req.body.password});
    
    Player.count({name: req.body.name}, (err, count) => {
      if(err) res.json({validity: false, created: false, message: {content: 'Error interno. Intente de nuevo más tarde.', type:'alert-danger'}});
      
      if(count === 0){
        newPlayer.save((err, player) => {
          if(err) res.json({validity: false, created: false, message: {content: 'Error interno. Intente de nuevo más tarde.', type:'alert-danger'}});
          
          req.session.player_id = player._id;
          req.session.player_name = player.name
          
          res.json({validity: true, loggedIn: true, message: {content: '¡Usuario '+ player.name +' creado con éxito!', type:'alert-success'}, player: {id: player._id, name: player.name}});
        });
      }
      else{
        res.json({validity: true, created: false, message: {content: 'El nombre de usuario ya existe.', type:'alert-danger'}});
      }
      
    });
    
});


router.post('/logout/', function(req, res, next){
  if(req.session.game_id === undefined){
    
    req.session.player_id = undefined;
    req.session.player_name = undefined;
    req.session.game_id = undefined;
    
    res.json({validity: true, loggedOut: true, message: {content: 'Sesión terminada, ¡Regresa pronto!', type:'alert-info'}});
  }
  else{
    // Logica para salir del juego
    req.session.player_id = undefined;
    req.session.player_name = undefined;
    req.session.game_id = undefined;
    
    res.json({validity: true, loggedOut: true, message: {content: 'Sesión terminada, ¡Regresa pronto!', type:'alert-info'}});
  }

});

module.exports = router;
