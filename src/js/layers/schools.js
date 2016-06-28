var xhr = require("../lib/xhr");
var csv = require("../lib/csv");
var dot = require("../lib/dot");
var async = require("../lib/async");

var template = dot.compile(require("./_schoolPopup.html"));
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
          var group = grouped[k];
          
          var risks = {};
          var mitig = {};
          var years = group.buildings.map(b => b.built);
          group.newest = Math.max.apply(null, years);
          group.oldest = Math.min.apply(null, years);
          if (group.oldest === 0) {
            group.oldest = 1900;
          }
          group.buildings.forEach(function(b) {
            if (!risks[b.hazard]) risks[b.hazard] = 0;
            risks[b.hazard]++;
            
          });
          
          group.buildings.forEach(function(b) {

            if (b.Mitigation === "Yes") {
                        console.log("h");

              if (!mitig[b.Mitigation]) mitig[b.Mitigation] = 0;
              mitig[b.Mitigation]++;
            }
          });
          
          group.mitigation = mitig;
          group.moderateHazards = risks['Moderate'] + risks['Moderate to High'];
          group.highHazards = risks['High'] + risks['High to Very High'] + risks['Very High'];
          group.hazards = risks;
          console.log(risks['Low to Moderate']);
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