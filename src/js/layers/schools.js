var xhr = require("../lib/xhr");
var csv = require("../lib/csv");
var dot = require("../lib/dot");
var async = require("../lib/async");

var template = dot.compile(`
<h1><%= data.school %>, <%= data.district %></h1>
<table>
  <thead>
    <tr>
      <th>Building
      <th>Built
      <th>Type
      <th>Hazard
      <th>Mitigation
  <tbody>
    <% data.buildings.forEach(function(row) { %>
    <tr>
      <td><%= row.building %>
      <td><%= row.built %>
      <td><%= row.buildingType %>
      <td><%= row.hazard %>
      <td><%= row.mitigationType %>
    <% }); %>
`);

module.exports = {
  standalone: true,
  title: "Selected school buildings",
  short: "Schools",
  load(leaflet, map) {

    return new Promise(function(ok, fail) {
      async.map(["./assets/schools.csv", "./assets/school_coords.csv"], xhr, function(err, [schools, coords]) {

        schools = csv(schools).filter(r => r.district);
        coords = csv(coords);

        var gps = {};
        coords.forEach(function(r) {
          gps[r.key] = [r.lat, r.lng]
        });

        var grouped = {};
        schools.forEach(function(row) {
          var key = row.district.trim() + "|" + row.school.trim();
          if (!grouped[key]) grouped[key] = {
            coords: gps[key],
            buildings: [],
            district: row.district,
            school: row.school
          };
          grouped[key].buildings.push(row);
        });
        
        var layer = leaflet.layerGroup();
        for (var k in grouped) {
          if (!grouped[k].coords) {
            console.log(`No coordinates for ${k}`);
            continue;
          }
          var marker = leaflet.marker(grouped[k].coords, {
            icon: leaflet.divIcon({
              className: "school-marker"
            }),
          });
          marker.bindPopup(template(grouped[k]), { className: "school-popup", maxHeight: 300 });
          marker.addTo(layer);
        }

        ok(layer);
        //memoize this
        module.exports.load = () => Promise.resolve(layer);

      });
    });

  },
  viewbox: [[45.5948097, -124.387099], [48.5353, -120.29922]],
  key: `
School audit results from a random sampling of districts.
  `
}