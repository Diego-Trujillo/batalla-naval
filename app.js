var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Rutas
var index = require('./routes/index');
var users = require('./routes/users');
var authR = require('./routes/auth');
var battleshipR = require('./routes/battleship');

var app = express();

// Agregando Socket.io a la aplicación
app.io = require('socket.io')();

// Agregando Mongoose a la aplicación
var mongoose = require('mongoose');

// Agregando cookie-session a la aplicación
var cookieSession = require('cookie-session');
app.use(cookieSession({ secret: 'Una cadena secreta.' }));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Agregando express-ejs-layouts
var expressEJSLayouts = require('express-ejs-layouts');
app.use(expressEJSLayouts);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/auth', authR);
app.use('/battleship', battleshipR);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// ======================= Eventos de socket.io =======================
var gameEngine = require('./game/game-engine')(app);


// ======================= Conexión de Mongoose =======================
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/batallanaval');
mongoose.connection.on('open', () => {
  console.log('Connected to MongoDB');
});
mongoose.connection.on('error', err => {
  console.log('Mongoose Error. ' + err);
});

module.exports = app;
