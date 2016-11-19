
module.exports = function(params) {
  params = params || {}
  this.market = params.market || 'GB'
  this.currency = params.currency || 'GBP'
  this.language = params.language || 'en-gb'

  var base_url = 'http://partners.api.skyscanner.net/apiservices'
  var api_key = 'al297388699288099894800404880594'
  var secret_key = 'ha906464854775459164611892547937'

  // Module dependencies.
  var request = require("request")

  // Get base url.
  this.getBase = function(endpoint) {
    return base_url + '/' + endpoint + '/v1.0/' + this.market + '/' + 
      this.currency + '/' + this.language
  }


  //
  // Interface.
  // Get a list of cheapest quotes.
  this.destinationsCheapest = function(params, callback) {
    // Example request.
    // http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/{market}/
    // {currency}/{locale}/{originPlace}/{destinationPlace}/{outboundPartialDate}/
    // {inboundPartialDate}?apiKey={apiKey}
    
    // Get search parameters.
    params = params || {};
    var from = params.from 
    var to = params.to || 'anywhere'
    var departure_date = params.departure_date || 'anytime';
    var return_date = params.return_date || 'anytime';

    var predicate = [ from, to, departure_date, return_date ].join('/');

    var url = this.getBase('browsequotes') + '/' + predicate + '?apiKey=' + api_key
    console.log(url)

    // Make the request.
    request(url, function (error, response, body) {
      if (!error) {
        var data = JSON.parse(body);
        callback({ error: false, data: data })
      } else {
          callback({ error: true, error_message: error })
      }
    })
  }

  // For a given pair of 
  var deprecatedGetDateForRoute = function(params, callback) {
    // Example request.
    // http://partners.api.skyscanner.net/apiservices/browsedates/v1.0/{market}/
    // {currency}/{locale}/{originPlace}/{destinationPlace}/{outboundPartialDate}/
    // {inboundPartialDate}?apiKey={apiKey}
    
    // Get search parameters.
    params = params || {};
    var from = params.from 
    var to = params.to 
    var departure_date = params.departure_date || 'anytime';
    var return_date = params.return_date || 'anytime';

    var predicate = [ from, to, departure_date, return_date ].join('/');

    var url = this.getBase('browsedates') + '/' + predicate + '?apiKey=' + api_key
    console.log(url)

    // Make the request.
    request(url, function (error, response, body) {
      if (!error) {
        var data = JSON.parse(body);
        callback({ error: false, data: data })
      } else {
          callback({ error: true, error_message: error })
      }
    })
  }

  // Live prices.
  this.liveAirplanePrices = function(from, to, dep_date, ret_date, callback) {
    this.getSessionUrl(from, to, dep_date, ret_date, function(response) {
      if(response.error)
        callback(response)
      else {
        var tryToGet = function() {
          var url = response.session_url + '?apiKey=' + secret_key
          url += '&stops=0'  // No stops.
          url += '&outbounddeparttime=M'  // Monday leave.
          url += '&inbounddeparttime=E'  // Monday leave.


          // console.log(url)

          // Make the request.
          setTimeout(function() {
          request(url, function (error, response, body) {
            if (error) {
              callback({ error: true, error_message: error })
            } else {
              if(!body) {  // We have to retry.
                // console.log("Retrying")
                tryToGet()
                return
              }
              var data = JSON.parse(body);
              callback({ error: false, data: data })
            }
          })
          }, 400)
        }
        tryToGet()
      }
    })
  }

  // Get session url for airplanes.
  this.getSessionUrl = function(from, to, dep_date, ret_date, callback) {
    var parameters = 'apiKey='+secret_key+'&country='+this.market+'&currency='+
      this.currency+'&locale='+this.language+'&originplace='+from+'-sky'+
      '&destinationplace='+to+'-sky&outbounddate='+dep_date+'&inbounddate='+ret_date+
      '&adults=1'

    // console.log(parameters)
    // Make post.
    request.post({
      url: 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: parameters
    }, function (error, response, body) {
      if (error) {
          callback({ error: true, error_message: error })
      } else {
        // console.log(response.headers)
        callback({ error: false, session_url: response.headers.location })
      }
    })
  }
}



/*
encodeURIComponent(JSON.stringify({ 
        apiKey: secret_key, 
        country: this.market, 
        currency: this.currency, 
        locale: this.language, 
        originplace: 'LTN', 
        destinationplace: 'GVA', 
        outbounddate: '2016-11-26',
        inbounddate: '2016-11-27', 
        adults: 1
      }))
/**
 * Gets flights for a specific date range.
 
Skyscanner.prototype.calendar = function(from, to, opts) {
  opts = opts || {};
  var departureDate = opts.departureDate || 'anytime';
  var returnDate = opts.returnDate || 'anytime';
  var predicate = [
    'calendar',
    from, to, departureDate, returnDate
  ].join('/');
  var url = this.getBase() + predicate + '/?includequotedate=true';
  return new P(function(resolve, reject) {
    return R.get(url).promise().then(function(res) {
      return resolve(res.body);
    }).catch(function(err) {
      return reject(JSON.parse(err.error.text).DebugItems[0]);
    });
  });
};

/**
 * Autosuggest
 
Skyscanner.prototype.autosuggest = function(query, opts) {
  opts = opts || {};
  var language = opts.language || 'EN';
  var url = BASE + 'geo/v1.0/autosuggest/' + this.country + '/' + language + '/' + query;
  return new P(function(resolve, reject) {
    return R.get(url).promise().then(function(res) {
      return resolve(res.body);
    }).catch(function(err) {
      return reject(err);
    });
  });
};

module.exports = Skyscanner;
*/