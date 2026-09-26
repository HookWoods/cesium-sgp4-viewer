# Sandcastle demo

[Sandcastle](https://sandcastle.cesium.com) is CesiumJS's online playground. `sandcastle.js` runs the library there, straight from npm through jsDelivr.

## Publishing a demo link

1. Publish a version of the package to npm and set `LIBRARY_VERSION` in `sandcastle.js` to it.
2. Open https://sandcastle.cesium.com, replace the JavaScript panel with the content of `sandcastle.js`.
3. Run it, then use **Share** to get a permanent link, and put that link in the main README.

## How it works

- The IIFE build (`dist/cesium-sgp4-viewer.iife.js`) exposes the global `CesiumSgp4Viewer` and reads Cesium from the global `Cesium`, so the library and Sandcastle share one Cesium instance.
- The propagation workers are inlined in that file as blobs: nothing else needs to be served.
- The TLE snapshot comes from this repository through jsDelivr's GitHub endpoint.

## Compatibility

The orbit layer relies on CesiumJS renderer classes that are exported but undocumented (see the main README). Sandcastle always runs the latest CesiumJS release: if a release changes them, the orbits are disabled with a console warning while points, labels and selection keep working.
