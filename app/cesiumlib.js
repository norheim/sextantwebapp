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
var ColorGeometryInstanceAttribute = require('cesium/Source/Core/ColorGeometryInstanceAttribute');
var GeometryInstance = require('cesium/Source/Core/GeometryInstance');
var Rectangle = require('cesium/Source/Core/Rectangle');
var RectangleGeometry = require('cesium/Source/Core/RectangleGeometry');
var EntityCollection = require('cesium/Source/DataSources/EntityCollection');
var sampleTerrain = require('cesium/Source/Core/sampleTerrain');
var ScreenSpaceEventHandler = require('cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('cesium/Source/Core/ScreenSpaceEventType');
var createTileMapServiceImageryProvider = require('cesium/Source/Scene/createTileMapServiceImageryProvider');
var GroundPrimitive = require('cesium/Source/Scene/GroundPrimitive');
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
    this.mesh_upper_left = null;
    this.mesh_entities = [];
    this.mesh_rowcol = [];

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
    this.addMesh = function(upperLeft, lowerRight, dem){
        console.log('draping mesh');
        console.log(dem[0]);
        if (upperLeft != this.mesh_upper_left) {
            this.mesh_upper_left = upperLeft;

            var lon_west = upperLeft.longitude;
            var lon_east = lowerRight.longitude;
            var lon_spacing = dem[0].length;
            var lonstep = (lon_east - lon_west) / lon_spacing;
            var lat_north = upperLeft.latitude;
            var lat_south = lowerRight.latitude;
            var lat_spacing = dem.length;
            var latstep = (lat_north - lat_south) / lat_spacing;

            var ul_col = upperLeft.col;
            var ul_row = upperLeft.row;
            var lr_col = lowerRight.col;
            var lr_row = lowerRight.row;
            console.log(ul_col);
            console.log(lr_row);
            //var scene = this.viewer.scene;
            // Remove all "old" entities
            console.log('made it until the loop');
            var col = ul_col-1;
            var i = -1;
            for (var lon = lon_west; lon < lon_east; lon += lonstep) {
                i++;
                col+=1;
                var row = lr_row+1;
                var j = lat_spacing+1;
                //console.log(lon);
                for (var lat = lat_south; lat < lat_north; lat += latstep) {
                    j-=1;
                    row -=1;
                    var hackyhash = row.toString()+col.toString();
                    if(!this.mesh_rowcol.includes(hackyhash)) {
                        console.log(dem[j][i]);
                        var entity = this.viewer.entities.add({
                            rectangle: {
                                coordinates: Rectangle.fromDegrees(lon, lat, lon + lonstep, lat + latstep),
                                material: Color.fromRandom({alpha: 0.5})
                            }
                        });
                        this.mesh_entities.push(entity);
                        if(this.mesh_entities.length > 1000){
                            while(this.mesh_entities.length > 1000){
                                this.viewer.entities.remove(this.mesh_entities.shift());
                            }
                        }
                        this.mesh_rowcol.push(hackyhash);
                    }else{
                        console.log('already included');
                    }
                }
            }
            //this.viewer.zoomTo(entity);
            //console.log('done with loop');
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
            }
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

        handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

        handler.setInputAction(function(movement) {
            document.getElementById('hovercoord').innerHTML = this.globalpoint['latitude'].toString() + "</br>" +
                this.globalpoint['longitude'].toString();
        }.bind(this), ScreenSpaceEventType.LEFT_DOWN);

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