// This is the main server file.


// Imports.
var express = require('express')
// var bodyParser = require('body-parser')
var app = express()

var http = require('http')
var server = http.Server(app)
// var io = require('socket.io')(server)

// Own modules.
var Flow = require('./modules/other/flow')

// Dependecies.
// app.use("/modules/frontend", express.static(__dirname + '/modules/frontend'))
// app.use("/style", express.static(__dirname + '/style'))

/*
// Redirect file requests.
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})
*/


// Get trips.
var callback = function(response) { 
  console.log(response.data) 
  if(response.data.length !== 0)
    best = response.data[0]

  if(response.data.length > 1 && response.data[1].price < best.price)
    best = response.data[1]

  if(response.data.length > 2 && response.data[2].price < best.price)
    best = response.data[2]

  // Make calendar event for best.
}
var flow = new Flow()
flow.getTrips([{departure_date: '2016-11-26', return_date: '2016-11-27'},
  {departure_date: '2016-12-10', return_date: '2016-12-11'},
  {departure_date: '2016-12-17', return_date: '2016-12-18'}], callback)


// s.calendar('DFWA', 'LHR');
// s.autosuggest('dallas fort worth');


// When a new user connects. This is a private socket between the server and
// this user.
/*
io.on('connection', function(socket) {
  // Create a new flow.
  var flow = Flow(socket, database)

  socket.on('disconnect', function(data) {
    // Free memory.
    flow = undefined
  })
})
*/

// The server.
// The port to listen to.
var port = Number(process.env.PORT || 3000)

/*
// Listen.
server.listen(port, function(){
  console.log('listening on http:\\\\localhost:' + port)
})
*/