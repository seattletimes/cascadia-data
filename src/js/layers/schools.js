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
            if (b.mitigationType !== "") {
              if (!mitig[b.mitigationType]) mitig[b.mitigationType] = 0;
              mitig[b.mitigationType]++;
            }
        })
          
          var getRisk = r => risks[r] || 0;
          group.mitigation = mitig;
          group.moderateHazards = getRisk('Moderate') + getRisk('Moderate to High');
          group.highHazards = getRisk('High') + getRisk('High to Very High') + getRisk('Very High');
          group.hazards = group.moderateHazards + group.highHazards + getRisk('Low') + getRisk('Low to Moderate');

          if (!grouped[k].coords) {
            console.log(`No coordinates for ${k}`);
            continue;
          }
          
          //if school's risk is 30% or 50%
          var modRisk = (group.moderateHazards / group.hazards );
          var highRisk = (group.highHazards / group.hazards );


          function riskColor() {
            
               if (highRisk > .2) {
              return "high-risk";
            }
          else if (modRisk > .3) {
             return "medium-risk";

            }
          else {
           return "school-marker";

            }
            return "school-marker";
          };
         
          var marker = leaflet.marker(grouped[k].coords, {
            icon: leaflet.divIcon({
              className: riskColor()
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