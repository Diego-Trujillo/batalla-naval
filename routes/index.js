'use strict'

var express = require('express');
var router = express.Router();
var gameLogic = require('../game/game-logic');

const Game = require(__dirname + '/../models/game.js');
const Player = require(__dirname + '/../models/player.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.session.player_id);
  res.render('index', { title: 'Battleship', username: {id: req.session.player_id, name: req.session.player_name}});
});

router.get('/games/', function(req, res, next){
    Game.find({'state.started': false}, (err, games) => {
        if(err) throw err;
        
        var gamesSummary = games.map(function(game, index, array){
          return {id: game._id, name: game.name, player: game.player1.name};
        });
        if(req.session.player_id != undefined || req.session.player_id != null){
          res.render('games', {games: gamesSummary, username: {id: req.session.player_id, name: req.session.player_name}});
        }
        else{
          res.render('login', {username: {id: req.session.player_id, name: req.session.player_name}});
        }
        
    });
});

router.get('/game/', function(req, res, next) {
  res.render('game', {username: {id: req.session.player_id, name: req.session.player_name}});
   
});

router.get('/rules/', function(req, res, next) {
    res.render('rules', {username: {id: req.session.player_id, name: req.session.player_name}});
});

router.get('/about/', function(req, res, next) {
    res.render('about', {username: {id: req.session.player_id, name: req.session.player_name}});
});

router.get('/login/', function(req, res, next) {
    res.render('login', {username: {id: req.session.player_id, name: req.session.player_name}});
});

router.get('/sign-up/', function(req, res, next) {
  res.render('signup', {username: {id: req.session.player_id, name: req.session.player_name}});    
});

module.exports = router;
