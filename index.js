var express = require('express'),  //import external modules
    mongoose = require('mongoose'),
    url = require('url'),
    handler = require('./handler'), //import custom module
    app = express(); //create app with express

var mongoDB = process.env.MONGOLAB_URI; //store mongoDB url
mongoose.connect(mongoDB, { //connect to mongodb using mongoose
  useMongoClient: true
});
mongoose.Promise = global.Promise; //set mongoose promise to the global promise object
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:')); //catch connection errors

var Schema = mongoose.Schema; //establish the schema for the searches database
var searchSchema = new Schema({
  searchterm: String,
  datetime: Date
});

var SearchModel = mongoose.model('searchlists', searchSchema); //create the collection "searchlists" where the searches will be stored

app.use(function(err, req, res, next) { //middleware to try to catch errors
  if (err) {
    console.log(err)
    res.end('An error occurred');
  };
  next();
})

app.get('/', function(req, res){ //route for the home page of the app
  handler.home(req, res); //call the home page handler
});

app.get('/search/*', function(req, res){ //route for the /search path
  handler.search(req, res, SearchModel); //call the search handler
});

app.get('/history', function(req, res){ //route for the /history path
  handler.history(req, res, SearchModel); //call the history handler
});



app.listen(process.env.PORT); //listen to the port