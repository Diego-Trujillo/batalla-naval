'use strict'

var gameTemplates = require('../models/game-templates');

let validateCoordinateString = function(coordinate){
    return /^[A-Za-z][0-9]+$/.test(coordinate);
}

module.exports.isCoordinateWithinBoard = function(column, row){
  return 0 <= column && column <= gameTemplates.boardSettings.columns && 0 <= row && row <= gameTemplates.boardSettings.rows - 1;
}

module.exports.parseCoordinate = function(coordinate){
    if(validateCoordinateString(coordinate)){
        let column = gameTemplates.alphabet.indexOf(coordinate.charAt(0).toUpperCase());
        let row = parseInt(coordinate.slice(1)) - 1;
        
        if(module.exports.isCoordinateWithinBoard(column, row)){
            return {row: row, column: column, validity: true};
        }
        return {row: row, column: column, validity: false};
    }
    return {row: -1, column: -1, validity: false};

}



module.exports.getBoatCoordinatesFromStartingPosition = function(size, startCoordinate, directionString){

  var boatCoordinates = [];
  
  if(directionString === gameTemplates.orientation.HORIZONTAL){
    for(var i = startCoordinate.column; i < (startCoordinate.column + size); i++){
      boatCoordinates.push({row: startCoordinate.row, column: i});
    }
  }
  else if(directionString === gameTemplates.orientation.VERTICAL){
    for(var i = startCoordinate.row; i < (startCoordinate.row + size); i++){
      boatCoordinates.push({column: startCoordinate.column, row: i});
    }
  }
  return boatCoordinates;
}

module.exports.areCoordinatesWithinBoard = function(boatCoordinates){
  return boatCoordinates.every(function(coordinate){
            return module.exports.isCoordinateWithinBoard(coordinate.column, coordinate.row);
         });
}

module.exports.areBoardSpacesFree = function(board, boatCoordinates){
  return boatCoordinates.every(function(coordinate){
        return board[coordinate.row][coordinate.column] === gameTemplates.symbols.FREE;
      });
}

module.exports.setBoatOnBoard = function(board, boatCoordinates){
  var newBoard = board.slice(0);

  boatCoordinates.forEach(function(boatCoordinate, index, boatCoordinates){
    newBoard[boatCoordinate.row][boatCoordinate.column] = gameTemplates.symbols.OCCUPIED;
  });
  
  return board;
}

module.exports.sendHit = function(board, coordinateString){
    let coordinate = module.exports.parseCoordinate(coordinateString);
    var message = '¡Agua!';
    
    if(coordinate.validity == true){
        
        if(board[coordinate.row][coordinate.column] === 'B'){
            board[coordinate.row][coordinate.column] = "H";
            message = '¡Tocado!';
        }
        else if(board[coordinate.row][coordinate.column] === 'O'){
            board[coordinate.row][coordinate.column] = "X";
        }
        
    }
    
    return {board, validity: coordinate.validity, message};
}

module.exports.sendHitOnBoard = function(board, coordinate){

  var newBoard = board.slice(0);
  
  if(newBoard[coordinate.row][coordinate.column] === gameTemplates.symbols.OCCUPIED){
    newBoard[coordinate.row][coordinate.column] = gameTemplates.symbols.HIT;
  }
  else if(newBoard[coordinate.row][coordinate.column] === gameTemplates.symbols.FREE){
    newBoard[coordinate.row][coordinate.column] = gameTemplates.symbols.MARKED;
  }
  
  return newBoard;
}

module.exports.hasBoardLost = function(board){
  return board.every(function(row, index, array){
    return row.every(function(cell, index, array){
      return !(cell === 'B');
    });
  });
}

