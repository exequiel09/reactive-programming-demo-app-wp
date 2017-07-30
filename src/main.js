import { Observable } from 'rxjs/Observable';
import L from './leaflet-map';

// rxjs observable monkey-patch
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/switchMap';

// stylesheets
import 'normalize.css';
import 'leaflet/dist/leaflet.css';
import './main.css';

const http = {
    request: function(url, options) {
        const opts = Object.assign({}, options, {
            url
        });

        return Observable.ajax(opts);
    }
}

const map = L.map('main-map', {});

// will be used to store the instance of the newly created marker
let marker = null;

// create a base layer and add it to the map
const baseLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: `Map data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors,
        &copy; <a href="http://cartodb.com/attributions" target="_blank">CartoDB</a>`
}).addTo(map);

// set the center and zoom level of the map
map.setView([13, 122], 6);

// listen to the click events on the map
const mapClickStream$ = Observable.fromEvent(map, 'click');

// [Marble Diagram] ::start
//
// Click Stream     : -----------------c-------c---------c-----------------c-----------------c-----------------c------------------
// Pluck            : --------------ltln----ltln------ltln--------------ltln--------------ltln--------------ltln------------------
// Switch Map       : ---------------req-----req
//                                              -------req-----------------X---------------req---------------req------------------
// Map (obj - in)   :                 t1----------------t1----------------------------------t1----------------t1------------------
// Map (html - in)  :                 t2----------------t2----------------------------------t2----------------t2------------------
// Catch (in)       :                 -------------------------------------N------------------------------------------------------
// Render (sub)     : -----------------r-----------------r-----------------r-----------------r-----------------r------------------
//
// [Marble Diagram] ::end

mapClickStream$
    // add the marker to the map (SIDE EFFECT)
    .do(evt => {
        const mapInstance = evt.target;

        // remove the old marker and its popup before creating a new one
        if (marker !== null) {
            marker.unbindPopup();
            marker.removeFrom(mapInstance);
            marker = null;
        }

        // create new marker and add it to the map where it is clicked
        marker = L.marker(evt.latlng).addTo(map);

        // show add default marker content indicating status
        marker.bindPopup("<span>Loading data... Please wait..</span>").openPopup();
    })

    // extract `latlng` property from the event object
    .pluck('latlng')

    // perform ajax requests to the APIs and automatically unsubscribe to the previous request when another click is performed
    .switchMap(({lat, lng}) => retrieveAndCompile(lat, lng))

    // set the marker content
    .subscribe(template => marker.setPopupContent(template))
    ;

function retrieveAndCompile(lat, lng) {
    const address$          = getAddress(lat, lng).pluck('response');
    const sunriseAndSunset$ = getSunriseSunset(lat, lng).pluck('response');

    // apply the source observables to the forkJoin operator to get the the latest values
    // combineLatest can also be used here. The difference? the answer can be found here
    // <https://stackoverflow.com/questions/41797439/rxjs-observable-combinelatest-vs-observable-forkjoin#answer-41797505>
    const combined$ = Observable.forkJoin(address$, sunriseAndSunset$)
        // transform the data to acceptable format
        .map(([geocoding, sunriseAndSunset]) => {
            // cast the sunset and sunrise values to a date object instance
            if (
                sunriseAndSunset.status.toLowerCase() === 'ok' &&
                typeof sunriseAndSunset.results.sunrise !== 'undefined' &&
                typeof sunriseAndSunset.results.sunset !== 'undefined'
            ) {
                sunriseAndSunset.results = Object.assign({}, sunriseAndSunset.results, {
                    sunrise: new Date(sunriseAndSunset.results.sunrise),
                    sunset: new Date(sunriseAndSunset.results.sunset),
                })
            }

            // return the new data structure
            return {
                geocoding,
                sunriseAndSunset
            };
        })

        // compile the template
        .map(data => compileTemplate(data))

        // catch the error that will happen along the observable chain
        .catch(() => Observable.of("We have experienced some issues please try again later."))
        ;

    // return the combined observable
    return combined$;
}

function getAddress(lat, lng) {
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAi4LDku4WJGIC2f7xQJuRixTrwB3QL0yQ`;

    return http.request(endpoint, {
        method: 'GET',
        crossDomain: true,
        headers: {
            'Accept': 'application/json'
        }
    });
}

function getSunriseSunset(lat, lng) {
    const endpoint = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`;

    return http.request(endpoint, {
        method: 'GET',
        crossDomain: true,
        headers: {
            'Accept': 'application/json'
        }
    });
}

function compileTemplate(data) {
    let template =  `<dl>`;

    // assemble the template based on the data
    if (data.geocoding.results.length > 0) {
        template += `
            <dt>Address</dt>
            <dd>${data.geocoding.results[0].formatted_address}</dd>
        `;
    } else {
        template += `
            <dt>Address</dt>
            <dd>N/A</dd>
        `;
    }

    if (data.sunriseAndSunset.status === 'OK') {
        template += `
            <dt>Today's Sunrise</dt>
            <dd>${data.sunriseAndSunset.results.sunrise}</dd>
        `;

        template += `
            <dt>Today's Sunset</dt>
            <dd>${data.sunriseAndSunset.results.sunset}</dd>
        `;
    } else {
        template += `
            <dt>Today's Sunrise</dt>
            <dd>N/A</dd>
        `;

        template += `
            <dt>Today's Sunset</dt>
            <dd>N/A</dd>
        `;
    }

    template += '</dl>';

    return template;
}


