var https = require("https");

function home(req, res) {
  res.sendFile(__dirname + '/home.html') //send the homepage html when requested by the route
};

function search(req, res, SearchModel) {
  var query = require('url').parse(req.url).pathname.slice(8), //parse the query part of the request (starts right after .me)
      httpurl; //establish the url variable that'll be used when making a GET request to google's API
  var start = require('url').parse(req.url).search; //store the user's "?offset=<number>" inclusion if there was one

  //this part of the code is crappy, should clean it up
  if (require('url').parse(req.url).search) { //if there was a "?offset" piece in the request
    if (require('url').parse(req.url).search.length === 9) { //then was it complete? it has to be exactly ?offset=<number>, which is 9 characters
    var start = require('url').parse(req.url).search.slice(8); //if it was 9 characters, then get the number at the end
    httpurl = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyDrTobyrZadrfQy1ZVDkMSiRkXUsvOEOXM&cx=003466034443143113784:i59flizxxdq&q=' + query + '&start=' + start; //and include that number in the api url, which uses "&start=<number>" for this capability
    } else { //if it was not exactly 9, then catch that error with this response
    res.end('Request URL is malformed. To paginate through responses, please add a "?offset=<number>" to your request');
    }
  } else { //if there was no "?offset" piece at all, then just form the api url like this
    httpurl = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyDrTobyrZadrfQy1ZVDkMSiRkXUsvOEOXM&cx=003466034443143113784:i59flizxxdq&q=' + query
  }
  
  var add = new SearchModel({ //adding a new document to the collection with these key/values
    searchterm: query.replace(/%20/g, ' '), //whatever query they typed in after '.me' in app's url
    datetime: new Date().toISOString() //the exact time that the query was made, so that it can be pulled when someone requests history
  });
  add.save(function(err){ //save the new document
    if (err) throw err;
  });
  
  https.get(httpurl, function(data) { //make the actual request to the api, using the constructed url from above
    var results = [];
    data.setEncoding("utf8");
    var body = '';
    
    data.on("data", function(chunk) { //add each chunk to the body
      body += chunk;
    });
    
    data.on("end", function() {
      body = JSON.parse(body); //parse the body in json
      if (body.items) { //if there were any results...
      var results = [];
        for (var i=0; i<body.items.length; i++) { //then for each result
          if (body.items[i].pagemap.cse_image) { //if the result had an image
          var out = {}; //create this object which shows the image's url, the snippet text, and the source page's url
          out.imgUrl = body.items[i].pagemap.cse_image[0].src;
          out.altText = body.items[i].snippet;
          out.pageUrl = body.items[i].link;
          results.push(out); //push the object to results
          }
        };
      var jsonString = JSON.parse(JSON.stringify(results));
      res.end(JSON.stringify(jsonString,null,2)); //clean up the results for human viewing and output to response
      } else { //if there were no results for the search, catch it with this error
        res.end('No images matched your search. Please modify your search term(s).');
      }
    });
  });
}


function history(req, res, SearchModel) { 
  SearchModel.find({}, { _id: 0, searchterm: 1, datetime: 1 }).sort({datetime: -1}).limit(10).exec(function(err, docs) { //query the searches collection, sort the results by decreasing date, and return the most recent 10
    if (err) throw err;
    res.end(JSON.stringify(docs, null, 2)); //clean up the results for human viewing and output to response
  })
};

exports.home = home;
exports.history = history;
exports.search = search;