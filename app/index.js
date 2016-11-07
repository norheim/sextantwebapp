require('./socket.js')
require('bootstrap-loader');
require('cesium/Source/Widgets/widgets.css');
require('./style.css')
var BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
BuildModuleUrl.setBaseUrl('./');

// Load all cesium components required
var Viewer = require('cesium/Source/Widgets/Viewer/Viewer');
var EllipsoidTerrainProvider = require('cesium/Source/Core/EllipsoidTerrainProvider');
var Cartesian3 = require('cesium/Source/Core/Cartesian3');
var CesiumMath = require('cesium/Source/Core/Math');
var Cartographic = require('cesium/Source/Core/Cartographic');
var Ellipsoid = require('cesium/Source/Core/Ellipsoid');
var ScreenSpaceEventHandler = require('cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('cesium/Source/Core/ScreenSpaceEventType');
var createTileMapServiceImageryProvider = require('cesium/Source/Scene/createTileMapServiceImageryProvider');
var CesiumTerrainProvider = require('cesium/Source/Core/CesiumTerrainProvider');

// Set simple geometry for the full planet
var terrainProvider = new EllipsoidTerrainProvider();

// Basic texture for the full planet
var imageryProvider = createTileMapServiceImageryProvider({
       url : 'http://localhost:3001/Assets/Textures/NaturalEarthII',
       fileExtension : 'jpg'
   });

var terrainExaggeration = 2.0;

var viewer = new Viewer('cesiumContainer', {
	timeline : false,
	animation : false,
	creditContainer : 'credits',
    terrainExaggeration : terrainExaggeration,
    baseLayerPicker : false,
    terrainProvider : terrainProvider,
    imageryProvider : imageryProvider
});

function switchTerrain(){
      // Load new terrain
      var terrainProvider = new CesiumTerrainProvider({
        url: 'http://localhost:9090/tilesets/HI_highqual'
      });

      // Add layers
      var layers = viewer.scene.imageryLayers;

      var HI_tiles_2 = layers.addImageryProvider(new createTileMapServiceImageryProvider({
          url : 'http://localhost:3001/CustomMaps/HI_tiles_2'
      }));
      HI_tiles_2.alpha = 0;

      var colorized = layers.addImageryProvider(new createTileMapServiceImageryProvider({
          url : 'http://localhost:3001/CustomMaps/colorized_tiles'
      }));
      colorized.alpha = 0;

      var panSharp = layers.addImageryProvider(new createTileMapServiceImageryProvider({
          url : 'http://localhost:3001/CustomMaps/MU_Pan_Sharp_contrast'
      }));

      viewer.scene.terrainProvider = terrainProvider;
      hoverLatLong();
      //addMesh();
}
    
hawaii = viewer.scene.camera.flyTo({
      destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
      duration: 3,
      complete: switchTerrain
    });

function hoverLatLong(){
      var entity = viewer.entities.add({
          label : {
              show : false
          }
      });

      scene = viewer.scene;
      handler = new ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function(movement) {
          var ray = viewer.camera.getPickRay(movement.endPosition)
          var cartesian= viewer.scene.globe.pick(ray, viewer.scene);
          //var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
          if (cartesian) {
              var cartographic = Cartographic.fromCartesian(cartesian);
              var longitudeString = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
              var latitudeString = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
              var heightString = cartographic.height.toFixed(4);

              var carto_WGS84 = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
              heightString2 = carto_WGS84.height.toFixed(4)/terrainExaggeration;

              entity.position = cartesian;
              entity.label.show = true;
              entity.label.text = '(' + longitudeString + ', ' + latitudeString + ', ' + heightString2 + ')';
          } else {
              entity.label.show = false;
          }
      }, ScreenSpaceEventType.MOUSE_MOVE);
    }

var app = document.getElementById('app');
var time = document.getElementById('time');

var timer = setInterval(updateClock, 1000);

function updateClock() {
  time.innerHTML = (new Date()).toString();
}

// Edit these styles to see them take effect immediately
app.style.border = '1px solid #339';
app.style.background = '#99d';
app.style.color = '#333';
//app.style.textAlign = 'center';
app.style.verticalAlign = 'center';

var cesiumContainer = document.getElementById('cesiumContainer');
cesiumContainer.height = window.innerHeight;

// Uncomment one of the following lines to see error handling
// require('unknown-module')
// } syntax-error

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function() {
    clearInterval(timer);
  });
}