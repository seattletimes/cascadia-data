var xhr = require("../lib/xhr");
var csv = require("../lib/csv");
var dot = require("../lib/dot");

module.exports = {
  standalone: false,
  title: "Selected school buildings",
  short: "Schools",
  load(leaflet, map) {

    return new Promise(function(ok, fail) {
      xhr("./assets/schools.csv", function(err, data) {
        var parsed = csv(data).filter(r => r.district);
        var grouped = {};
        parsed.forEach(function(row) {
          var key = row.district + "/" + row.school;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(row);
        });
        var layer = leaflet.layerGroup();
        ok(layer);

      });
    });

  }
}