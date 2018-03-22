'use strict'

// -------------------------------------------------------------- Requires 
const stringify   = require('querystring').stringify;
const promisify   = require('./helpers/promisify');
const request = require('request');
const readlineSync = require('readline-sync');
const util = require('util');
const colors = require('colors');
const clear = require("cli-clear");
const Table = require('cli-table');

// -------------------------------------------------------------- Game
var gameLogic = require('./game/game-logic');
var gameTemplates = require('./models/game-templates');

// -------------------------------------------------------------- Constants & Variables
   
const battleShipText = ` _____       _         _  _         _____                 _ 
| __  | ___ | |_  ___ | || | ___   |   | | ___  _ _  ___ | |
| __ -|| .'||  _|| .'|| || || .'|  | | | || .'|| | || .'|| |
|_____||__,||_|  |__,||_||_||__,|  |_|___||__,||__/ |__,||_|`;

const victoryText = `
 _______  _______  __    _  _______  _______  _______  _______ 
|       ||   _   ||  |  | ||   _   ||       ||       ||       |
|    ___||  |_|  ||   |_| ||  |_|  ||  _____||_     _||    ___|
|   | __ |       ||       ||       || |_____   |   |  |   |___ 
|   ||  ||       ||  _    ||       ||_____  |  |   |  |    ___|
|   |_| ||   _   || | |   ||   _   | _____| |  |   |  |   |___ 
|_______||__| |__||_|  |__||__| |__||_______|  |___|  |_______|`;

const defeatText = `
 _______  _______  ______    ______   ___   _______  _______  _______ 
|       ||       ||    _ |  |      | |   | |       ||       ||       |
|    _  ||    ___||   | ||  |  _    ||   | |  _____||_     _||    ___|
|   |_| ||   |___ |   |_||_ | | |   ||   | | |_____   |   |  |   |___ 
|    ___||    ___||    __  || |_|   ||   | |_____  |  |   |  |    ___|
|   |    |   |___ |   |  | ||       ||   |  _____| |  |   |  |   |___ 
|___|    |_______||___|  |_||______| |___| |_______|  |___|  |_______|`;

const REQUEST_INTERVAL = 1000; //ms
                                           
var player = {id: '', name: '', number: '', board: ''};
var opponent = {id: '', name: '', board: '', dataSet: false};

var game = {id: ''};

var ships = null;


// -------------------------------------------------------------- HTTP Request

// ---------------------------------------- validate HOSTNAME
if(process.argv.length !== 3){
  console.log('Se debe especificar nombre de host y puerto: http://<hostname>:<puerto>');
  process.exit(0);
}

let hostname = process.argv[2];

// ---------------------------------------- init Session Cookies
var sessionCookies = null;

// ---------------------------------------- get Session Cookies
function getCookies(res){
  if(res.headers['set-cookie']){
    var cookies = [];
    res.headers['set-cookie'].forEach((cookieString) => { cookies.push(/([^=]+=[^;]+);/.exec(cookieString)[1])});
    sessionCookies = cookies.join('; ');
  }
}

// ---------------------------------------- set Request Headers
function getHeaders(method){
  var headers = {};
  if(method !== 'GET'){
    headers['Content-type'] = 'application/x-www-form-urlencoded';
  }
  if(sessionCookies){
    headers['Cookie'] = sessionCookies;
  }
  
  return headers;
}

// ---------------------------------------- set Body
function setBody(options, body){
  let bodyString = stringify(body);
  
  if(options.method === 'GET' && bodyString !== ''){
    options.path += '?' + bodyString;
  }
  else{
    options.body = bodyString;
  }

  return options;
}
  
// ---------------------------------------- set Options
function setOptions(method, path, params){
  var options = {
    url: hostname + path,
    method,
    headers: getHeaders(method)
  };
  
  options = setBody(options, params);
  
  return options;
}

// ---------------------------------------- perform an HTTP Request
function performHTTPRequest(method, path, params, callback){
  let options = setOptions(method, path, params);
      
  request(options, function(err, response, body){
    if(err) {
      printFormattedMessage({content: 'Error: El servidor no está disponible en este momento.', type:'alert-danger'});
      process.exit(1);
    }
    else{
      getCookies(response);
      callback(JSON.parse(body), response);
    }
  });
}
// -------------------------------------------------------------- Utility Functions

function printBoard(boardString, showShips){
  var board = JSON.parse(boardString);
  
  let boardSettings = gameTemplates.boardSettings;
  console.log('|   | A | B | C | D | E | F | G | H | I | J |'.bold.underline);
  for(var i = 0; i < boardSettings.rows; i++){
    
    var numberColumnString = '';
    if((i+1) > 9){numberColumnString = '|' + (i+1) + ' | ';}
    else{numberColumnString = '| ' + (i+1) + ' | ';}
    process.stdout.write(numberColumnString.bold);
    
    for( var j = 0; j < boardSettings.columns; j++){
      var contentString = board[i][j];
      
      switch(contentString){
        case gameTemplates.symbols.FREE:
          process.stdout.write(' ' + ' | ');
          break;
        case gameTemplates.symbols.OCCUPIED:
          if(showShips){
            process.stdout.write('O'.bold.green + ' | ');
          }
          else{
            process.stdout.write(' ' + ' | ');
          }
          break;
        case gameTemplates.symbols.HIT: 
          process.stdout.write('X'.bold.red + ' | ');
          break;
        case gameTemplates.symbols.MARKED:
          process.stdout.write('X'.gray + ' | ');
          break;
        default:
          process.stdout.write(contentString + ' | ');
          break;
      }
      
    }
    console.log('');
  }
}

function printPlayerBoards(){
  // ----
  console.log(opponent.name.bold + ' Oponente'.gray);
  printBoard(opponent.board, false);
  console.log('');

  console.log('- - - - - - - - - - - - - - - - - - - - - - -');
  
  console.log(player.name.bold + ' Tú'.gray);
  printBoard(player.board, true);
  console.log('');
  // ----
}

function resetShips(){
  var newShips = gameTemplates.ships.slice(0);
  
  while(gameTemplates.boardSettings.ships !== newShips.length){
    newShips.pop();
  }
  return newShips;
}

function printFormattedMessage(message){
  if(message.type === 'alert-success'){console.log('\n' + message.content.bold.green + '\n');}
  else if (message.type === 'alert-danger'){console.log('\n' + message.content.bold.red + '\n');}
  else if(message.type === 'alert-info'){console.log('\n' + message.content.bold.cyan + '\n');}
  else if(message.type === 'alert-warning'){console.log('\n' + message.content.bold.yellow + '\n');}
  else{console.log('\n' + message.content.gray + '\n');}
}
// -------------------------------------------------------------- User Interaction

// -------------------------------- Clears the screen and prints header
function newScreen(message){
  clear();
  console.log(battleShipText);
  console.log('');
  
  if(message !== undefined){
    console.log(message.bold);
  }
  
  console.log('');
}

// -------------------------------- Shows login menu
function loginMenu(){
  console.log('Selecciona una opción:'.underline);
  let menuOptions = ['Iniciar sesión', 'Crear un nuevo usuario'];
  let selectedOption = readlineSync.keyInSelect(menuOptions, '> ', {cancel: "Salir", guide: false});
  
    switch(selectedOption){
    case 0:
      newScreen('Inicio de sesión');
      login();
      break;
    case 1:
      newScreen('Registrar nuevo jugador');
      register();
      break;
    default:
      console.log('\n¡Hasta luego!'.underline);
      process.exit(0);
  }
}

// -------------------------------- Login screen logic
function login(){

  var username = readlineSync.question('Ingesa tu nombre de usuario > ');
  var password = readlineSync.question('Ingresa tu contraseña       > ', {hideEchoBack: true});
  
  performHTTPRequest('POST', '/auth/login/', {name: username, password}, function(body, response) {
    if(body.validity === true && body.loggedIn === true){
      player.name = body.player.name;
      player.id = body.player.id;
      newScreen('Menu principal');
      menu();
    }
    else{
      printFormattedMessage(body.message);
      loginMenu();
    }
  });
}

// -------------------------------- New user screen logic
function register(){

  var username = readlineSync.question('Ingresa un nombre de usuario > ');
  var password = readlineSync.questionNewPassword('Ingresa una contraseña       > ', {min: 6, unmatchMessage: 'Las contraseñas no coinciden, inténtalo de nuevo: ', confirmMessage: 'Ingresa la contraseña de nuevo: '});
  
  performHTTPRequest('POST', '/auth/new-user/', {name: username, password}, function(body, response) {
    if(body.validity === true && body.created === true){
      player.name = body.player.name;
      player.id = body.player.id;
      newScreen('Menu principal');
      menu();
    }
    else{
      printFormattedMessage(body.message);
      loginMenu();
    }
  });
}

// -------------------------------- Main menu logic
function menu(){

  let welcomeString = '¡Bienvenid@, ' + player.name +'!\n';
  
  console.log(welcomeString.dim);
  console.log('Selecciona una opción:'.underline);
  
  let menuOptions = ['Ver instrucciones', 'Unirse a un juego', 'Crear un juego', 'Listar usuarios', 'Cerrar sesión', 'Créditos'];
  
  let selectedOption = readlineSync.keyInSelect(menuOptions, '>', {cancel: "Salir", guide: false});
  
  switch(selectedOption){
    case 0:
      //Instrucciones
      break;
    case 1:
      //Unirse a un juego
      listGames();
      break;
    case 2:
      //Crear un juego
      createGame();
      break;
    case 3:
      listUsers();
      break;
    case 4:
      logout();
      break;
    case 5:
      credits();
      break;
    default:
      console.log('\n¡Hasta luego!'.underline);
      process.exit(0);
  }
}

// -------------------------------- Join game logic
function listGames(){
  newScreen('Unirse a un juego');
  
  performHTTPRequest('GET', '/battleship/games-list/', {}, function(body, response){
    if(body.validity === true){
      if(body.games.length === 0){
        console.log('No hay juegos disponibles.'.yellow.bold);
        console.log('');
        if(readlineSync.keyInYNStrict('¿Te gustaría crear uno?') === true){
          createGame();
        }
        else{
          newScreen('Menú principal');
          menu();
        }
      }
      else{
        console.log('Juegos disponibles:'.underline);
        let gameNames = body.games.map((game, index, games) => {return game.name;});
        let selectedGame = readlineSync.keyInSelect(gameNames, '> ', {cancel: "Regresar al menú.", guide: false});
        
        if(selectedGame < 0){
          newScreen('Menú principal');
          menu();
        }
        else{
          joinGame({id: body.games[selectedGame].id, name: body.games[selectedGame].name});
        }
      }
    }
    else{
      printFormattedMessage(body.message);
      console.log('Menú principal'.bold);
      menu();
    }
  });
}

function joinGame(game){
  performHTTPRequest('PUT', '/battleship/join-game/', {game_id: game.id}, function(body, response) {
    if(body.validity === true && body.gameJoined === true){
      player.number = gameTemplates.P2_STRING;
      ships = resetShips();
      placeShips();
    }
    else{
      printFormattedMessage(body.message);
      console.log('Menú principal'.bold);
      menu();
    }
      
  });
}


// -------------------------------- Create game logic
function createGame(){
  newScreen('Crear un nuevo juego');
  var gameName = readlineSync.question('Ingresa el nombre del juego > ', {defaultInput: 'Juego de ' + player.name});
  
  performHTTPRequest('POST', '/battleship/create-game/', {name: gameName}, function(body, response){
    console.log('\n' + gameName.underline + ' creado.');
    
    if(body.validity === true && body.gameCreated === true){
      player.number = gameTemplates.P1_STRING;
      ships = resetShips()
      placeShips();
    }
    else{
      printFormattedMessage(body.message);
      console.log('Menú principal'.bold);
      menu();
    }
  });
}

// -------------------------------- Place Ships
function getCoordinate(){
  console.log('');
  var coordinateString = readlineSync.question('Ingresa una coordenada > ');
  
  var parsedCoordinate = gameLogic.parseCoordinate(coordinateString);
  
  if(parsedCoordinate.validity === true){
    return coordinateString;
  }
  else{
    console.log('\n' + 'Coordenada inválida.'.bold.red);
    return getCoordinate();
  }
}

function getOrientation(){
  console.log('\nSelecciona una orientación: ');
  let orientation = readlineSync.keyInSelect(['Horizontal'], '> ', {cancel: 'Vertical'});

  if(orientation === 0){
    return gameTemplates.orientation.HORIZONTAL;
  }
  else if(orientation === -1){
    return gameTemplates.orientation.VERTICAL;
  }
}

function placeShips(){
  newScreen('Colocar naves');
  placeShip(ships[0]);
}

function placeShip(ship){
  console.log('Colocando: '.underline);
  console.log(' -- ' + ship.name);
  console.log(' -- Tamaño : ' + ship.size);
  
  var coordinateString = getCoordinate();
  var orientationString = getOrientation();
  
  
  performHTTPRequest('PUT', '/battleship/place-ship/', {ship: JSON.stringify(ship), coordinateString, orientationString, player: JSON.stringify(player)}, function(body, response) {
      if(body.validity === true && body.shipPlaced === true){
        if(ships.length == 1){
          newScreen('Juego');
          console.log('Esperando a un jugador o a que ambos coloquen sus naves.'.grey);
          getStatus();
        }
        else{
          newScreen('Colocar naves');
          printBoard(body.player.board, true);
          ships = ships.splice(1);
          placeShip(ships[0]);
        }
      }
      else{
        printFormattedMessage(body.message);
        placeShip(ships[0]);
      }
  });
}

// -------------------------------- getStatus
function getStatus(){
  performHTTPRequest('GET', '/battleship/game-state/', {}, function(body, response) {
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
  });
}

// -------------------------------- Send Hit 
function sendHit(){
  
  console.log('Tu turno\n'.underline);
  
  printPlayerBoards();
  
  var coordinateString = getCoordinate();
  
  performHTTPRequest('PUT', '/battleship/send-hit/', {coordinateString}, function(body, response) {
    
    if(body.validity === true){
      //newScreen('Juego');
      printFormattedMessage(body.message);
      
      getStatus();
      
    }
    else{
      //newScreen('Juego');
      printFormattedMessage(body.message);
      
      sendHit();
    }

  });
}
// -------------------------------- EndGame
function endGame(winner){
  if(winner === player.number){
    console.log(victoryText.bold.green + '\n');
  }
  else{
    console.log(defeatText.bold.red + '\n');
  }
  
  console.log('\nPresiona cualquier tecla para regresar al menú.');
  readlineSync.keyInPause('', {guide: false});
  
  newScreen('Menú principal');
  menu();
}
// -------------------------------- List users logic
function listUsers(){
  newScreen('Lista de jugadores');
  
  performHTTPRequest('GET', '/users/user-list/', {}, function(body, response) {
    if(body.validity === true){
      
      var table = new Table({
          head: ['Numero', 'Nombre', 'Partidas Jugadas', 'Victorias']
      });
      
      
      body.players.forEach((player, index, players) =>{
        table.push([index, player.name, player.gamesPlayed, player.victories]);
      });
      
      console.log(table.toString());
      
      console.log('\nPresiona cualquier tecla para regresar al menú.');
      readlineSync.keyInPause('', {guide: false});
      
      newScreen('Menú principal');
      menu();
    }
    else{
      console.log('\n' + body.message.content.bold.red + '\n');
      console.log('Menú principal'.bold);
      menu();
    }
  });
}

// -------------------------------- Logout logic
function logout(){
  performHTTPRequest('POST', '/auth/logout/', {}, function(body, response) {
    if(body.validity === true && body.loggedOut === true){
      player.name = '';
      player.id = '';
      player.number = '';
      game.id = '';
      loginMenu();
    }
    else{
      console.log('\n' + body.message.content.bold.red + '\n');
      console.log('Menú principal'.bold);
      loginMenu();
    }
  });
}

// -------------------------------- Credits logic
function credits(){
  newScreen('Battleship v 1.0');
  console.log('\nProyecto desarrollado para la clase de ' + 'Desarrollo de Aplicaciones Web'.bold + ', impartida en el Tecnológico de Monterrey, Campus Estado de México en el Semestre Agosto-Diciembre de 2016.\n' );
  
  console.log('Autores'.underline);
  console.log('Andrea Iram Molina Orozco - A01374040');
  console.log('Diego Trujillo Norberto   - A01360477');
  console.log('');
  
  console.log('Tecnologías Utilizadas'.underline);
  console.log(' - Node.js');
  console.log('   - Express.js');
  console.log('   - mongoose');
  console.log('   - request');
  console.log('   - readline-sync');
  console.log('   - ' + 'colors'.rainbow);
  console.log('   - cli-clear');
  console.log('   - cli-tables');
  console.log(' - MongoDB');
  console.log('');
  
  console.log('Agradecimientos'.underline);
  console.log('Mtro. Ariel Ortiz Ramírez');
  console.log('TAAG - (http://patorjk.com/software/taag)');
  console.log('');
  
  console.log('\nPresiona cualquier tecla para regresar al menú.');
  readlineSync.keyInPause('', {guide: false});
  
  newScreen('Menú principal');
  menu();
}

// -------------------------------------------------------------- Start Game
newScreen('Battleship v 1.0 - Cliente de texto');
loginMenu();