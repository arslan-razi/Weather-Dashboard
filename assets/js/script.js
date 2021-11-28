/* Global Variables */
/* left-column elements */
var searchFormEl = document.querySelector("#search-form");
var searchInputEl = document.querySelector("#search-input");
var searchErrorMessageEl = document.querySelector("#search-error-message");
var searchHistoryEl = document.querySelector("#search-history");

/* right-column elements */
var rightColumnEl = document.querySelector(".right-column");
var cityNameEl = document.querySelector("#city-name");
var currentDateEl = document.querySelector("#current-date");
var currentIconEl = document.querySelector("#current-weather-icon");
var currentTempEl = document.querySelector("#current-temperature");
var currentHumidityEl = document.querySelector("#current-humidity");
var currentWindSpeedEl = document.querySelector("#current-wind-speed");
var currentUvIndexValueEl = document.querySelector("#current-uv-index-value");
var forecastCardsListEl = document.querySelector("#forecast-cards-list");

/* variables to store weather condition codes*/

// Weather condition codes for favorable weather conditions
var favorableWeatherConditions = [701, 721, 800, 801, 802, 803, 804];
// Weather condition codes for moderate weather conditions
var moderateWeatherConditions = [ 300, 301, 302, 311, 500, 501, 600, 601, 612, 615, 620, 731, 741,];
// Weather condition codes for severe weather conditions
var severeWeatherConditions = [ 200, 201, 202, 210, 211, 212, 221, 230, 231, 232, 312, 313, 314, 321, 502, 503, 504, 511, 520, 521, 522, 531, 602, 611, 613, 616, 621, 622, 711, 751, 761, 762, 771, 781,];

/* declares variables to store API URLs and Key */
// Current Weather API Path
var currentWeatherApiPath = "https://api.openweathermap.org/data/2.5/weather?q=";
// Forecast API Path
var forecastApiPath = "https://api.openweathermap.org/data/2.5/forecast?q=";
// UV Index Path
var uvIndexApiPath = "https://api.openweathermap.org/data/2.5/uvi?appid=";
// path to weather condition icons hosted by openweathermap.org
var iconPath = "https://openweathermap.org/img/wn/";

// API Key acquired from https://openweathermap.org. 
var openWeatherMapApiKey = "5ac09593ed93bab0e9a566ed3893e237";

// variable used to store the currentCity being searched
var currentCity;

/* declares global variables to store longitude and latitude of currentCity being searched.
This is needed to fetch data from "UV Index" API which only uses lat and lon (not cityName) */
var currentLat = 0;
var currentLon = 0;

// declares an empty array for the city search history list
var searchListArray = [];

// Common Methods 
// Converts the epoch date into the web-design date format 
var convertDate = function (epochDate) {
  var day = epochDate.getDate();
  var month = epochDate.getMonth() + 1; // Adds one because month returned by `getMonth()` method starts at 0 index!
  var year = epochDate.getFullYear();

  var convertedDate = month + "/" + day + "/" + year;
  return convertedDate;
};

// Resets 
var resets = function () {
  // resets search-form input for every new search
  searchInputEl.value = "";

  // resets error message if no city was entered then one is entered
  searchErrorMessageEl.innerHTML = "";

  // resets forecast cards for every new search
  forecastCardsListEl.innerHTML = "";
};

// Event Handelers
  //  search-form event handler 
var searchFormHandler = function (event) {
  event.preventDefault();
  // trims any empty spaces from the search field input and converts it to lowercase
  var citySearchTerm = searchInputEl.value.trim().toLowerCase();
  if (citySearchTerm) {
    getCityWeather(citySearchTerm);

    // error message if no city is entered
  } else {
    searchErrorMessageEl.textContent = "Please enter a city name";
  }
};

// search-history list-items event handler
var searchHistoryHandler = function (event) {
  event.preventDefault();
  var citySearchTerm = event.target.textContent;
  getCityWeather(citySearchTerm);
};

// Local Storage
// saves currentCity to search history
var saveCity = function () {
  // Adds current city to beginning of search history
  searchListArray.unshift(currentCity);

  // removes other instance of current city from search history, if applicable
  for (var i = 1; i < searchListArray.length; i++) {
    if (searchListArray[i] == currentCity) {
      searchListArray.splice(i, 1);
    }
  }

  /* removes instance 9 (index 8) from search history list, if it reaches it
  this keeps it at a maximum of 8 in length for memory purposes */
  if (searchListArray.length == 9) {
    searchListArray.splice(8, 1);
  }

  // converts the array of searchList into a string to save to localStorage
  var searchListString = JSON.stringify(searchListArray);
  // saves string of search history to localStorage

  window.localStorage.setItem("citySearchListLS", searchListString);

  // calls function to reload search history from localStorage on save
  loadSearchList();
};

/* ---------- loads search history from localStorage ---------- */
var loadSearchList = function (citySearchList) {
  // loads search history list from locaStorage, if there is one
  var loadedSearchList = window.localStorage.getItem("citySearchListLS");

  // checks to see if there is an existing search history list
  if (loadedSearchList) {
    // resets the search history element on first visit and refresh in order to rewrite it from localStorage
    searchHistoryEl.innerHTML = "";

    // parses the search list loaded from localStorage into an array instead of a string
    loadedSearchList = JSON.parse(loadedSearchList);

    // creates a list item for each city in search history and appends it to the search history list
    for (i = 0; i < loadedSearchList.length; i++) {
      var searchHistoryItemEl = document.createElement("li");
      searchHistoryItemEl.innerHTML = loadedSearchList[i];
      searchHistoryEl.appendChild(searchHistoryItemEl);
    }

    // saves the loaded search list to the global array `searchListArray` in order to use it in `saveCity` function
    searchListArray = loadedSearchList;
  }
};

// calls function to load search history from localStorage on first visit and refersh
loadSearchList();


//Fetches 
// gets weather info from all 3 APIs (chained) starting with "Current Weather Data"
var getCityWeather = function (citySearchTerm) {
  // calls function to reset some values refer to function
  resets();

  // sets Current Weather Data API URL according to openweathermap.org specs
  var apiUrl =
    // host + path + query
    currentWeatherApiPath +
    // city
    citySearchTerm +
    // parameter: uses Imperial (Fahrenheit) temp instead of Kelvin
    "&units=imperial" +
    // parameter: for API Key
    "&appid=" +
    openWeatherMapApiKey;

  // fetches API
  fetch(apiUrl)
    // returns the data in json readable format
    .then(function (response) {
      // If fetch request was successful (returns value in the 200s)
      if (response.ok) {
        //once successful, saves city search term to currentCity to it can be saved to search history
        currentCity = citySearchTerm;
        return response.json();
        // If fetch request was unsuccessful (returns value in the 400s)
      } else {
        searchErrorMessageEl.innerHTML = "Error!<br />City not found.";
      }
    })
    // calls function to write current weather from data
    .then(function (data) {
      // saves latitude and longitude of current-city to use it to fetch uv index data
      currentLat = data.coord.lat;
      currentLon = data.coord.lon;
      displayCurrentWeather(data);
    })
    // calls function to fetch new data for uv index
    .then(function () {
      getCityUvIndex(currentLat, currentLon);
    })
    // calls function to fetch new data for forecast weather
    .then(function () {
      getForecastWeather(citySearchTerm);
    })
    // calls function to save current city to search history list
    .then(function () {
      saveCity();
    })
    /* If fetch request was unsuccessful
    for a reason other than a value in the 400s,
    i.e. network errors, usually it's a value in the 500s */
    .catch(function (error) {
      // If there already is an error message, then keep it as is
      if (searchErrorMessageEl.innerHTML) {
        // otherwise, if there is no existing error message, then write the following
      } else {
        searchErrorMessageEl.innerHTML =
          "Network error!<br />Unable to connect to get weather data!<br />Please check internet connection.";
      }
    });
};

/* get weather info from "5 Day / 3 Hour Forecast" API  */
var getForecastWeather = function (citySearchTerm) {
  // sets Forecast API URL according to openweathermap.org specs
  var apiUrl =
    // host + path + query
    forecastApiPath +
    // city
    citySearchTerm +
    // parameter: uses Imperial (Fahrenheit) temp instead of Kelvin
    "&units=imperial" +
    // parameter for API Key
    "&appid=" +
    openWeatherMapApiKey;

  // fetches data
  fetch(apiUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      displayForecastWeather(data);
    });
};

/* get uv index value from "UV Index" API */
var getCityUvIndex = function (currentLat, currentLon) {
  // sets UV Index API URL according to openweathermap.org specs
  var apiUrl =
    // host + path
    uvIndexApiPath +
    // personal API key
    openWeatherMapApiKey +
    // search using latitude and longitude of currentCity (acquired from Forecast API)
    "&lat=" +
    currentLat +
    "&lon=" +
    currentLon;

  // fetches data
  fetch(apiUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      displayUvIndex(data);
    });
};


/* Data Analysis */
/* ---------- analyzes weather condition code to decide bg color of uv index ---------- */
var analyzeWeatherConditions = function (currentWeatherCondition) {
  // checks if the currentWeatherCondition is favorable
  for (var i = 0; i < favorableWeatherConditions.length; i++) {
    if (currentWeatherCondition == favorableWeatherConditions[i]) {
      currentUvIndexValueEl.style.backgroundColor = "green";
      currentUvIndexValueEl.style.color = "#ffffff";
    }
  }

  // checks if the currentWeatherCondition is moderate
  for (var i = 0; i < moderateWeatherConditions.length; i++) {
    if (currentWeatherCondition == moderateWeatherConditions[i]) {
      currentUvIndexValueEl.style.backgroundColor = "yellow";
      currentUvIndexValueEl.style.color = "#000000";
    }
  }

  // checks if the currentWeatherCondition is severe
  for (var i = 0; i < severeWeatherConditions.length; i++) {
    if (currentWeatherCondition == severeWeatherConditions[i]) {
      currentUvIndexValueEl.style.backgroundColor = "#dc3545"; //red color
      currentUvIndexValueEl.style.color = "#ffffff";
    }
  }
};

/* Display Weather */
/* write today's current data from fetch reponse to html */
var displayCurrentWeather = function (data) {
  
    currentCityName = data.name;

  // get current epoch date and converts it to web-design format
  var currentEpochDate = new Date();
  var currentDate = convertDate(currentEpochDate);

  // get weather values from fetched data 
  var currentIcon = data.weather[0].icon;
  var currentTemperature = data.main.temp;
  var currentHumidity = data.main.humidity;
  var currentWindSpeed = data.wind.speed;
  var currentWeatherCondition = data.weather[0].id;

  // call function to decide bg color of UV Index depending on currentWeatherCondition code
  analyzeWeatherConditions(currentWeatherCondition);

  // update city section with fetched data
  cityNameEl.innerHTML = currentCityName;
  currentDateEl.innerHTML = currentDate;
  currentIconEl.src = iconPath + currentIcon + ".png";
  currentTempEl.innerHTML = "Temperature: " + currentTemperature + " &#176;F";
  currentHumidityEl.innerHTML = "Humidity: " + currentHumidity + "%";
  currentWindSpeedEl.innerHTML = "Wind Speed: " + currentWindSpeed + " MPH";
};

// write uv index value from fetch reponse to html
var displayUvIndex = function (data) {
  // get UV Index from data
  var currentUvIndex = data.value;
  // write UV Index value to html (span) element
  currentUvIndexValueEl.innerHTML = currentUvIndex;
};

// write weather forecast data from fetch reponse to html
var displayForecastWeather = function (data) {
  /* `for` loop sets data for each of the forecast cards.
      i increases by 8 each loop because data is every 3 hours and we want every 24 hours
      i < 40 because 40 divided by 8 equals 5 (days)
      i starts at 7 to allow 24 hours from current time */
  for (var i = 7; i < 40; i += 8) {
    var forecastEpochDate = new Date(data.list[i].dt * 1000);
    var forecastIcon = data.list[i].weather[0].icon;
    var forecastTemperature = data.list[i].main.temp;
    var forecastHumidity = data.list[i].main.humidity;

    // create a new forecast card and its elements
    var forecastCardEl = document.createElement("li");

    // gets forecast date from epoch date
    var forecastDate = convertDate(forecastEpochDate);
    // creates forecast date element and writes value from above
    var forecastDateEl = document.createElement("h4");
    forecastDateEl.innerText = forecastDate;
    forecastCardEl.appendChild(forecastDateEl);

    var forecastWeatherIconEl = document.createElement("img");
    forecastWeatherIconEl.src = iconPath + forecastIcon + ".png";
    forecastCardEl.appendChild(forecastWeatherIconEl);

    var forecastTempEl = document.createElement("p");
    forecastTempEl.className = "forecast-temp";
    forecastTempEl.innerHTML = "Temp: " + forecastTemperature + " &#176;F";
    forecastCardEl.appendChild(forecastTempEl);

    var forecastHumidityEl = document.createElement("p");
    forecastHumidityEl.innerHTML = "Humidity: " + forecastHumidity + "%";
    forecastCardEl.appendChild(forecastHumidityEl);

    // appends forecast card to forecast cards list after having added all content
    forecastCardsListEl.appendChild(forecastCardEl);

    // displays right-column (which was set to `display: none` at first visit/refersh)
    rightColumnEl.style.display = "initial";
  }
};


//Event Listers
// event listener for search form
searchFormEl.addEventListener("submit", searchFormHandler);
// event listener for search history
searchHistoryEl.addEventListener("click", searchHistoryHandler);

