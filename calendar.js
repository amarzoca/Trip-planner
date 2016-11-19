module.exports = function() { 
    this.getData = function(auth, callback) { 
      listWeekends(auth, callback);
  }
};

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');


var MAX_WEEKENDS = 10;
var res = [];
function addWeekends(i, next_sat, calendar, auth, callback) {
  if (i == MAX_WEEKENDS)
    callback(res);
  else {
    var startDate = new Date(), endDate = new Date();
    startDate.setDate(next_sat.getDate() + i*7);
    startDate.setHours(0);
    endDate.setDate(next_sat.getDate() + i*7 + 2);
    endDate.setHours(0);
    console.log(startDate);
    console.log(endDate);
    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) { 
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var events = response.items;
      console.log(events.length);
      if (events.length == 0) {
        res.push({
          departure_date: startDate.toISOString().split("T")[0],
          return_date: endDate.toISOString().split("T")[0]
        });
      }
      addWeekends(i+1, next_sat, calendar, auth, callback);
    });
  }
}

function listWeekends(auth, callback) {
  res = [];
  console.log(google);
  var calendar = google.calendar('v3');

  var today = new Date();
  var whatday = today.getDay();
  var next_sat = new Date();

  if (whatday != 6) {
    var diff = (6 - whatday); 
    next_sat.setDate(today.getDate() + diff);
  }
  else next_sat.setDate(today.getDate() + 7);
  console.log(next_sat);

  var count = 0;

  addWeekends(0, next_sat, calendar, auth, callback);
  console.log(res);
}