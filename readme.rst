Cascadia data
=============

In addition to its purpose as a landing page and link post, this page also hosts a standard map that lets readers mix-and-match data about the Cascadia faults for their own purposes. To accomodate this, all map layer loading is asynchronous, and must be accomplished through a layer definition (these are located in src/js/layers).

Layer definition
----------------

The layer definition is a straightforward JavaScript object, containing the fields detailed below:

* ``standalone`` : boolean, expresses whether this layer can be mixed with other layers
* ``title``
* ``short`` : a short title, for use in layer selection menus
* ``load(leaflet, map)`` : function returning a Promise, resolved with the layer object.
* ``viewbox`` : a pair of lat/long arrays. If present, the map will zoom to fit these bounds when the layer is loaded.
* ``limit`` : boolean, expressing whether the map should be limited only to the viewbox during pan/zoom operations
* ``zoom`` : an object with optional min/max properties, used to set the relevant options on the map when this layer is loaded.
* ``key`` : a string (presumably a template) containing HTML for the map's key.

Lifecycle
---------

Layers should wait to perform any bandwidth/CPU-intensive operations until the ``load()`` function is called. That function returns a promise, and should resolve that promise with the layer object, but should not otherwise manipulate the map in any way (the ``map`` object is provided for use in event listeners and other interactive code).

All other side effects should be expressed through the layer definition, such as zooming in to a specified area (the ``viewbox`` or setting a maximum zoom). This is important, because it lets us merge definitions for non-standalone layers via a central mechanism, instead of forcing each layer to account for others individually.