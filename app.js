//core modules
var fs = require('fs');

//external modules
var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    passport = require('passport'),
    expressSession = require('express-session');


//external modules (middleware)
var flash = require('connect-flash');

//custom modules
var routing = require('./config/routing.js'),
    configPassport = require('./config/passportHandler.js');

configPassport(passport);
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/cloudomatic');

// create and configure express app
var app = express();
    
    //general configurations
    app.use(cookieParser());
    app.use(expressSession({ secret: 'Cloud is the way to go' }));

    app.use(flash());
    app.use(bodyParser());    
    app.use(express.static(__dirname + '/public'));

    //authentication related
    app.use(passport.initialize());
    app.use(passport.session());
	
    
    //view related configs
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/view');


    //logging configuration
        //for console
        app.use(morgan('dev'));
        //into file

    var appRouter = express.Router();
    app.use('/', appRouter);
    routing.applyRoutes(appRouter, passport);

app.listen(process.env.PORT || 8000);
