
/* O - Free Space
   X - Marked Space
   B - Occupied by a Boat
   H - Hit Space */ 

'use strict'


// ------------------------------------- Settings
module.exports.boardSettings = {
    rows: 10,
    columns: 10,
    ships: 5
}

// ------------------------------------- Constant Strings
module.exports.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

module.exports.P1_STRING = 'P1';
module.exports.P2_STRING = 'P2';

module.exports.orientation = {HORIZONTAL: 'H', VERTICAL: 'V'};

/* O - Free Space
   X - Marked Space
   B - Occupied by a Boat
   H - Hit Space */ 
module.exports.symbols = {FREE: 'O', OCCUPIED: 'B', MARKED: 'X', HIT:'H'};

module.exports.hitState = {MISS: 0, HIT: 1};

module.exports.ships = [{name: 'Portaaviones', size: 5},
                        {name: 'Acorazado', size: 4},
                        {name: 'Crucero', size: 3},
                        {name: 'Submarino', size: 3},
                        {name: 'Destructor', size: 2}];

// ------------------------------------- Generators
module.exports.newBoard = function(){
    var gameBoard = [];
    
    for(var i = 0; i < exports.boardSettings.rows; i++){
        gameBoard.push([]);
        for(var j = 0; j < exports.boardSettings.columns; j++){
            gameBoard[i][j] = exports.symbols.FREE;
        }
    }
    return gameBoard;
};

// ------------------------------------- Utility Functions

module.exports.getOpponent = function(playerNumber){
  if(playerNumber === module.exports.P1_STRING){
    return module.exports.P2_STRING;
  }
  else if (playerNumber === module.exports.P2_STRING){
    return module.exports.P1_STRING;
  }
}