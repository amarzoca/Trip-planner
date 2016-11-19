// Flow.

module.exports = function() {
  // Dependencies.
  var PriorityQueue = require('priorityqueuejs')
  var Skyscanner = require('../skyscanner/skyscanner.js')
  var sky = new Skyscanner();


  //
  // Interface.
  // Get best trips for user.
  this.getTrips = function(dates, callback) {
    var flow = this
    
    var callbackGetAccommodation = function(response) {
      console.log(response.data.length)
    }

    var i = 0
    var top_results = []

    var callbackAndContinue = function(response) {
      if(response.error)
        callback(response)
      else {
        top_results.push(response.data)
        i = i+1
        call(i)
      }
    }

    var call = function(i) {
      if(i === dates.length) {
        callback(top_results)
        return
      }


      flow.getTripsByDate(dates[i].departure_date, dates[i].return_date, callbackAndContinue)
    }

    call(i)
  }

  // Get best trips for user by date.
  this.getTripsByDate = function(departure_date, return_date, callback) {
    var flow = this

    var callback2 = function(response) {
      if(response.error) {
        console.log(response.error_message)
      } else {

        /*
        for(var i = 0; i < response.data.length; i++) {
          var from = response.data[i].OutboundLeg.Origin.IataCode
          var to = response.data[i].InboundLeg.Origin.IataCode
          sky.liveAirplanePrices(from, to, departure_date, return_date, 
            callbackPrint)
        }
        */
        var i = 0
        var callbackAndContinue = function(response2) {
          if(response2.error) {
            console.log(response2.error_message)
          } else {
            if(response2.data.Itineraries.length !== 0) {
              response.data[i].Itinerary = response2.data.Itineraries[0];
              response.data[i].Itinerary.OutboundLeg = flow.findLeg(response2.data.Legs, response2.data.Itineraries[0].OutboundLegId)
              response.data[i].Itinerary.InboundLeg = flow.findLeg(response2.data.Legs, response2.data.Itineraries[0].InboundLegId)
              console.log('#'+i)
              flow.printItinerary(response.data[i].Itinerary)
            } else {
              response.data[i].Itinerary = null
            }
            i = i + 1
            call(i)
          }
        }

        var call = function(i) {
          if(i === response.data.length) {
            var hasItinerary = function(e) {
              return (e.Itinerary !== null)
            }
            // We are done.
            callback({ error: false, data: response.data.filter(hasItinerary) })
            return
          }

          var from = response.data[i].OutboundLeg.Origin.IataCode
          var to = response.data[i].InboundLeg.Origin.IataCode
          sky.liveAirplanePrices(from, to, departure_date, return_date, 
            callbackAndContinue)
        }
        call(i)
      }
    }

    // Get cheapest destinations.
    sky.destinationsCheapest({ from: 'LOND', departure_date: departure_date, 
      return_date: return_date }, this.takeCheapest(10, callback2))
  }

  // Keep the cheapest n flights.
  this.takeCheapest = function(n, callback) {
    var flow = this  // Remember this.

    return function(response) {
      if(response.error) {
        callback(response)
      } else {
        // Take n.
         
        var queue = new PriorityQueue(function(a, b) {
          return a.MinPrice - b.MinPrice;
        });

        for(var i = 0; i < response.data.Quotes.length; i++)
          queue.enq(response.data.Quotes[i])

        while(queue.size() > n)
          queue.deq()

        top_results = new Array()
        while(queue.size() !== 0)
          top_results.push(queue.deq())
        top_results.reverse()  // Increasing order.

        // Populate.
        for(var i = 0; i < top_results.length; i++) {
          top_results[i].OutboundLeg.Origin = flow.findPlace(response.data.Places, top_results[i].OutboundLeg.OriginId)
          top_results[i].InboundLeg.Origin = flow.findPlace(response.data.Places, top_results[i].InboundLeg.OriginId)
          // Print.
          flow.printQuote(top_results[i])
        }

        callback({ error: false, data: top_results })
      }
    }
  }

  // Find a place.
  this.findPlace = function(db, id) {
    for(var i = 0; i < db.length; i++)
      if(db[i].PlaceId === id)
        return db[i]
  }

  // Find a leg.
  this.findLeg = function(db, id) {
    for(var i = 0; i < db.length; i++)
      if(db[i].Id === id)
        return db[i]
  }

  // Print quote.
  this.printQuote = function(quote) {
    console.log(quote.OutboundLeg.Origin.Name + ' (' + 
      quote.OutboundLeg.Origin.IataCode + ') to ' + 
      quote.InboundLeg.Origin.Name + ' (' + 
      quote.InboundLeg.Origin.IataCode + ') GBP ' + 
      quote.MinPrice)
  }

  // Print itinerary.
  this.printItinerary = function(itinerary) {
    console.log("Departure from " + itinerary.OutboundLeg.Departure +
      ' to ' + itinerary.OutboundLeg.Arrival +' ('+itinerary.OutboundLeg.Duration)
    console.log("Return from " + itinerary.InboundLeg.Departure +
      ' to ' + itinerary.InboundLeg.Arrival +' ('+itinerary.InboundLeg.Duration)
    console.log("At price >>>>>>> " + itinerary.PricingOptions[0].Price)
    console.log()
  }

  // Callback print.
  var callbackPrint = function(response) {
    if(response.error) {
      console.log(response.error_message)
    } else {
      console.log('#callbackPrint')
      console.log(response.data)
    }
  }
}
