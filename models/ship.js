var mongoose = require('mongoose');

var shipSchema = mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  name: {type: String, default: 'Barco Genérico'},
  size: {type: Number},
  numberOfHits: {type: Number, default: 0},
  sunken: {type: Boolean, default: false},
  coordinates: [{ row: Number,
                  column: Number,
                  hasBeenHit: {type:Boolean, default: false}}]
});
                                                                                                                                           
shipSchema.methods.sendHit = function(coordinateBeingHit){
  this.coordinates.forEach((coordinate, index, coordinates) => {
    if(coordinate.row === coordinateBeingHit.row && coordinate.column === coordinateBeingHit.column){
      coordinate.hasBeenHit = true;
      this.checkNumberOfHits();
      this.checkIfSunken();
    }
  });
};

shipSchema.methods.checkNumberOfHits = function(){
  this.numberOfHits = this.coordinates.filter((coordinate) => {return coordinate.hasBeenHit;}).length;
}

shipSchema.methods.checkIfSunken = function(){
  this.sunken = this.coordinates.every((coordinate, index, coordinates) => { return coordinate.hasBeenHit});
};

shipSchema.methods.setCoordinates = function(boatCoordinates){
  this.coordinates = boatCoordinates;
};

module.exports = mongoose.model('Ship', shipSchema);
