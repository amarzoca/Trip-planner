// Flow.

module.exports = function(socket) {
  // Dependencies.
  var PriorityQueue = require('priorityqueuejs')
  var Skyscanner = require('../skyscanner/skyscanner.js')
  var sky = new Skyscanner();

  var trips_per_weekend = 20


  //
  // Interface.
  // Normalisation.
  this.lastNormalisation = function(dates, top_results, callback) {
    socket.emit('progress', 95)
    var r = new Array()
    for(var i = 0; i < dates.length; i++) {
      r.push(new Array())
      for(var j = 0; j < top_results[i].length; j++) 
        if(top_results[i][j].Accommodation !== null && top_results[i][j].Accommodation !== undefined) {
          var obj = {}
          obj.departure_date = dates[i].departure_date
          obj.return_date = dates[i].return_date
          obj.return_date2 = dates[i].return_date2
          obj.flight_price = Math.floor(top_results[i][j].Itinerary.PricingOptions[0].Price)
          obj.hotel_name = top_results[i][j].Accommodation.name
          obj.hotel_price = Math.floor(top_results[i][j].Accommodation.price)

          obj.price = obj.flight_price + obj.hotel_price

          obj.from = top_results[i][j].OutboundLeg.Origin.Name
          obj.from_airport = top_results[i][j].OutboundLeg.Origin.IataCode
          obj.from_co = top_results[i][j].OutboundLeg.Origin.CountryName
          obj.from_city = top_results[i][j].OutboundLeg.Origin.CityName
          obj.to = top_results[i][j].InboundLeg.Origin.Name
          obj.to_airport = top_results[i][j].InboundLeg.Origin.IataCode
          obj.to_co = top_results[i][j].InboundLeg.Origin.CountryName
          obj.to_city = top_results[i][j].InboundLeg.Origin.CityName

          obj.departure_time = top_results[i][j].Itinerary.OutboundLeg.Departure
          obj.return_time = top_results[i][j].Itinerary.InboundLeg.Departure

          obj.departure_delta = top_results[i][j].Itinerary.OutboundLeg.Duration
          obj.return_delta = top_results[i][j].Itinerary.InboundLeg.Duration

          obj.deep_link = top_results[i][j].Itinerary.PricingOptions[0].DeeplinkUrl

          if(obj.deep_link !== null && obj.deep_link !== undefined)
            r[i].push(obj)
        }

      r[i].sort(function(a, b) {
        return (a.price > b.price)
      })

      while(r[i].length > 3)
        r[i].pop()
    }

    callback({ error: false, data: r })
  }

  // Expand with accommmodation.
  this.addAccommodation = function(dates, top_results, callback) {
    var flow = this
    var data_id = 0
    var result_id = -1
    var results = top_results

    var callbackAndContinue = function(response) {
      if(response.error)
        callback(response)
      else {
        if(response.data !== null) {
          console.log("Found hotel")
          console.log(dates[data_id])
          console.log(response.data)
          console.log()
        }
        results[data_id][result_id].Accommodation = response.data
        call()
      }
    }

    var call = function() {
      socket.emit('progress', 75+(data_id)*10+(result_id / trips_per_weekend)*10)
      result_id += 1
      while(top_results.length !== data_id && top_results[data_id].length === result_id) {
        result_id = 0
        data_id += 1
      } 

      if(top_results.length === data_id) {
        console.log("Final")
        flow.lastNormalisation(dates, results, callback)
        return
      } else {
        // Just process.
        flow.getAccommodationByDateAndLocation(dates[data_id], 
          top_results[data_id][result_id], callbackAndContinue)
      }
    }

    call()
  }

  // Find accomodation for itinerary and 
  this.getAccommodationByDateAndLocation = function(date, itinerary, callback) {
    var callback2 = function(response) {
      if(response.error)
        callback(response)
      else {
        // For each accommodation.
        var i = 0
        hotels = []

        var callbackAndContinue = function(response) {
          if(response.error) {
            callback(response)
            return
          } else {
            var hotels = []
            for(var i = 0; i < response.data.hotels_prices.length; i++)
              if(response.data.hotels_prices[i].agent_prices.length !== 0) {
                hotels.push({ price: response.data.hotels_prices[i].agent_prices[0].price_total,
                  name: response.data.hotels[i].name })
              }

            var best = null
            if(hotels.length !== 0)
              best = findBestHotel(hotels)

            callback({ error: false, data: best })
          }
        }

        while(i < response.data.results.length && (response.data.results[i].geo_type !== "City" || response.data.results[i].display_name === itinerary.InboundLeg.Origin.CityName))
          i += 1

        if(i === response.data.results.length) {
          callback([])
          return
        }

        sky.getAccommodationPrice(response.data.results[i].individual_id, date, callbackAndContinue)
      }
    }

    var location = (itinerary.InboundLeg.Origin.CityName + ' ' + itinerary.InboundLeg.Origin.CountryName) || itinerary.InboundLeg.Origin.Name 
    // console.log(location)
    sky.getAccommodationsByDateAndLocation(location, callback2)
  }

  // Get best trips for user.
  this.getTrips = function(from2, dates, callback) {
    var flow = this

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
        flow.addAccommodation(dates, top_results, callback)
        return
      }


      flow.getTripsByDate(from2, i, dates[i].departure_date, dates[i].return_date, callbackAndContinue)
    }

    call(i)
  }

  // Get best trips for user by date.
  this.getTripsByDate2 = function(data_id, departure_date, return_date, callback) {
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
          socket.emit('progress', (i / response.data.length) * 20 + data_id * 20)
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
  }

  this.getTripsByDate = function(from2, data_id, departure_date, return_date, callback) {
    var flow = this

    var callback2 = function(response) {
      if(response.error) {
        console.log(response.error_message)
      } else {

        var number = 0
        
        var callbackAndContinue = function(i) {
          return function(response2) {
            if(response2.error) {
              console.log(response2.error_message)
            } else {
              socket.emit('progress', ((number+1) / response.data.length) * 25 + data_id * 25)
          
              if(response2.data.Itineraries.length !== 0) {
                response.data[i].Itinerary = response2.data.Itineraries[0];
                response.data[i].Itinerary.OutboundLeg = flow.findLeg(response2.data.Legs, response2.data.Itineraries[0].OutboundLegId)
                response.data[i].Itinerary.InboundLeg = flow.findLeg(response2.data.Legs, response2.data.Itineraries[0].InboundLegId)
                console.log('#'+i)
                flow.printItinerary(response.data[i].Itinerary)
              } else {
                response.data[i].Itinerary = null
              }

              number += 1
              if(number === response.data.length) {
                var hasItinerary = function(e) {
                  return (e.Itinerary !== null)
                }
                // We are done.
                callback({ error: false, data: response.data.filter(hasItinerary) })
                return
              }
            }
          }
        }

        var call = function(i) {
          var from = response.data[i].OutboundLeg.Origin.IataCode
          var to = response.data[i].InboundLeg.Origin.IataCode
          sky.liveAirplanePrices(from, to, departure_date, return_date, 
            callbackAndContinue(i))
        }


        for(var i = 0; i < response.data.length; i++) {
          call(i)
        }
      }
    }

    // Get cheapest destinations.
    sky.destinationsCheapest({ from: from2, departure_date: departure_date, 
      return_date: return_date }, this.takeCheapest(trips_per_weekend, callback2))
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

  var findBestHotel = function(hotels) {
    var queue = new PriorityQueue(function(a, b) {
      return a.cost - b.cost;
    });

    for(var i = 0; i < hotels.length; i++)
      queue.enq(hotels[i])

    while(queue.size() > 1)
      queue.deq()

    return queue.deq()
  }
}
