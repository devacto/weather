/*****************************************************************************
 *
 * String Interpolation
 *
 ****************************************************************************/

// Usage:
// alert("I'm {age} years old!".supplant({ age: 29 }));
// alert("The {a} says {n}, {n}, {n}!".supplant({ a: 'cow', n: 'moo' }));
String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};


(function() {
  'use strict';

  var weatherAPIUrlBase = 'https://publicdata-weather.firebaseio.com/';
  var restaurantAPIUrlBase = 'https://eatigo.herokuapp.com/';

  var backgroundUrlBase= "url('{picUrl}') center / cover"

  var app = {
    isLoading: true,
    visibleRestaurantCards: {},
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    restaurantCardTemplate: document.querySelector('.restaurantCardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };

  
  /*****************************************************************************
   *
   * Fake Restaurant Data
   *
   ****************************************************************************/
   
   var injectedRestaurant = [{
     "id": 0,
     "name": "Welcome!",
     "pic": "https://static.eatigo.com/eatigo_TokaikanJapaneseRestaurant_20170214152650_9784.jpg",
     "desc": "Unfortunately, you are offline."
   }]

  
  /*****************************************************************************
   *
   * Fake Forecast Data
   *
   ****************************************************************************/

  var injectedForecast = {
    key: 'newyork',
    label: 'New York, NY',
    currently: {
      time: 1453489481,
      summary: 'Clear',
      icon: 'partly-cloudy-day',
      temperature: 52.74,
      apparentTemperature: 74.34,
      precipProbability: 0.20,
      humidity: 0.77,
      windBearing: 125,
      windSpeed: 1.52
    },
    daily: {
      data: [
        {icon: 'clear-day', temperatureMax: 55, temperatureMin: 34},
        {icon: 'rain', temperatureMax: 55, temperatureMin: 34},
        {icon: 'snow', temperatureMax: 55, temperatureMin: 34},
        {icon: 'sleet', temperatureMax: 55, temperatureMin: 34},
        {icon: 'fog', temperatureMax: 55, temperatureMin: 34},
        {icon: 'wind', temperatureMax: 55, temperatureMin: 34},
        {icon: 'partly-cloudy-day', temperatureMax: 55, temperatureMin: 34}
      ]
    }
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  /* Event listener for refresh button */
  document.getElementById('butRefresh').addEventListener('click', function() {
    app.getRestaurants();
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateForecastCard = function(data) {
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.label;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }

    // Verify data is newer than what we already have, if not, bail.
    var dateElem = card.querySelector('.date');
    if (dateElem.getAttribute('data-dt') >= data.currently.time) {
      return;
    }

    card.querySelector('.description').textContent = data.currently.summary;
    card.querySelector('.date').textContent =
      new Date(data.currently.time * 1000);
    card.querySelector('.current .icon').classList.add(data.currently.icon);
    card.querySelector('.current .temperature .value').textContent =
      Math.round(data.currently.temperature);
    card.querySelector('.current .feels-like .value').textContent =
      Math.round(data.currently.apparentTemperature);
    card.querySelector('.current .precip').textContent =
      Math.round(data.currently.precipProbability * 100) + '%';
    card.querySelector('.current .humidity').textContent =
      Math.round(data.currently.humidity * 100) + '%';
    card.querySelector('.current .wind .value').textContent =
      Math.round(data.currently.windSpeed);
    card.querySelector('.current .wind .direction').textContent =
      data.currently.windBearing;
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.daily.data[i];
      if (daily && nextDay) {
        nextDay.querySelector('.date').textContent =
          app.daysOfWeek[(i + today) % 7];
        nextDay.querySelector('.icon').classList.add(daily.icon);
        nextDay.querySelector('.temp-high .value').textContent =
          Math.round(daily.temperatureMax);
        nextDay.querySelector('.temp-low .value').textContent =
          Math.round(daily.temperatureMin);
      }
    }
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Updating restaurant details
   *
   ****************************************************************************/

  // Updates restaurant cards given some data.
  app.updateRestaurantCard = function(restaurant) {
    var card = app.visibleRestaurantCards[restaurant.key];
    card = app.restaurantCardTemplate.cloneNode(true);
    card.classList.remove('restaurantCardTemplate');
    card.removeAttribute('hidden');
    app.container.appendChild(card);
    app.visibleRestaurantCards[restaurant.key] = card;
    card.querySelector('.name').textContent = restaurant.name;
    card.querySelector('.desc').textContent = restaurant.desc;
    card.querySelector('.picture').style.background = backgroundUrlBase.supplant({ picUrl: restaurant.pic });
    
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/
  
  app.updateRestaurants = function(restaurants) {
    for (var index = 0; index < restaurants.length; ++index) {
      app.updateRestaurantCard(restaurants[index]);
    }
  }

  // Gets restaurants from the injected object.
  app.getRestaurants = function() {
    var url = restaurantAPIUrlBase + 'restaurant';

    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          app.updateRestaurants(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };

  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function(key, label) {
    var url = weatherAPIUrlBase + key + '.json';
    if ('caches' in window) {
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function(json) {
            json.key = key;
            json.label = label;
            app.updateForecastCard(json);
          });
        }
      });
    }
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.key = key;
          response.label = label;
          app.updateForecastCard(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };

  document.addEventListener('DOMContentLoaded', function() {
    app.getRestaurants();
  });

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function() {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(key) {
      app.getForecast(key);
    });
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
     .register('/service-worker.js')
     .then(function() { 
        console.log('Service Worker Registered'); 
      });
  }

})();
