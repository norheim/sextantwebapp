ViewerWrapper = require('./cesiumlib');

var viewerWrapper = new ViewerWrapper('http://localhost', 3001, 1, 'cesiumContainer');
var viewer = viewerWrapper.viewer;
var camera = viewer.scence.camera;

hawaii = camera.flyTo({
    destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
    duration: 3,
    complete: function(){
        viewerWrapper.addImagery('3001', 'CustomMaps/HI_lowqual_relief');
        viewerWrapper.addTerrain('9090', 'tilesets/HI_highqual');
        hoverLatLong()
    }
});

function zoom(){
    hawaii = camera.setView({
        destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
    });
}
