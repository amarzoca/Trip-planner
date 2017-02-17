module.exports = function() { 
    this.getAuthLink = function(callback) { 
    	findAuthLink(callback);
	}
	this.getStoredToken = function(callback) {
		fs.readFile(TOKEN_PATH, function(err, token) {
		  	if (err) {
		      console.log("Error getting stored token " + err);
		    } else {
		        oauth2Client.credentials = JSON.parse(token);
      			callback(oauth2Client);
		    }
		});
	}
	this.fetchToken = function(code, callback) {
	  	oauth2Client.getToken(code, function(err, token) {
	   		if (err) {
		        console.log('Error while trying to retrieve access token', err);
		        return;
	      	}
	      	oauth2Client.credentials = token;
	  		//console.log(oauth2Client);
	      	storeToken(token, callback);
    	});
	}
	this.getAuth = function() {
		return oauth2Client;
	}
};

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var oauth2Client;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
//var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  //  process.env.USERPROFILE) + '/.credentials/';
var TOKEN_DIR = './';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';



fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
  console.log("in findauthlink");
  var credentials = JSON.parse(content);
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = "http://localhost:3000/success";
  var auth = new googleAuth();
  oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function findAuthLink(callback) {
  console.log("in authorize");

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(null);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log(authUrl + "in getnewtoken");
  callback(authUrl);
  /*
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });*/
}


function storeToken(token, callback) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
  callback();
}



