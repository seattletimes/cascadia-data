require("es6-promise/dist/es6-promise.min").polyfill();
require("component-leaflet-map");

var geolocation = require("./lib/geolocation");

var mapElement = document.querySelector("leaflet-map.cascadia");
var map = mapElement.map;
var leaflet = mapElement.leaflet;
var key = document.querySelector(".map-key");

var layers = {
  masonry: require("./layers/masonry"),
  schools: require("./layers/schools")
};

var current = [];

var hereMarker = leaflet.marker([], {
  icon: leaflet.divIcon({
    iconSize: [24, 24],
    className: "you-are-here",
    html: `<img src="./assets/icons/pin.svg">`
  })
});

var queryString = window.location.search.replace(/^\?/, "")
  .split("&").map(p => p.split("="))
  .reduce(function(mapping, [key, value]) {
    if (key) mapping[key] = value;
    return mapping;
  }, {});

var youAreHere = function(latlng) {
  hereMarker.setLatLng(latlng);
  hereMarker.addTo(map);
  map.setView(latlng, 14);
  map.openPopup("You are here.", latlng);
};

document.querySelector("button.gps").addEventListener("click", function(e) {
  e.preventDefault();
  geolocation.gps(function(err, coords) {
    if (err) return console.log(err);
    youAreHere(coords);
  });
});

document.querySelector(".location-bar input.address").addEventListener("keydown", function(e) {
  if (e.keyCode == 13) { //on return
    var address = this.value;
    geolocation.address(this.value, function(err, coords) {
      if (err) return console.log(err);
      youAreHere(coords);
    })
  }
});

var loadLayer = function(layerName) {
  if (!(layerName in layers)) {
    throw `No layer definition found for ${layerName}`;
  }
  var def = layers[layerName];
  if (def.standalone) {
    current.forEach(d => map.removeLayer(d.layer));
    key.innerHTML = "";
    current = [];
  }
  if (def.zoom) {
    map.options.maxZoom = def.zoom.max;
    map.options.minZoom = def.zoom.min;
  } else {
    map.options.maxZoom = 14;
    map.options.minZoom = 1;
  }
  if (def.viewbox) {
    if (def.limit) {
      map.setMaxBounds(def.viewbox);
    } else {
      map.setMaxBounds(null);
    }
    map.fitBounds(def.viewbox);
  } else {
    map.setMaxBounds(null);
  }
  if (def.key) {
    key.innerHTML += `<div class="key-block ${layerName}">${def.key}</div>`;
  }
  if (current.indexOf(def) == -1) {
    def.load(leaflet, map).then(function(layer) {
      def.layer = layer;
      layer.addTo(map);
      current.push(def);
    });
  }
}

loadLayer(queryString.layer || document.body.getAttribute("data-layer"));
if (!document.body.classList.contains("standalone")) map.scrollWheelZoom.disable();

map.on("click", e => console.log(e.latlng));

var layerMenu = document.querySelector(".layer-menu");

document.querySelector(".layer-button").addEventListener("click", function() {
  layerMenu.innerHTML = Object.keys(layers).map(function(l) {
    var def = layers[l];
    var isShown = current.indexOf(def) > -1;
    return `<li data-layer="${l}" class="${isShown ? "current" : ""}">${layers[l].short}</li>`;
  }).join("");
  layerMenu.classList.add("show");
});

layerMenu.addEventListener("click", function(e) {
  var target = e.target;
  var layer = target.getAttribute("data-layer");
  loadLayer(layer);
  layerMenu.classList.remove("show");
  layerMenu.innerHTML = "";
  e.stopImmediatePropagation();
})