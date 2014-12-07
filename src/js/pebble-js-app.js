/**
 * PebCiti
 *
 * Phone app conterpart for a Pebble app PebCiti, which fetches
 * the bike locations data and sends them to the watch.
 *
 * @authors		Tomas Vitek
 * @link        http://tomasvitek.com
 */

/**
 * Phone app settings HTML page URL
 *
 * TODO: Change to a production URL
 *
 * @type string
 */
var SETTINGS_URL = 'http://pebciti.tomasvitek.com/preferences/';

/**
 * Citi bikes API url
 * @type string
 */
var DOCKS_API_URL_NY = 'http://citibikenyc.com/stations/json';
var DOCKS_API_URL_LONDON = 'http://api.bike-stats.co.uk/service/rest/bikestats?format=json';

/**
 * PositionOptions configuration for HTML5 geolocation
 * (see http://dev.w3.org/geo/api/spec-source.html#position_options_interface)
 */
var locationOptions = {
    "enableHighAccuracy": false,
    "timeout": 15000, // 15s
    "maximumAge": 30000 // half a minute
};

/**
 * Found location
 */
var locationCache = null;

/**
 * Location watch
 */
var watchId = null;

/**
 * Fetches directions from Citi API, sends data to Pebble.
 */
function fetchStations(location) {
	locationCache = location;

	var loc = localStorage.getItem("loc") || ((location.longitude > -30) ? 'london' : 'ny');

	var url = DOCKS_API_URL_NY;
	if (loc == 'london') {
		url = DOCKS_API_URL_LONDON;
	}

	console.log('Opening API: ' + url);

	var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onload = function (e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
				var response = JSON.parse(req.responseText);
				if (loc == 'ny') {
					processNY(response, location);
				}
				else {
					processLondon(response, location);
				}
            }
            // Server didn't respond with 200
            else {
                console.error('Error: The response from server is wrongly formatted.');
				// TODO: send message to Pebble and diplay error
            }
        }
    };
    req.send(null);
	navigator.geolocation.clearWatch(watchId);
}

/**
 * Processes response from the dock API
 * for NY
 *
 * @param obj response
 */
function processNY(response, location) {
	var focus = localStorage.getItem("focus") || 'bike';
    var vibrate = localStorage.getItem("vibrate") || true;
	var unit = localStorage.getItem("unit") || 'mi';

	// Wrong format of the reponse, send over the error
	if (!response ||
		!response.hasOwnProperty('executionTime') ||
		response.stationBeanList.length === 0) {
		console.error('Error: The response from server is wrongly formatted.');
		// TODO: Send a message to Pebble and diplay error message
		return;
	}

	var distanceToClosestSt = Number.MAX_VALUE;
	var closestStation = null;

	response.stationBeanList.forEach(function (station) {
		if (station.testStation === false &&
			station.statusKey !== 1) {
			return;
		}

		if (station.availableBikes === 0 && focus == 'bike') {
			return;
		}

		if (station.availableDocks === 0 && focus == 'dock') {
			return;
		}

		var loc = {
			latitude: station.latitude,
			longitude: station.longitude
		};
		var dist = getDistance(location, loc);

		if (closestStation === null) {
			distanceToClosestSt = dist;
			closestStation = station;
		}
		else if (dist < distanceToClosestSt) {
			distanceToClosestSt = dist;
			closestStation = station;
		}
	});

	var distance = _round(distanceToClosestSt, 2) + ' km';
	if (unit == 'mi') {
		distance = _round(_km2miles(distanceToClosestSt), 2) + ' mi';
	}

	var focusIsBike = 1;
	if (focus == 'dock') {
		focusIsBike = 0;
	}

	console.log('Closest station ' + closestStation.stationName);
	Pebble.sendAppMessage({
		"focusIsBike": focusIsBike,
		"stationKey": closestStation.stationName,
		"vibrateKey": (vibrate ? 1 : 0),
		"distance": distance
	});
}

/**
 * Processes response from the dock API
 * for London
 *
 * @param obj response
 */
function processLondon(response, location) {
	var focus = localStorage.getItem("focus") || 'bike';
    var vibrate = localStorage.getItem("vibrate") || true;
	var unit = localStorage.getItem("unit") || 'mi';

	// Wrong format of the reponse, send over the error
	if (!response ||
		!response.hasOwnProperty('updatedOn') ||
		response.dockStation.length === 0) {
		console.error('Error: The response from server is wrongly formatted.');
		// TODO: Send a message to Pebble and diplay error message
		return;
	}

	var distanceToClosestSt = Number.MAX_VALUE;
	var closestStation = null;

	response.dockStation.forEach(function (station) {
		if (station.installed === "false" &&
			station.statusKey !== "true") {
			return;
		}

		if (station.bikesAvailable === 0 && focus == 'bike') {
			return;
		}

		if (station.emptySlots === 0 && focus == 'dock') {
			return;
		}

		var loc = {
			latitude: station.latitude,
			longitude: station.longitude
		};
		var dist = getDistance(location, loc);

		if (closestStation === null) {
			distanceToClosestSt = dist;
			closestStation = station;
		}
		else if (dist < distanceToClosestSt) {
			distanceToClosestSt = dist;
			closestStation = station;
		}
	});

	var distance = _round(distanceToClosestSt, 2) + ' km';
	if (unit == 'mi') {
		distance = _round(_km2miles(distanceToClosestSt), 2) + ' mi';
	}

	var focusIsBike = 1;
	if (focus == 'dock') {
		focusIsBike = 0;
	}

	console.log('Closest station ' + closestStation.name);
	Pebble.sendAppMessage({
		"focusIsBike": focusIsBike,
		"stationKey": closestStation.name,
		"vibrateKey": (vibrate ? 1 : 0),
		"distance": distance
	});
}

/**
 * Compute distance of two {lon, lat} points
 * on a sphere
 *
 * @return int distance in km
 */
function getDistance(pointA, pointB) {
  var R = 6371; // Radius of the earth in km
  var dLat = _deg2rad(pointB.latitude-pointA.latitude);  // deg2rad below
  var dLon = _deg2rad(pointB.longitude-pointA.longitude);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(_deg2rad(pointA.latitude)) * Math.cos(_deg2rad(pointB.latitude)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

/**
 * Utility function to convert degrees to radians
 *
 * @param  int angle in degrees
 * @return int angle in radians
 */
function _deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Utility function to round a number
 * to given decimals
 *
 * @param  float num
 * @param  int decimals
 * @return float
 */
function _round(num, decimals) {
    return +(Math.round(num*Math.pow(10,decimals)) / Math.pow(10,decimals));
}

/**
 * Utility function to convert km to miles
 *
 * @param  int km
 * @return int miles
 */
function _km2miles(km) {
	return km * 0.621371192;
}

/**
 * Called when location has been found, triggers API call to fetch directions.
 *
 * @param pos
 */
function locationSuccess(pos) {
    var coordinates = pos.coords;
	fetchStations(coordinates);
}

/**
 * Called when location search has failed. Sends over a "-2" duration as an error.
 *
 * @param err
 */
function locationError(err) {
    console.log('Error: The phone app couldn\'t get a location update.');
	// TODO: Send a message to Pebble and display error
}

/**
 * Opens HTML page with settings with data from local storage.
 * (HTML source code for the settings page is )
 */
Pebble.addEventListener("showConfiguration", function () {
	var focus = localStorage.getItem("focus") || 'bike';
    var vibrate = localStorage.getItem("vibrate") || true;
	var unit = localStorage.getItem("unit") || 'mi';
    var loc = localStorage.getItem("loc") || ((locationCache.longitude > -30) ? 'london' : 'ny');

    var url = SETTINGS_URL + '?focus=' + encodeURIComponent(focus) +
							'&vibrate=' + encodeURIComponent(vibrate) +
							'&unit=' + encodeURIComponent(unit) +
							'&loc=' + encodeURIComponent(loc);

    console.log('Showing configuration at ' + url);
    Pebble.openURL(url);
});

/**
 * Called when settings page is closed, parses data inserted and
 * stores them in local storage.
 */
Pebble.addEventListener("webviewclosed", function (e) {
    var options = JSON.parse(decodeURIComponent(e.response));
    console.log("Configuration closed. Returned options = " + JSON.stringify(options));

    localStorage.setItem("focus", options.focus);
    localStorage.setItem("vibrate", options.vibrate);
    localStorage.setItem("unit", options.unit);
	localStorage.setItem("loc", options.loc);

	if (watchId) {
		navigator.geolocation.clearWatch(watchId);
	}
    watchId = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
});

/**
 * Received message from Pebble
 */
Pebble.addEventListener("appmessage", function (e) {
    console.log("Received message: " + e.payload);

	var focus = 'bike';
	if (e.payload.focusIsBike === 0) {
		focus = 'dock';
	}

	localStorage.setItem("focus", focus);

	Pebble.sendAppMessage({
		"focusIsBike": e.payload.focusIsBike,
		"stationKey": "Wating for phone app...",
		"vibrateKey": 0,
		"distance": ""
	});

	if (watchId) {
		navigator.geolocation.clearWatch(watchId);
	}
    watchId = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
});

/**
 * Start application
 */
Pebble.addEventListener("ready", function (e) {
    console.log("JS app has been started!");

	if (watchId) {
		navigator.geolocation.clearWatch(watchId);
	}
    watchId = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
});
