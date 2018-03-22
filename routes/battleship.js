var express = require('express');
var router = express.Router();
var gameLogic = require('../game/game-logic');
var gameTemplates = require('../models/game-templates');

const Game = require(__dirname + '/../models/game.js');
const Player = require(__dirname + '/../models/player.js');

router.post('/create-game/', function(req, res, next){
    var newGame = new Game({name: req.body.name, player1: {id: req.session.player_id, name: req.session.player_name}});

    newGame.save((err, game) => {
      if (err) res.json({validity: false, gameCreated: false, message: {content: 'No se pudo crear un juego en este momento.', type:'alert-danger'}});
      
      req.session.game_id = newGame._id;
      req.session.player_number = gameTemplates.P1_STRING;
      
      res.json({validity: true, gameCreated: true, game, message: {content: 'Nuevo juego creado con éxito.', type:'alert-success'}});
    });
    
});

router.get('/games-list/', function(req, res, next){
    Game.find({'state.started': false}, (err, games) => {
        if(err) res.json({validity: false, message: {content: 'No se pudo obtener la lista de juegos en este momento.', type:'alert-danger'}});
        var gamesSummary = games.map(function(game, index, array){
          return {id: game._id, name: game.name, player: game.player1.name};
        });
        
        res.json({validity: true, games: gamesSummary, message: {content: 'Lista de juegos obtenida con éxito.', type:'alert-success'}});
    });
});

router.put('/join-game/', function(req, res, next) {
    Game.findById(req.body.game_id, (err, game) => {
      if(err) res.json({validity: false, gameJoined: false, message: {content: 'No se pudo unir al juego en este momento.', type:'alert-danger'}});
      
      if(game === undefined){
        res.json({validity: true, gameJoined: false, message: {content: 'No se encontró el juego especificado.', type:'alert-danger'}});
      }
      else{
        req.session.game_id = game._id;
        req.session.player_number = gameTemplates.P2_STRING;
        
        game.joinPlayer2(req.session.player_id, req.session.player_name);
        var content = req.session.player_name + ' se ha unido al juego.'
        game.setPendingMessageForOpponent(req.session.player_number, {content, type:'alert-success'});
        
        game.save((err, obj) => {
          if(err) res.json({validity: false, gameJoined: false, message: {content: 'No se pudo unir al juego en este momento.', type:'alert-danger'}});

          res.json({validity: true, gameJoined: true, message: {content: 'Unido al juego con éxito.', type:'alert-success'}});
        });
      }
    });
});

router.get('/game-state/', function(req, res, next){
    Game.findById(req.session.game_id, (err, game) => {
      if(err) res.json({validity: false, message: {content: 'No se pudo obtener el estado del juego especificado.', type:'alert-danger'}});
      
      var message = game.getMessage(req.session.player_number);
      
      if(message.pending === true){
        message = game.getMessageAndSetRead(req.session.player_number);
        game.save((err, obj) => {
          if(err) res.json({validity: false, message: {content: 'No se pudo obtener el estado del juego especificado.', type:'alert-danger'}});
          res.json({validity: true, game, message, session: req.session});
        });
      }
      else{
        res.json({validity: true, game, message, session: req.session});
      }
    });
});

router.put('/place-ship/', function(req, res, next){
    Game.findById(req.session.game_id, (err, game) => {
      if(err) res.json({validity: false, shipPlaced: false, message: {content: 'No se pudo obtener el estado del juego especificado.', type:'alert-danger'}});

      var coordinate = gameLogic.parseCoordinate(req.body.coordinateString);
      var orientation = req.body.orientationString;
      
      var ship = JSON.parse(req.body.ship);
      
      var boatCoordinates = gameLogic.getBoatCoordinatesFromStartingPosition(ship.size, coordinate, orientation);
      
      if(coordinate.validity === true){
        var currentPlayer = game.getPlayer(req.session.player_number);
        
        if(gameLogic.areCoordinatesWithinBoard(boatCoordinates) && gameLogic.areBoardSpacesFree(currentPlayer.board, boatCoordinates)){
          game.placeShip(req.session.player_number, ship, boatCoordinates);
          
          game.save((err, game) =>{
            if (err) res.json({validity: false, shipPlaced: false, message: {content: 'No se pudo colocar la nave.', type:'alert-danger'}});
            res.json({validity: true, shipPlaced: true, player: currentPlayer, message: {content: 'Nave colocada.', type:'alert-success'}});
          });
        }
        else{
          res.json({validity: true, shipPlaced: false, message: {content: 'Coordenadas de barco inválidas.', type:'alert-danger'}});
        }
      }
      else{
        res.json({validity: false, shipPlaced: false, message: {content: 'Coordenada invalida.', type:'alert-danger'}});
      }
    });
});

router.put('/send-hit/', function(req, res, next) {
    Game.findById(req.session.game_id, (err, game) => {
      if(err) res.json({validity: false, message: {content: 'No se pudo obtener el estado del juego especificado.', type:'alert-danger'}});
      
      var coordinate = gameLogic.parseCoordinate(req.body.coordinateString);
      
      if(coordinate.validity === true){
        var stateBefore = {totalHits: game.getTotalHits(), shipsSunken: game.getShipsSunken()};

        game.sendHit(gameTemplates.getOpponent(req.session.player_number), coordinate);
        game.checkEndGame();
        
        var stateAfter = {totalHits: game.getTotalHits(), shipsSunken: game.getShipsSunken()};
        
        var playerMessage = {content: '', type: ''};
        var opponentMessage = {content: '', type: ''};
        
        if(stateBefore.totalHits === stateAfter.totalHits){
          game.shiftTurn();
          playerMessage = {content: '¡Agua!', type: 'alert-info'};
        }
        else{
          if((stateBefore.shipsSunken.player1 !== stateAfter.shipsSunken.player1) || (stateBefore.shipsSunken.player2 !== stateAfter.shipsSunken.player2)){
            playerMessage = {content: '¡Hundido!', type: 'alert-success'};
            opponentMessage = {content: '¡Un barco tuyo ha sido hundido!', type: 'alert-danger'};
          }
          else{
            playerMessage = {content: '¡Tocado!', type: 'alert-success'};
            opponentMessage = {content:'¡Un barco tuyo ha sido atacado!', type: 'alert-warning'};
          }
          game.setPendingMessageForOpponent(req.session.player_number, opponentMessage);
        }
        
        game.save((err, game) =>{
            if (err) res.json({validity: false, message: {content: 'No se pudo colocar la nave.', type:'alert-danger'}});
            res.json({validity: true, turn: game.turn, message: playerMessage});
        });
      }
      else{
        res.json({validity: false, message: {content: 'Coordenada inválida', type:'alert-danger'}});
      }

    });
});

module.exports = router;
