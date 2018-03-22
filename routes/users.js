var express = require('express');
var router = express.Router();

const Player = require(__dirname + '/../models/player.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  
  Player.find({}, function(err, users){
    if(err) throw err;
    res.render('users',{title: 'Users', username: {id: req.session.player_id, name: req.session.player_name}, users});
  });
  
});

router.get('/user-list/', function(req, res, next) {
  
  Player.find({}, {password: 0}, function(err, players){
    if(err) res.json({validity: false, message: {content: 'Error interno.', type:'alert-danger'}});
    res.json({validity: true, players, message: {content: 'Usuarios encontrados.', type:'alert-success'}});
  });
  
});

module.exports = router;
