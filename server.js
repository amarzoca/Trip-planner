// This is the main server file.


// Imports.
var express = require('express')
// var bodyParser = require('body-parser')
var app = express()
var auth_dep = require('./auth.js');
var auth = new auth_dep();

var cal_dep = require('./calendar.js');
var cal = new cal_dep();

var http = require('http')
var server = http.Server(app)

//Dependecies.
//app.use("/", express.static(__dirname + '/'))


// Redirect file requests.
app.get('/', function(req, res) {
  console.log("here");
  auth.getAuthLink(function(url) {
  	console.log("mad");
  	maybeRedirect(res, url);
  });
})

app.get('/success', function(req, res) {
	console.log("in success " + req.query.code);
	auth.fetchToken(req.query.code, function() {
		res.redirect("/");
	});
})

function maybeRedirect(res, url) {
	console.log(url + "in mayberedirect");
	if (url != null)
		res.redirect(url);
	else {
		var autho = auth.getAuth(); 
		console.log(autho);
		cal.getData(autho, function(data) {
			console.log(data);
      // Here we are done.


      // Own modules.
      var Flow = require('./modules/other/flow')

      // Get trips.
      var callback = function(response) {}
      var flow = new Flow()
      flow.getTrips(data, callback)



			res.sendFile(__dirname + '/index.html?data=' + data);
		});
  }
}

// The server.
// The port to listen to.
var port = Number(process.env.PORT || 3000)

// Listen.
server.listen(port, function(){
  console.log('listening on http:\\\\localhost:' + port)
})
