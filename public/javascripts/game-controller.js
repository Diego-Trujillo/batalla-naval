// ----------------------------------------------------------------------------- GLOBAL DECLARATIONS
/* global htmlBoard */
/* global $ */
/* global produceAlert */
// ----------------------------------------------------------------------------- CONSTANTS

var shipsAvailable = [{name: 'Portaaviones', size: 5}, {name: 'Acorazado', size: 4}, {name: 'Crucero', size: 3}, {name: 'Submarino', size: 3}, {name: 'Destructor', size: 2}];

var boardSettings = {rows: 10, columns: 10, ships: 5 };


var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var alphabetLowerCase = alphabet.toLowerCase();

var REQUEST_INTERVAL = 1000;
var TOTAL_SHIPS = 5;
// ----------------------------------------------------------------------------- VARIABLES
var orientationString = 'H';
var selectedShip = {name: 'Portaaviones', size: 5};

var dummyBoard =  [ [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ],
                    [ 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O' ] ];

var gameData = {id: '', name: '', turn:''};
var gameState = {started: false, shipsPlaced: false, endgame: false, winner: 'None'};
var playerData = {id: '', name: '', number: '', board: '', ships: ''};
var opponentData = {id: '', name: '', number: '', board: ''};

var gameDataObtained = false;

var mainTimeout = null;
// ----------------------------------------------------------------------------- LOGIC

// ------------------------------------------------------- Validate Coordinates
function validateCoordinateString(coordinateString){
    if(coordinateString == ''){
      return false;
    }
    
    var firstChar = coordinateString.charAt(0);
    
    if(alphabet.indexOf(firstChar) < 0 && alphabetLowerCase.indexOf(firstChar) < 0 ){
      console.log(firstChar);
      return false;
    }
    
    var rest = coordinateString.slice(1);

    var rowNumber = parseInt(rest);

    if(isNaN(rowNumber)){
      return false;
    }
    
    return true;
}

function isCoordinateWithinBoard(column, row){
  return 0 <= column && column <= boardSettings.columns && 0 <= row && row <= boardSettings.rows - 1;
}

function parseCoordinate(coordinate){
    if(validateCoordinateString(coordinate)){
        let column = alphabet.indexOf(coordinate.charAt(0).toUpperCase());
        let row = parseInt(coordinate.slice(1)) - 1;
        
        if(isCoordinateWithinBoard(column, row)){
            return {row: row, column: column, validity: true};
        }
        return {row: row, column: column, validity: false};
    }
    return {row: -1, column: -1, validity: false};

}

// ----------------------------------------------------------------------------- UTILS
function setupData(body){
  playerData.name = body.session.player_name;
  playerData.id = body.session.player_id;
  playerData.number = body.session.player_number;
  
  var opponent = getPlayer(getOpponentNumber(playerData.number), body);
  opponentData.id = opponent.id;
  opponentData.name = opponent.name;
  opponentData.number = getOpponentNumber(playerData.number);

  
  gameState = body.game.state;
  
  gameData.id = body.game._id;
  
  console.log(gameData)
  console.log(playerData);
  console.log(opponentData);
  console.log(gameState);
  
  
  gameDataObtained = true;
  
  updateLocalState(body);
}

function updateLocalState(body){
  var player = getPlayer(playerData.number, body);
  playerData.board = JSON.parse(player.board);
  playerData.ships = player.ships;
  
  var opponent = getPlayer(getOpponentNumber(playerData.number), body);
  opponentData.board = JSON.parse(opponent.board);
  
  setShipsAvailable(player.ships);
  
  gameState = body.game.state;
  gameData.turn = body.game.turn;

}

function getOpponentNumber(playerNumber){
  if(playerNumber == 'P1'){
    return 'P2';
  }
  else if(playerNumber == 'P2'){
    return 'P1';
  }
}

function getPlayer(playerNumber, body){
  if(playerNumber == 'P1'){
    return body.game.player1;
  }
  else if(playerNumber == 'P2'){
    return body.game.player2;
  }
}

function setShipsAvailable(setShips){
  var newArr = shipsAvailable.slice(0);

  setShips.forEach(function(shipSet, index, shipsSet){
    newArr = newArr.filter(function(shipAvailable, index, shipsAvailable){
        return shipSet.name != shipAvailable.name;
    });
  });
  
  shipsAvailable =  newArr;
  
  if(shipsAvailable.length > 0){
    selectedShip.name = shipsAvailable[0].name;
    selectedShip.size = shipsAvailable[0].size;
  }
  else{
    selectedShip = null;
  }
}

// ----------------------------------------------------------------------------- GENERATORS

// ------------------------------------------------------- Get Cell Class
function getCellClass(symbol, forPlayer){
  switch(symbol){
    case 'O':
      return 'battleship-cell-free';
    case 'X':
      return 'battleship-cell-marked';
    case 'B':
      if(forPlayer){
        return 'battleship-cell-occupied';
      }
      else{
        return 'battleship-cell-free';
      }
      
    case 'H':
      return 'battleship-cell-hit';
    default:
      return 'battleship-cell-free';
  }
}

// ------------------------------------------------------- Fill Player Board
function fillBoard(board, htmlElement, forPlayer){
  var htmlBoard = '<div class="row" id="' + htmlElement +'"style="margin-bottom: 5px;">';
  
  // -------------------------- Number Columns
  for(var k = 0; k <= 9; k++){
    if(k == 0){
      htmlBoard += '<div class="col-xs-1 col-xs-offset-1 text-center" ><strong>'+ alphabet.charAt(k) + '</strong></div>';
    }
    else{
      htmlBoard += '<div class="col-xs-1 text-center"><strong>'+ alphabet.charAt(k) + '</strong></div>';
    }
  }
  
  htmlBoard += '</div>';
  // -------------------------- Content
  for(var i = 0; i < 10; i++){
    htmlBoard += '<div class="row" style="margin-bottom: 5px;"><div class="col-xs-1 text-center"><strong>'+ (i+1) +'</strong></div>';
    for(var j = 0; j < 10; j++){
      htmlBoard += '<div class="col-xs-1"><div class="col-xs-12 battleship-cell ' + getCellClass(board[i][j], forPlayer) + ' rounded"></div></div>'
    }
    htmlBoard += '</div>';
  }
  
  htmlBoard += '</div>';
  
  $('#' + htmlElement).empty().append(htmlBoard)
}

// ------------------------------------------------------- Draw Boards
function drawBoards(){
  fillBoard(playerData.board, 'player-board', true);
  fillBoard(opponentData.board, 'opponent-board', false);
}

// ------------------------------------------------------- Draw Setup
function drawSetup(){
  $('#game-name').text('  ' + gameData.name);
  if(opponentData.id != 'NoID'){
    $('#opponent-name').text(opponentData.name);
  }

  drawUpdates();
}

// ------------------------------------------------------- Present Updates
function drawUpdates(){
  if(gameState.shipsPlaced == false){
    if(shipsAvailable.length == 0){$('#shipPanel').hide();}
    else{
      $('#selectedShipText').text(selectedShip.name);
      presentSelectableShips();
    }
  }
  else{
    $('#shipPanel').hide();
      if(gameData.turn == playerData.number){
        $('#game-status').replaceWith('<span class=" col-xs-12 label label-success" id="game-status">Tu turno</span>');
      }
      else{
        $('#game-status').replaceWith('<span class=" col-xs-12 label label-danger" id="game-status">Turno de ' + opponentData.name +'</span>');
      }
  }

  drawBoards();
}
// ------------------------------------------------------- Hide All Ships
function hideShips(){
  $('#Portaaviones').hide();
  $('#Acorazado').hide();
  $('#Crucero').hide();
  $('#Submarino').hide();
  $('#Destructor').hide();
}
// ------------------------------------------------------- Show all ships
function showSelectableShips(){
  shipsAvailable.forEach(function(ship, index, ships){
    $("#" + ship.name).show();
  });
}

// ------------------------------------------------------- Present Available Ships
function presentSelectableShips(){
  hideShips();
  showSelectableShips();
}


// ------------------------------------------------------- Produce Alert on Messages
function produceAlertOnMessages(type, message){
    // <button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
    $('#messages-title').after("<div id='#messageBoard' class='alert "+ type +"' role='alert'>" + message + "</div>");
}


// ----------------------------------------------------------------------------- GAME ENGINE
function performAJAXRequest(method, path, params, errorMessage, successCallback){
  $.ajax({
    url: path,
    type: method,
    dataType: 'json',
    data: params,
    error: function(){
      produceAlert('alert-danger', errorMessage);
    },
    success: successCallback
  });
};

function getStateOnce(callbackSuccess){
  $.ajax({
    url: '/battleship/game-state/',
    type: 'GET',
    dataType: 'json',
    data: {},
    error: function(){produceAlert('alert-danger', 'No se pudo obtener el estado del juego');},
    success: callbackSuccess
  });
}

function getState(){
    $.ajax({
    url: '/battleship/game-state/',
    type: 'GET',
    dataType: 'json',
    data: {},
    error: function(){
      produceAlert('alert-danger', 'No se pudo obtener el estado del juego.');
    },
    success: function(body){
      if(body.validity === true){
        if(body.message.pending === true){
          produceAlertOnMessages(body.message.type, body.message.content);
        }
        
        updateLocalState(body);
        drawUpdates();
        
        if(gameState.started && !gameState.endgame && gameState.shipsPlaced){
          if(gameData.turn != playerData.number){
            mainTimeout = setTimeout(getState, REQUEST_INTERVAL);
          }
        }
        else if(gameState.endgame){
          if(gameState.winner == playerData.number){
            produceAlertOnMessages('alert-success', 'Ganaste.');
          }
          else{
            produceAlertOnMessages('alert-danger', 'Perdiste.');
          }
        }
        
        
        
      }
      else{
        produceAlert('alert-danger', 'No se pudo obtener el estado del juego.');
      }
    }
  });
}

function typeCoordinate(coordinateString){

  if(gameState.endgame != true){
    
    if(shipsAvailable.length != 0){
      performAJAXRequest('PUT', '/battleship/place-ship/', {coordinateString: coordinateString, orientationString: orientationString, ship: JSON.stringify(selectedShip)}, 'No se pudo colocar la nave.',function(body){
        if(body.validity == true && body.shipPlaced == true){
          console.log(body);
          var stringSuccess = selectedShip.name + ' colocado en ' + coordinateString;
          produceAlertOnMessages('alert-success', stringSuccess);
          
          getStateOnce(function(body){
            console.log(body);
            if(body.validity == true){
              
              updateLocalState(body);
              drawUpdates();

              if(playerData.ships.length == TOTAL_SHIPS){getState();}
            }});
        }
      });
    }
    else{
      // wait or send hit
      if(gameState.started && gameState.shipsPlaced){
        if(gameData.turn == playerData.number){
          produceAlertOnMessages('alert-success', 'Tiro efectuado en ' + coordinateString);
          performAJAXRequest('PUT', '/battleship/send-hit/', {coordinateString: coordinateString}, 'No se pudo colocar la nave.',function(body){
            if(body.validity == true){
              getState();
              produceAlertOnMessages(body.message.type, body.message.content);
            }
          });
        }
        else{
          produceAlertOnMessages('alert-warning', 'No es tu turno.')
        }

      }
      
    }
  }
}

/*

if(body.validity === true){
 
 if(body.message.pending === true){
   printFormattedMessage(body.message);
 }
 
 if(!body.game.state.started || !body.game.state.shipsPlaced){
   setTimeout(getStatus, REQUEST_INTERVAL);
 }
 else{
   if(!body.game.state.endgame){
     if(body.game.turn == player.number){
       // -----
       if(opponent.dataSet === false){
         opponent.number = gameTemplates.getOpponent(player.number);
         if(opponent.number === gameTemplates.P1_STRING){
           opponent.id = body.game.player1._id;
           opponent.name = body.game.player1.name;
         }
         else if (opponent.number === gameTemplates.P2_STRING){
           opponent.id = body.game.player2._id;
           opponent.name = body.game.player2.name;
         }
       }
       // -----
       
      if(player.number === gameTemplates.P1_STRING){
         player.board = body.game.player1.board;
         opponent.board = body.game.player2.board;
       }
       else if (player.number === gameTemplates.P2_STRING){
         player.board = body.game.player2.board;
         opponent.board = body.game.player1.board;
       }
       sendHit();
     }
     else{
       setTimeout(getStatus, REQUEST_INTERVAL);
     }
   }
   else{
     endGame(body.game.state.winner);
   }
 }
}
else{
 printFormattedMessage(body.message);
 setTimeout(getStatus, REQUEST_INTERVAL);
}

*/
// ----------------------------------------------------------------------------- GAME START
$(document).ready(function(){

  fillBoard(dummyBoard, 'player-board', true);
  fillBoard(dummyBoard,'opponent-board', false);
   
   
  // ---------------------------------------------------------- Ship Placement Selectors
  $( "#orientationButtonHorizontal" ).click(function() {
    orientationString = 'H';
    $('#selectedOrientationText').text('Horizontal');
  });
  
  $( "#orientationButtonVertical" ).click(function() {
    orientationString = 'V';
    $('#selectedOrientationText').text('Vertical');
  });
  
  $( ".ship-item" ).click(function() {
    var shipID = this.id
    
    var shipSelectedT = shipsAvailable.filter(function(shipAv){
      return shipAv.name == shipID;
    });
    
    selectedShip.name = shipSelectedT[0].name;
    selectedShip.size = shipSelectedT[0].size;

    $('#selectedShipText').text(shipID);
  });
  
  // ---------------------------------------------------------- Coordinate Form Selector

  $( "#coordinate-form" ).submit(function( event ) {
    event.preventDefault();

    var coordinateString = $('#coordinateStringInput').val() || '';

    var coordinateObject = parseCoordinate(coordinateString);
    
    
    if(coordinateObject.validity == true){
      typeCoordinate(coordinateString);
    }
    else{
      produceAlertOnMessages('alert-danger','Coordenada inválida');
    }
    
    
  });
 
  getStateOnce(function(body){
                  if(body.validity === true){
                    //produceAlertOnMessages('alert-info', JSON.stringify(body))
                    
                    setupData(body);
                    drawSetup();
                    
                    //getState();
                  }
                  else{
                    produceAlert('alert-danger', 'No se pudo obtener el estado del juego');
                  }
                });
                
                
    produceAlertOnMessages('alert-info', 'Coloca tus barcos seleccionando el barco y la orientación y tecleando la coordenada.');
});