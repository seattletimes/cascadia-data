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
            if (b.mitigation === "Yes") {
              if (!mitig[b.mitigation])
                mitig[b.mitigation] = 0;
              mitig[b.mitigation]++;
            }
        })
          
          //Calculates how many buildings within a particular school have a risk of X or mitigation. 
          var getRisk = r => risks[r] || 0;
          var getMitig = m => mitig[m] || 0;

          group.mitigation = getMitig("Yes");
          group.moderateHazards = getRisk('Moderate') + getRisk('Moderate to High');
          group.highHazards = getRisk('High') + getRisk('High to Very High') + getRisk('Very High');
          group.hazards = group.moderateHazards + group.highHazards + getRisk('Low') + getRisk('Low to Moderate') + getRisk('Missing Data');

          if (!grouped[k].coords) {
            console.log(`No coordinates for ${k}`);
            continue;
          }
          
          //Percentage of buildings with moderate/high risk
          var modRisk = (group.moderateHazards / group.hazards );
          var highRisk = (group.highHazards / group.hazards );
          
          //Assigns a color to each school based on risk
          function riskColor() {
            if (highRisk > .25) {
              return "high";
            }
            else if (modRisk > .3) {
              return "medium";
            }
        };          
          
          //Assigns a color to each school based on risk
          function isMitigated() {
            if (group.mitigation > 0) {
              return "mitigated";
            }
            else {
              return "";
            }
        };
         console.log(isMitigated());
          var marker = leaflet.marker(grouped[k].coords, {
            icon: leaflet.divIcon({
              className: "school-marker " + riskColor() + " " + isMitigated()
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
      <h2>Earthquake Preparedness in Washington</h2>
      <ul class="top-key">
        <li>
          <i class="school-marker shape square"></i> Completed seismic upgrade</li>
        <li>
          <i class="school-marker shape"></i> No seismic upgrade</li>
      </ul>
      <ul>
        <li> <i class="school-marker high"></i> Very high to high damage likely for > 25% of buildings
        <li> <i class="school-marker medium"></i> Moderate damage likely for > 30% of buildings
        <li> <i class="school-marker"></i> 
            Low to moderate risk of damage
      </ul>
<p class="chatter">Earthquake risk includes building type, potential for ground shaking, and soil type. Some schools have mitigated their risk of damage with facility upgrades.</p>
<div class="source">Source: <a href="http://www.k12.wa.us/">OSPI</a></div> `
}