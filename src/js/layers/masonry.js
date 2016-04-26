var xhr = require("../lib/xhr");
var csv = require("../lib/csv");
var dot = require("../lib/dot");
require("leaflet.markercluster");


module.exports = {
  standalone: false,
  title: "Unreinforced masonry buildings in Seattle",
  short: "Unreinforced masonry",
  load(leaflet, map) {

    var clusterClick = function(e) {
      console.log(e, arguments.length);
    };

    var markerClick = function(e) {
      var data = e.layer.data;
      if (!data) return;
      map.openPopup(`
<h3>${data.address}</h3>
Retrofit level: ${data.retrofitLevel}`, e.latlng)
    };

    return new Promise(function(ok, fail) {
      xhr("./assets/urm.csv", function(err, data) {
        var parsed = csv(data).filter(r => r.x);
        var group = new leaflet.MarkerClusterGroup({
          maxClusterRadius: 40,
          showCoverageOnHover: false,
          disableClusteringAtZoom: 15,
          iconCreateFunction(cluster) {
            return leaflet.divIcon({
              html: cluster.getChildCount(),
              className: "leaflet-div-icon urm-cluster",
              iconSize: [30, 30]
            });
          }
        });
        var markers = parsed.map(function(building) {
          var marker = new leaflet.Marker([building.y, building.x], {
            icon: leaflet.divIcon({
              className: "leaflet-div-icon urm-building"
            })
          });
          marker.data = building;
          return marker;
        });
        group.addLayers(markers);
        group.on("clusterclick", clusterClick);
        group.on("click", markerClick);
        ok(group);
      });
    });
  },
  init: function() {},
  viewbox: [[47.740709, -122.24556],[47.49494, -122.414474]],
  limit: true
};