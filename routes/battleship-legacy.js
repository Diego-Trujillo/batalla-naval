'use strict'

var express = require('express');
var router = express.Router();
var gameLogic = require('../game/game-logic');

const Game = require(__dirname + '/../models/game.js');
const Player = require(__dirname + '/../models/player.js');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('users',{title: 'Users'});
});

router.post('/battleship/new-user/', function(req, res, next) {
    var newPlayer = new Player({name: req.body.name, password: req.body.password});
    
    Player.count({name: req.body.name}, (err, count) => {
      if(err) res.json({created: false, loggedIn: false, message: 'Database Error'});
      
      if(count === 0){
        newPlayer.save((err, obj) => {
          if(err) res.json({created: false, loggedIn: false, message: 'Database Error'});
          
          req.session.player_id = newPlayer._id;
          res.json({created: true, loggedIn: true, message: 'Usuario creado con éxito', username: newPlayer.name});
        });
      }
      else{
        res.json({created: false, loggedIn: false, message: 'El nombre de usuario ya existe.'});
      }
      
    });
});

router.post('/battleship/login/', function(req, res, next) {
    Player.findOne({name: req.body.name, password: req.body.password}, (err, player) => {
      if(err) res.json({loggedIn: false, message: 'Database error.'});
      
      if(player !== undefined && player !== null){
        req.session.player_id = player._id;
        res.json({loggedIn: true, message: 'Bienvenido ' + player.name + '.', username: player.name});
      }
      else{
        res.json({loggedIn: false, message: 'Combinación usuario/contraseña incorrecta.'});
      }
      
    });
});

router.get('/battleship/games/', function(req, res, next){
    Game.find({gameFull: false}, (err, games) => {
      
        if(err) console.log(err);
        let gamesSummary = games.map(function(game, index, array){
          return {id: game._id, name: game.name};
        });
        
        res.json(gamesSummary);
    });
});

router.post('/battleship/create-game/', function(req, res, next){
    var newGame = new Game({name: req.body.name, P1_id: req.session.player_id});

    newGame.save((err, obj) => {
      if (err) res.json({created: false, message:'Database Error'});
      req.session.game_id = newGame._id;
      res.json({created: true, message: 'Game Created', playerNo: 1});
    });
    
});

router.put('/battleship/join-game/', function(req, res, next) {
    Game.findById(req.body.game_id, (err, game) => {
      if (err) res.json({validity: false, message: 'Database error'});
      
      game.P2_id = req.session.player_id;
      game.gameFull = true;
      
      game.save((err, obj) => {
        if (err) res.json({validity: false, message: 'Database error'});
        req.session.game_id = game._id;
        res.json({validity: true, message: 'Game joined.', playerNo: 2});
      });
    });
});

function checkEndgame(game){
  var winner = 'None';
  var ended = false;
  
  if(game.boatsSetP1 >= 5 && game.boatsSetP2 >= 5){
      if(gameLogic.hasBoardLost(JSON.parse(game.boardP1))){winner = 'P2'; ended = true;}
      if(gameLogic.hasBoardLost(JSON.parse(game.boardP2))){winner = 'P1'; ended = true;}
  }
  return {winner, ended};
}

router.get('/battleship/status/', function(req, res, next){

  Game.findById(req.session.game_id, (err, game) => {
    if(err) throw err;
    
    var endgame = checkEndgame(game);
    
    res.json({game, status: endgame});
  });
  
});

router.put('/battleship/place-ship/', function(req, res, next){
  Game.findById(req.session.game_id, (err, game) => {
    if (err) res.json({validity: false});
    
    var board = null;
    var boardObject = null;
    
    let playerNo = parseInt(req.body.playerNo);
    let shipSize = parseInt(req.body.size);
    
    if(playerNo === 1){board = JSON.parse(game.boardP1);}    
    else if(playerNo === 2){board = JSON.parse(game.boardP2);}
    
    boardObject = gameLogic.setBoat(board, shipSize, req.body.coordinateString, req.body.orientationString);
    
    if(boardObject.validity == true){
      if(playerNo === 1){
        game.boardP1 = JSON.stringify(boardObject.board);
        game.boatsSetP1 += 1;
      }    
      else if(playerNo === 2){
        game.boardP2 = JSON.stringify(boardObject.board);
        game.boatsSetP2 += 1;
      }
      
      game.save((err, obj) => {
        if (err) res.json({validity: false, message: 'Database error'});
        res.json(boardObject);
      });
    }
    else{
      res.json(boardObject);
    }
    
  });
});

router.put('/battleship/send-hit/', function(req, res, next){
  
  Game.findById(req.session.game_id, (err, game) => {
    if (err) res.json({validity: false});
    
    let playerNo = parseInt(req.body.playerNo);
    var board = null;
    var boardObject = null;
    
    if(playerNo === 1){board = JSON.parse(game.boardP2);}    
    else if(playerNo === 2){board = JSON.parse(game.boardP1);}
    
    boardObject = gameLogic.sendHit(board, req.body.coordinateString);
    
    if(boardObject.validity === true){
      game.turn = (game.turn === 'P1')? 'P2': 'P1';
      if(playerNo === 1){
        game.boardP2 = JSON.stringify(boardObject.board);
      }    
      else if(playerNo === 2){
        game.boardP1 = JSON.stringify(boardObject.board);
      }
      game.save((err, obj) => {
        if (err) res.json({validity: false, message: 'Database error'});
        var endgame = checkEndgame(obj);
        res.json({validity: true, message: 'Tiro realizado.', game: obj, status: endgame, message: boardObject.message});
      });
    }
    else{
      res.json({validity: false, message: 'Tiro no válido.'});
    }
  });

});




module.exports = router;
