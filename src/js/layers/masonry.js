var xhr = require("../lib/xhr");
var csv = require("../lib/csv");
var dot = require("../lib/dot");
require("leaflet.markercluster");

var strings = {
  "No visible": "No evidence of retrofit",
  "Sub Alt": "Comprehensive retrofit",
  "Permit": "Some amount of retrofit",
  "Visible": "Surface evidence of retrofit",
  "C": "Commercial",
  "E": "Emergency service",
  "G": "Government",
  "H": "Historic",
  "I": "Industrial",
  "O": "Offices",
  "P": "Public assembly space",
  "R": "Residential",
  "S": "School",
  "V": "Vacant",
  "1": "1-10 people",
  "2": "11-100 people",
  "3": "100+ people"
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
  <li> <label>Retrofit level</label>: ${getString(data.retrofitLevel)}
  <li> <label>Building type</label>: ${types.join("/")}
  <li> <label>Occupancy range</label>: ${getString(data.occupantLoad)}
  <li> <label>Built</label>: ${data.year}
</ul>
      `, e.latlng, { className: "masonry-popup"});
    };

    return new Promise(function(ok, fail) {
      xhr("./assets/urm.csv", function(err, data) {
        var parsed = csv(data).filter(r => r.x);
        var group = new leaflet.MarkerClusterGroup({
          maxClusterRadius: 20,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 17,
          iconCreateFunction(cluster) {
            var count = cluster.getChildCount();
            var mix = cluster.getAllChildMarkers().reduce(function(total, marker) {
              return total + (marker.data.retrofitLevel == "No visible" ? 0 : 1);
            }, 0) / count;
            var mixClass = mix == 0 ? "unaltered" : 
              mix < .3 ? "mostly-unaltered" : 
              mix < .7 ? "even-mix" : 
              mix < 1 ? "mostly-altered" :
              "retrofitted";
            var clusterClass = count >= 50 ? "large" : count >= 10 ? "medium" : "small";
            var clusterSize = count >= 50 ? 60 : count >= 10 ? 30 : 20;
            return leaflet.divIcon({
              html: cluster.getChildCount(),
              className: `urm-cluster ${clusterClass} ${mixClass}`,
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
<h2>Unreinforced-masonry construction in Seattle</h2>
<ul>
  <li> <i class="no-visible dot"></i> No retrofit
  <li> <i class="visible dot"></i> Some amount of retrofit
</ul>
<div class="source">Source: Seattle Department of Construction and Inspections</div>
  `
};