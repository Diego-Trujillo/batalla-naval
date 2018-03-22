'use strict'
var mongoose = require('mongoose');
var gameTemplates = require('./game-templates.js');
var gameLogic = require('../game/game-logic');

var Ship = require('./ship');

var gameSchema = mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  name:   String,
  date: {type: Date, default: Date.now},
  state: {
      started: {type: Boolean, default: false},
      shipsPlaced: {type: Boolean, default: false},
      endgame: {type: Boolean, default: false},
      winner: {type: String, default: 'None', enum: ['None', gameTemplates.P1_STRING, gameTemplates.P2_STRING]}
  },
  player1: {
      id: {type: String, default: 'NoID'},
      name: {type: String, default: 'NoName'},
      ships: [Ship.schema],
      shipsSet: {type: Number, default: 0},
      message: {
          pending: {type: Boolean, default: false},
          content: {type: String},
          type: {type: String, enum: ['alert-success', 'alert-info', 'alert-warning', 'alert-danger']}
        },
      board: {type: String, 
                    default: JSON.stringify(gameTemplates.newBoard()),
                    get: (b) => JSON.parse(b),
                    set: (b) => JSON.stringify(b)
        }
    },
  player2: {
      id: {type: String, default: 'NoID'},
      name: {type: String, default: 'NoName'},
      ships: [Ship.schema],
      shipsSet: {type: Number, default: 0},
      message: {
          pending: {type: Boolean, default: false},
          content: {type: String},
          type: {type: String, enum: ['alert-success', 'alert-info', 'alert-warning', 'alert-danger']}
        },
      board: {type: String, 
                    default: JSON.stringify(gameTemplates.newBoard()),
                    get: (b) => JSON.parse(b),
                    set: (b) => JSON.stringify(b)
        }
    },
  turn: {type: String, default: gameTemplates.P1_STRING, enum: [gameTemplates.P1_STRING, gameTemplates.P2_STRING]}
});

gameSchema.methods.joinPlayer2 = function(id, name){
  this.player2.id = id;
  this.player2.name = name;
  this.state.started = true;
};

gameSchema.methods.placeShip = function(playerString, ship, boatCoordinates){
  var newShip = new Ship({name: ship.name, size: ship.size});
  
  newShip.setCoordinates(boatCoordinates);

  if(playerString === gameTemplates.P1_STRING){
    this.player1.ships.push(newShip);
    this.player1.board = gameLogic.setBoatOnBoard(this.player1.board, boatCoordinates);
    this.player1.shipsSet++;
  }
  else if(playerString === gameTemplates.P2_STRING){
    this.player2.ships.push(newShip);
    this.player2.board = gameLogic.setBoatOnBoard(this.player2.board, boatCoordinates);
    this.player2.shipsSet++;
  }
  
  this.checkIfAllShipsPlaced();
};

gameSchema.methods.checkIfAllShipsPlaced = function(){
  this.state.shipsPlaced = this.player1.shipsSet === gameTemplates.boardSettings.ships && this.player2.shipsSet === gameTemplates.boardSettings.ships;
};

gameSchema.methods.sendHit = function(playerString, coordinateInfo){
  if(playerString === gameTemplates.P1_STRING){
    this.player1.board = gameLogic.sendHitOnBoard(this.player1.board, coordinateInfo);
    this.player1.ships.forEach(function(ship, index, ships){
      ship.sendHit(coordinateInfo);
    });
  }
  else if(playerString === gameTemplates.P2_STRING){
    this.player2.board = gameLogic.sendHitOnBoard(this.player2.board, coordinateInfo);
    this.player2.ships.forEach(function(ship, index, ships){
      ship.sendHit(coordinateInfo);
    });
  }
};

gameSchema.methods.shiftTurn = function(){
  if(this.turn === gameTemplates.P1_STRING){
    this.turn = gameTemplates.P2_STRING;
  }
  else if(this.turn === gameTemplates.P2_STRING){
    this.turn = gameTemplates.P1_STRING;
  }
};

gameSchema.methods.getTotalHits = function(){
  var shipsHit = 0;
  this.player1.ships.forEach(function(ship, index, ships){shipsHit += ship.numberOfHits});
  this.player2.ships.forEach(function(ship, index, ships){shipsHit += ship.numberOfHits});
  return shipsHit;
};

gameSchema.methods.getShipsSunken = function(){
  let player1SS = this.player1.ships.filter((ship) => {return ship.sunken}).length;
  let player2SS = this.player2.ships.filter((ship) => {return ship.sunken}).length;
  return {player1: player2SS, player2: player1SS};
};

gameSchema.methods.checkEndGame = function(){
  var shipsSunken = this.getShipsSunken();
  if(shipsSunken.player1 === gameTemplates.boardSettings.ships){
    this.state.endgame = true;
    this.state.winner = gameTemplates.P1_STRING;
  }
  if(shipsSunken.player2 === gameTemplates.boardSettings.ships){
    this.state.endgame = true;
    this.state.winner = gameTemplates.P2_STRING;
  }
};

gameSchema.methods.setPendingMessageForOpponent = function(playerString, message){
   var opponent = this.getPlayer(gameTemplates.getOpponent(playerString));
   opponent.message.content = message.content;
   opponent.message.type = message.type;
   opponent.message.pending = true;
};

gameSchema.methods.getMessage = function(playerString){
  var player = this.getPlayer(playerString);
  return player.message;
};

gameSchema.methods.getMessageAndSetRead = function(playerString){
  var player = this.getPlayer(playerString);
  var message = JSON.parse(JSON.stringify(player.message));
  player.message.pending = false;
  return message;

};

gameSchema.methods.getPlayer = function(playerString){
  if(playerString === gameTemplates.P1_STRING){
    return this.player1;
  }
  else if(playerString === gameTemplates.P2_STRING){
    return this.player2;
  }
};

module.exports = mongoose.model('Game', gameSchema);
