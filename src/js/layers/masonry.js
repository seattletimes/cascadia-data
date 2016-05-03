var xhr = require("../lib/xhr");
var csv = require("../lib/csv");
var dot = require("../lib/dot");
require("leaflet.markercluster");

var strings = {
  "No visible": "No visible alterations",
  "Sub Alt": "Substantial alterations made",
  "C": "Commercial",
  "E": "Emergency service",
  "G": "Government",
  "H": "Historic",
  "I": "Industrial",
  "O": "Offices",
  "P": "Public assembly space",
  "R": "Residential",
  "S": "School",
  "V": "Vacant"
};

var getString = function(s) {
  return strings[s] || s;
};

module.exports = {
  standalone: false,
  title: "Unreinforced masonry buildings in Seattle",
  short: "Unreinforced masonry",
  load(leaflet, map) {

    var clusterClick = function(e) {
      map.setZoomAround(e.latlng, map.getZoom() + 1);
    };

    var markerClick = function(e) {
      var data = e.layer.data;
      if (!data) return;
      var types = data.occupancyType.split("/").map(getString);
      map.openPopup(`
<h3>${data.address}</h3>
<ul>
  <li> Built: ${data.year}
  <li> Building type: ${types.join("/")}
  <li> Retrofit level: ${data.retrofitLevel}
</ul>
      `, e.latlng);
    };

    return new Promise(function(ok, fail) {
      xhr("./assets/urm.csv", function(err, data) {
        var parsed = csv(data).filter(r => r.x);
        var group = new leaflet.MarkerClusterGroup({
          maxClusterRadius: 40,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 17,
          iconCreateFunction(cluster) {
            var count = cluster.getChildCount();
            var clusterClass = count >= 100 ? "large" : count >= 10 ? "medium" : "small";
            var clusterSize = count >= 100 ? 60 : count >= 10 ? 40 : 30;
            return leaflet.divIcon({
              html: cluster.getChildCount(),
              className: "urm-cluster " + clusterClass,
              iconSize: [clusterSize, clusterSize]
            });
          }
        });
        var markers = parsed.map(function(building) {
          var retroClass = building.retrofitLevel.replace(/\s+/g, "-").toLowerCase();
          var marker = new leaflet.Marker([building.y, building.x], {
            icon: leaflet.divIcon({
              className: "urm-building " + retroClass
            })
          });
          marker.data = building;
          return marker;
        });
        group.addLayers(markers, { chunkedLoading: true });
        group.on("clusterclick", clusterClick);
        group.on("click", markerClick);
        ok(group);
      });
    });
  },
  init: function() {},
  viewbox: [[47.71438, -122.43988],[47.50793, -122.2174]],
  limit: true,
  zoom: { min: 10 },
  key: `
<h2>Unreinforced Masonry construction in Seattle</h2>
<ul>
  <li> <i class="no-visible dot"></i> No visible alteration
  <li> <i class="visible dot"></i> Visible alterations
  <li> <i class="permit dot"></i> Permit granted
  <li> <i class="sub-alt dot"></i> Substantial alteration
</ul>
  `
};