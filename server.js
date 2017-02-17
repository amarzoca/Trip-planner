// This is the main server file.


// Imports.
var express = require('express')
// var bodyParser = require('body-parser')
var app = express()
var auth_dep = require('./auth.js');
var auth = new auth_dep();

var cal_dep = require('./calendar.js');
var cal = new cal_dep();
var Flow = require('./modules/other/flow')

var http = require('http')
var server = http.Server(app)
var io = require('socket.io')(server)
var socket = null

//Dependecies.
app.use("/external", express.static(__dirname + '/external'))

/*
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
*/

// Redirect file requests.
app.get('/', function(req, res) {
  console.log("here");
  auth.getAuthLink(function(url) {
  	console.log("mad");
  	maybeRedirect(res, url);
  });
})


io.on('connection', function(so) {

  socket = so
  socket.on('disconnect', function() {

  })
})

var calendar_location = 'LOND'

var prettyPrint = function(best, data) {
  var s = '<div style="margin:100px 0px 0px 500px; font-size: 16px">'

  // Best.
    var obj = best
  var item2 =
    'Dates <b>' + obj.departure_date + '</b> to <b> ' + obj.return_date + '</b><br>' +
    'from <b>' + obj.from_city + ', ' + obj.from_co + 
    '</b> at <b>' + obj.departure_time.substring(11) + '</b><br>' +
    'to <b>' + obj.to_city  + ', ' + obj.to_co + 
    '</b> at <b>' + obj.return_time.substring(11) + '</b><br>' +
    '</b>with hotel <b>' + obj.hotel_name + '</b><br>' + 
    '<span style = "">price <b>' + obj.price + ' GBP</b> (flight + hotel = ' + obj.flight_price + 
    ' + ' + obj.hotel_price + ')</span><br>' +
    '<a href="' + obj.deep_link + '">Book now</a>.<br><br><br><br>'
  s += '<h4>Best deal for you</h4>' + item2

  for(var data_id = 0; data_id < data.length; data_id++)
    if(data[data_id].length !== 0) {
      s += '<h4>Weekend of ' + data[data_id][0].departure_date + ' to ' +
        data[data_id][0].return_date + '</h4>'

      for(var i = 0; i < data[data_id].length; i++) {
        var obj = data[data_id][i]
        var item =
          'from <b>' + obj.from_city + ', ' + obj.from_co + 
          '</b> at <b>' + obj.departure_time.substring(11) + '</b><br>' +
          'to <b>' + obj.to_city  + ', ' + obj.to_co + 
          '</b> at <b>' + obj.return_time.substring(11) + '</b><br>' +
          '</b>with hotel <b>' + obj.hotel_name + '</b><br>' + 
          '<span style = "">price <b>' + obj.price + ' GBP</b> (flight + hotel = ' + obj.flight_price + 
          ' + ' + obj.hotel_price + ')</span><br>' +
          '<a href="' + obj.deep_link + '">Book now</a>.<br><br>'

        s += item
      }

    }

    s += '</div>'
  // Send to 
  socket.emit('results', s)
}

var getDescription = function(obj, oa, ob, data) {
  var TEXT = "We've noticed that you don't have anything planned this weekend, how about a trip?";

  var s = TEXT + '' +
    ' From ' + obj.from_city + ', ' + obj.from_co + 
    ' at ' + obj.departure_time.substring(11) + '' +
    ' to ' + obj.to_city  + ', ' + obj.to_co + 
    ' at ' + obj.return_time.substring(11) + '' +
    ' with hotel ' + obj.hotel_name + '' + 
    ' for a price of ' + obj.price + ' GBP (flight + hotel = ' + obj.flight_price + 
    ' + ' + obj.hotel_price + ').' +
    ' Book now: ' + obj.deep_link

/*  s+= '                                               Other best deals for you '
  s+= 'to ' + data[oa][0].to_city + ' starting from ' + data[oa][0].price +' GBP'
  //  '<br><a href="' + data[oa].deep_link + '">Book now</a>.<br>' +
  s+= ' and to ' + data[ob][0].to_city + ' starting from ' + data[ob][0].price + ' GBP'
  //  '<br><a href="' + data[ob].deep_link + '">Book now</a>.<br>'*/

  return s
}

var TEXT = "We've noticed that you don't have anything planned this weekend, how about a trip?";
function maybeRedirect(res, url) {
	if (url != null)
		res.redirect(url);
	else {
              res.sendFile(__dirname + '/index.html');
		var autho = auth.getAuth(); 
		console.log(autho);
		cal.getData(autho, function(data) {

      var n_weekends = 3

      while(data.length > n_weekends)
        data.pop()

      var callback = function(response) { 
        console.log(response.data)
        var best = null
        var oa = 0
        var ob = 2

        if(response.data.length !== 0 && response.data[0].length !== 0 ) {
          best = response.data[0][0]
          oa = 1
          ob = 2
        }

        if(best === null || (response.data.length > 1 && response.data[1].length !== 0 && response.data[1][0].price < best.price)) {
          best = response.data[1][0]
          oa = 0
          ob = 2
        }

        if(best === null || (response.data.length > 2 && response.data[2].length !== 0 && response.data[2][0].price < best.price)) {
          best = response.data[2][0]
          oa = 0
          ob = 1
        }

        console.log("Best is >>>>>>>>>>>>>>>")
        console.log(best)
        var description = getDescription(best, oa, ob, response.data)
        prettyPrint(best, response.data)

        console.log(description)

        // Make calendar event for best.
        cal.addEvent(autho, "Your upcoming trip", description, best.departure_date, best.return_date2, function () {
          socket.emit('notification', "An event was created for you.")
        });
      }
      var flow = new Flow(socket)
      var start_location = calendar_location  // LOND
      flow.getTrips(start_location, data, callback)
		});
  }
}

app.get('/success', function(req, res) {
	console.log("in success " + req.query.code);
	auth.fetchToken(req.query.code, function() {
		res.redirect("/");
	});
})

// The server.
// The port to listen to.
var port = Number(process.env.PORT || 3000)

// Listen.
server.listen(port, function(){
  console.log('listening on http:\\\\localhost:' + port)
})
