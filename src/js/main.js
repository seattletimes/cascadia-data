// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("./map");

/*
Break this into two bundles, one that loads ads/tracking and one that doesn't.

Layer definition:
- Standalone vs. layerable?
- View rectangle?
- load(leaflet) method returns a promise resolved with a layer/layerGroup
- show()? 

Other requirements
- Be able to load a given map layer from either the URL query string or an element data-attribute
- 
*/