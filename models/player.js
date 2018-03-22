var mongoose = require('mongoose');

var playerSchema = mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  name:   String,
  password: String,
  victories: {type: Number, default: 0},
  gamesPlayed: {type: Number, default: 0}
});


module.exports = mongoose.model('Player', playerSchema);
