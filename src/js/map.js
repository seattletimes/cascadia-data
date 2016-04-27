require("es6-promise/dist/es6-promise.min").polyfill();
require("component-leaflet-map");

var geolocation = require("./lib/geolocation");

var mapElement = document.querySelector("leaflet-map.cascadia");
var map = mapElement.map;
var leaflet = mapElement.leaflet;
var key = document.querySelector(".map-key");

var layers = {
  masonry: require("./layers/masonry")
};

var current = [];

var hereMarker = leaflet.marker([], {
  iconSize: [20, 20],
  icon: leaflet.divIcon({
    className: "you-are-here",
    html: "&curren;"
  })
});

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

document.querySelector(".location input.address").addEventListener("keydown", function(e) {
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
    current.forEach(layer => map.removeLayer(layer));
    key.innerHTML = "";
    current = [];
  }
  if (def.viewbox) {
    map.fitBounds(def.viewbox);
    if (def.limit) {
      map.setMaxBounds(def.viewbox);
    }
  } else {
    map.setMaxBounds(null);
  }
  if (def.zoom) {
    map.options.maxZoom = def.zoom.max;
    map.options.minZoom = def.zoom.min;
  }
  if (def.key) {
    key.innerHTML += `<div class="key-block ${layerName}">${def.key}</div>`;
  }
  def.load(leaflet, map).then(function(layer) {
    layer.addTo(map);
    current.push(layer);
  });
}

loadLayer("masonry");

map.on("click", e => console.log(e.latlng));