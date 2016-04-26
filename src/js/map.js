require("es6-promise/dist/es6-promise.min").polyfill();
require("component-leaflet-map");

var mapElement = document.querySelector("leaflet-map.cascadia");
var map = mapElement.map;
var leaflet = mapElement.leaflet;

var layers = {
  masonry: require("./layers/masonry")
};

var current = [];

var hereMarker = leaflet.marker([], {
  icon: leaflet.divIcon({
    className: "leaflet-div-icon you-are-here"
  })
});

var youAreHere = function(latLng) {
  hereMarker.setLatLng(latLng);
  hereMarker.addTo(map);
  map.setView(latLng, 14);
};

document.querySelector("button.gps").addEventListener("click", function(e) {
  e.preventDefault();
  navigator.geolocation.getCurrentPosition(function(gps) {
    youAreHere([gps.coords.latitude, gps.coords.longitude]);
  }, err => console.log(err));
});

var locateAddress = require("./address");

document.querySelector(".location input.address").addEventListener("keydown", function(e) {
  if (e.keyCode == 13) { //on return
    var address = this.value;
    locateAddress(this.value, function(err, coords) {
      if (err) return console.log(err);
      youAreHere(coords);
    })
  }
})

var loadLayer = function(layerName) {
  if (!(layerName in layers)) {
    throw `No layer definition found for ${layerName}`;
  }
  var def = layers[layerName];
  if (def.standalone) {
    current.forEach(layer => map.removeLayer(layer));
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
  def.load(leaflet, map).then(function(layer) {
    layer.addTo(map);
    current.push(layer);
  });
}

loadLayer("masonry");

map.on("click", e => console.log(e.latlng));