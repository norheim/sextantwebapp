require('cesium/Source/Widgets/widgets.css');
require('./style.css');
var BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
BuildModuleUrl.setBaseUrl('./');

// Load all cesium components required
var Viewer = require('cesium/Source/Widgets/Viewer/Viewer');
var EllipsoidTerrainProvider = require('cesium/Source/Core/EllipsoidTerrainProvider');
var Cartesian3 = require('cesium/Source/Core/Cartesian3');
var CesiumMath = require('cesium/Source/Core/Math');
var Cartographic = require('cesium/Source/Core/Cartographic');
var Ellipsoid = require('cesium/Source/Core/Ellipsoid');
var Color = require('cesium/Source/Core/Color');
var Rectangle = require('cesium/Source/Core/Rectangle');
var sampleTerrain = require('cesium/Source/Core/sampleTerrain');
var ScreenSpaceEventHandler = require('cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('cesium/Source/Core/ScreenSpaceEventType');
var createTileMapServiceImageryProvider = require('cesium/Source/Scene/createTileMapServiceImageryProvider');
var CesiumTerrainProvider = require('cesium/Source/Core/CesiumTerrainProvider');
var CallbackProperty = require('cesium/Source/DataSources/CallbackProperty');
var globalPoint;

function ViewerWrapper(host, port, terrainExaggeration, container){
    this.container = container;
    this.host = host;
    this.port = port;
    this.layers = null;
    this.layerList = {};
    this.terrainList = {};
    this.terrainExaggeration = terrainExaggeration;
    this.globalpoint = null;

    this.serveraddress = function(port){
        return this.host + ':' + port;
    };

    this.addImagery = function(port, folder_location){
        if(typeof port === "undefined") {
            port=this.port;
        }
        new_layer = this.layers.addImageryProvider(new createTileMapServiceImageryProvider({
            url : this.serveraddress(port) + '/' + folder_location
        }));
        this.layerList[folder_location] = new_layer;
    };

    this.addTerrain = function(port, folder_location) {
        if(typeof port === "undefined") {
            port = this.port;
        }
        var new_terrain_provider = new CesiumTerrainProvider({
            url : this.serveraddress(port) + '/' + folder_location
        });
        this.terrainList[folder_location] = new_terrain_provider;
        this.viewer.scene.terrainProvider = new_terrain_provider;
    };
    this.addMesh = function(upperLeft, lowerRight){
        lon_west = upperLeft.longitude;
        lon_east = lowerRight.longitude;
        lon_spacing = 20;
        lonstep = (lon_east-lon_west)/lon_spacing;
        lat_north = upperLeft.latitude;
        lat_south = lowerRight.latitude;
        lat_spacing = 20;
        latstep = (lat_north-lat_south)/lat_spacing;

        for (var lon = lon_west; lon < lon_east; lon += lonstep) {
            for (var lat = lat_south; lat < lat_north; lat += latstep) {
                viewer.entities.add({
                    rectangle : {
                        coordinates : Rectangle.fromDegrees(lon, lat, lon + lonstep, lat + latstep),
                        material : Color.fromRandom({alpha : 0.5})
                    }
                });
            }
        }
    };

    this.addLatLongHover = function(){
        var viewer = this.viewer;
        var entity = viewer.entities.add({
            label : {
                show : false
            }
        });

        scene = viewer.scene;
        handler = new ScreenSpaceEventHandler(scene.canvas);
        self = this;
        handler.setInputAction(function(movement) {
            var ray = viewer.camera.getPickRay(movement.endPosition);
            var cartesian= viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                var cartographic = Cartographic.fromCartesian(cartesian);
                var longitudeString = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
                var latitudeString = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
                this.globalpoint = {
                    "latitude":CesiumMath.toDegrees(cartographic.latitude),
                    "longitude":CesiumMath.toDegrees(cartographic.longitude)
                };

                var carto_WGS84 = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
                var heightString = carto_WGS84.height.toFixed(4)/self.terrainExaggeration;

                entity.position = cartesian;
                entity.label.show = true;
                entity.label.text = '(' + longitudeString + ', ' + latitudeString + ', ' + heightString + ')';
            };
        }.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
    };

    // returns positions projected on the terrain in Cartesian3, required for entity creation
    this.getRaisedPositions = function (latLongCoords) {
        //console.log(latLongCoords);
        return new Promise(function(resolve, reject) {
            var cartographicArray = [];
            for (i in latLongCoords['latitude']) {
                cartographicPoint = Cartographic.fromDegrees(latLongCoords['longitude'][i], latLongCoords['latitude'][i]);
                cartographicArray.push(cartographicPoint);
            }
            //console.log(cartographicArray);
            self = this;
            var ellipsoid = this.viewer.scene.globe.ellipsoid;
            sampleTerrain(this.viewer.terrainProvider, 15, cartographicArray)
                .then(function (raisedPositionsCartograhpic) {
                    raisedPositionsCartograhpic.forEach(function (coord, i) {
                        raisedPositionsCartograhpic[i].height *= self.terrainExaggeration;
                    });
                    var inter = ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic);
                    //console.log(inter[0]);
                    resolve(ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic));
                });
        }.bind(this));
    };

    this.initialize = function(){
        // Set simple geometry for the full planet
        var terrainProvider = new EllipsoidTerrainProvider();
        this.terrainList['default'] = terrainProvider;

        // Basic texture for the full planet
        this.layerList['default'] = 'Assets/Textures/NaturalEarthII';
        var imageryProvider = createTileMapServiceImageryProvider({
            url : this.serveraddress(this.port) + '/' + this.layerList['default'],
            fileExtension : 'jpg'
        });

        var viewer = new Viewer(this.container, {
            timeline : false,
            creditContainer : 'credits',
            terrainExaggeration : terrainExaggeration,
            baseLayerPicker : false,
            terrainProvider : terrainProvider,
            imageryProvider : imageryProvider

        });
        self = this;
        hawaii = viewer.scene.camera.flyTo({
            destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
            duration: 3,
            complete: function(){
                self.addTerrain('9090', 'tilesets/HI_highqual');
                self.addImagery('3001', 'CustomMaps/MU_Pan_Sharp_contrast');
                self.addLatLongHover();
            }
        });

        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = viewer.scene.camera;
        this.layers = viewer.scene.imageryLayers;
    };

    this.initialize();
}

module.exports = {
    viewerwrapper:ViewerWrapper,
    globalpoint:globalPoint
}