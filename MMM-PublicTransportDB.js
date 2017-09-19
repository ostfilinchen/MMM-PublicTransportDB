/* global Module */

/* Magic Mirror
 * Module: MMM-PublicTransportDB
 *
 * By ostfilinchen
 *
 * Modified from WeatherForecast by Michael Teeuw 
 * MIT Licensed.
 */

Module.register("MMM-PublicTransportDB",{

	// Default module config.
	defaults: {
		//location: "",
		appid: "",
		units: config.units,
		maxNumberOfDays: 7,
		updateInterval: 15 * 60 * 1000, // every 15 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		lang: config.language,
		fade: true,
		degreeSym: true,
		pop: false,
		iconSet: "k",
		fadePoint: 0.25, // Start on 1/4th of the list.
        StartLocation: "Landesämter Kamenz",
        StopLocation: "Hauptbahnhof Dresden",
        TimeTillStartLocation: 5,
        Transportation: 1023 //1023 alle, 1022 ohne ICE, 1016 Regio
        

		initialLoadDelay: 2500, // 2.5 seconds delay. This delay is used to keep the wunderground API happy.
		retryDelay: 2500,

		apiBase: "http://reiseauskunft.bahn.de/bin/query.exe/?cb=done&encoding=utf-8&nrCons=3",
		uriEndpoint: "&widget=1&start=1",
        Start: "&S=" + this.config.StartLocation,
        Stop: "&Z=" + this.config.StopLocation,
        Product: "&journeyProducts=" + this.config.Transportation,
        TimeToDeparture: "&wTime=" + this.config.TimeTillStartLocation
        url: apiBase + Start + Stop + Product + TimeToDeparture + uriEndPoint



	},

	// Define required scripts.
	//getScripts: function() {
	//	return ["moment.js"];
	//},

	// Define required scripts.
	getStyles: function() {
		return ["MMM-PublicTransportDB.css"];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(this.config.lang);

		this.departures = [];
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);
		this.iconText = null;

		this.updateTimer = null;
		this.degSymbol = null;

	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		//if (this.config.appid === "") {
		//	wrapper.innerHTML = "Please set the correct wunderground <i>appid</i> in the config for module: " + this.name + ".";
	   //     wrapper.className = "dimmed light small";
		//	return wrapper;
		//}

		if (this.config.StartLocation === "") {
			wrapper.innerHTML = "Please set the StartLocation <i>location</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
        
        if (this.config.StopLocation === "") {
			wrapper.innerHTML = "Please set the StopLocation <i>location</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.className = "small";

		for (var f in this.departures) {
			var departures = this.departures[f];

			var row = document.createElement("tr");
			table.classname = "row";
			table.appendChild(row);

			var arrivalCell = document.createElement("td");
			//dayCell.className = "day";
			arrivalCell.innerHTML = departures.arrival;
			row.appendChild(arrivalCell);
/*
                        var popCell = document.createElement("td");
			popCell.className = "align-right pop";
                        if (forecast.pop > 0 && this.config.pop) {
                                popCell.innerHTML = "  <sup>" + forecast.pop + "%</sup>";
                        }
                        row.appendChild(popCell);

			var iconCell = document.createElement("td");
			iconCell.className = "align-center bright weather-icon";
			row.appendChild(iconCell);

			var icon = document.createElement("span");
			icon.className = forecast.icon;
			iconCell.appendChild(icon);

			// Set the degree symbol if desired
			if (this.config.degreeSym) {
				degSymbol = "&deg;";
			}

			var maxTempCell = document.createElement("td");
			if (this.config.units === "imperial") {
				maxTempCell.innerHTML = forecast.maxTemp + degSymbol;
			} else if (this.config.units === "metric") {
				maxTempCell.innerHTML = forecast.maxTempC + degSymbol;
			} else {
				maxTempCell.innerHTML = forecast.maxTempC + 273 + degSymbol;
			}
			maxTempCell.className = "align-right bright max-temp";
			row.appendChild(maxTempCell);

			var minTempCell = document.createElement("td");
                        if (this.config.units === "imperial") {
                                minTempCell.innerHTML = forecast.minTemp + degSymbol;
                        } else if (this.config.units === "metric") {
                                minTempCell.innerHTML = forecast.minTempC  + degSymbol;
                        } else {
                                minTempCell.innerHTML = forecast.minTempC + 273 + degSymbol;
                        }
			minTempCell.className = "align-right min-temp";
			row.appendChild(minTempCell);

			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = this.forecast.length * this.config.fadePoint;
				var steps = this.forecast.length - startingPoint;
				if (f >= startingPoint) {
					var currentStep = f - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
*/
		}

		return table;
	},

	/* updateTransport(compliments)
	 * Requests new data from wunderground.com.
	 * Calls processTransport on succesfull response.
	 */
	updateTransport: function() {
		var url = this.config.apiBase + this.config.Start + this.config.Stop + this.config.Product + this.config.TimeToDeparture + this.config.uriEndPoint;
		var self = this;

		var retry = true;

		var transportRequest = new XMLHttpRequest();
		transportRequest.open("GET", url, true);
		transportRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					try {
						var parsed = JSON.parse(this.response);
					}catch(e){
						console.log("MMM-PublicTransportDB - JSON error: " + e.name);
						self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
						return;
						// here to prevent freezin of app on unfinished JSON.
					}
					self.processTransport(parsed);
				} else if (this.status === 401) {
					self.config.appid = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect APPID.");
					retry = false;
				} else {
					Log.error(self.name + ": Could not load Transportation.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		transportRequest.send();
	},

	/* processTransport(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form wunderground.
	 */
	processTransport: function(data) {

		this.departures = [];
		for (var i = 0, count = data.fl.length; i < count; i++) {
			
			var departures = data.fl.an[i];
			this.departures.push({

				//day: moment(forecast.date.epoch, "X").format("ddd"),
				//icon: forecast.icon_url,
                //icon: this.config.iconTable[forecast.icon],
				arrival: departures.an,
				departure: departures.ab,
				travel_time: departures.d,
				arrival_delay: departures.anpm,
				journey_changes: departures.u,
                transport: departures.pl

			});
		}

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.updateTransport();
		}, nextLoad);
	},

	/* function(temperature)
	 * Rounds a temperature a whole number.
	 *
	 * argument temperature number - Temperature.
	 *
	 * return number - Rounded Temperature.
	 */
	roundValue: function(temperature) {
		return Math.round(temperature);
	}
});
