import 'cesium/Source/Widgets/widgets.css';
import './style.css';
import {setBaseUrl} from 'cesium/Source/Core/buildModuleUrl';
setBaseUrl('./');

// Load all cesium components required
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import EllipsoidTerrainProvider from 'cesium/Source/Core/EllipsoidTerrainProvider';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CesiumMath from 'cesium/Source/Core/Math';
import Cartographic from 'cesium/Source/Core/Cartographic';
import Ellipsoid from 'cesium/Source/Core/Ellipsoid';
import Color from 'cesium/Source/Core/Color';
import Transforms from 'cesium/Source/Core/Transforms';
import PointPrimitiveCollection from 'cesium/Source/Scene/PointPrimitiveCollection';
import sampleTerrain from 'cesium/Source/Core/sampleTerrain';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import CallbackProperty from 'cesium/Source/DataSources/CallbackProperty';
import ColorGeometryInstanceAttribute from 'cesium/Source/Core/ColorGeometryInstanceAttribute';
import GeometryInstance from 'cesium/Source/Core/GeometryInstance';
import Rectangle from 'cesium/Source/Core/Rectangle';
import RectangleGeometry from 'cesium/Source/Core/RectangleGeometry';
import EntityCollection from 'cesium/Source/DataSources/EntityCollection';
import CreateTileMapServiceImageryProvider from 'cesium/Source/Scene/createTileMapServiceImageryProvider';
import GroundPrimitive from 'cesium/Source/Scene/GroundPrimitive';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';

class ViewerWrapper{
    constructor(host, port, terrainExaggeration, container) {
        this.container = container;
        this.host = host;
        this.port = port;
        this.layerList = {};
        this.terrainList = {};
        this.terrainExaggeration = terrainExaggeration;
        this.globalpoint = null;
        this.mesh_upper_left = null;
        this.mesh_entities = [];
        this.mesh_rowcol = [];

        // Set simple geometry for the full planet
        const terrainProvider = new EllipsoidTerrainProvider();
        this.terrainList['default'] = terrainProvider;

        // Basic texture for the full planet
        this.layerList['default'] = 'Assets/Textures/NaturalEarthII';
        const imageryProvider = CreateTileMapServiceImageryProvider({
            url : this.serveraddress(this.port) + '/' + this.layerList['default'],
            fileExtension : 'jpg'
        });

        const viewer = new Viewer(this.container, {
            timeline : false,
            creditContainer : 'credits',
            terrainExaggeration : terrainExaggeration,
            baseLayerPicker : false,
            terrainProvider : terrainProvider,
            imageryProvider : imageryProvider

        });
        self = this;
        const hawaii = viewer.scene.camera.flyTo({
            destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
            duration: 3,
            complete: function(){
                self.addTerrain('3001', 'tilesets/HI_air_imagery');
                self.addImagery('3001', 'CustomMaps/MU_Pan_Sharp_contrast');
                //self.addImagery('3001', 'CustomMaps/HI_air_imagery_relief_100');
                self.addLatLongHover();
            }
        });

        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(function(movement) {
            document.getElementById('hovercoord').innerHTML = this.globalpoint['latitude'].toString() + "</br>" +
                this.globalpoint['longitude'].toString();
        }.bind(this), ScreenSpaceEventType.LEFT_DOWN);

        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = viewer.scene.camera;
        this.layers = viewer.scene.imageryLayers;
    }

    serveraddress(port){
        return this.host + ':' + port;
    };

    addGeoPoint(vizsocket){
        const viewer = this.viewer;
        const entity = viewer.entities.add({
            label : {
                show : false
            }
        });

        const scene = viewer.scene;
        const handler = new ScreenSpaceEventHandler(scene.canvas);
        const self = this;
        handler.setInputAction(function(movement) {
            const ray = viewer.camera.getPickRay(movement.endPosition);
            const cartesian= viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                const cartographic = Cartographic.fromCartesian(cartesian);
                const longitudeString = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
                const latitudeString = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
                const carto_WGS84 = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
                const heightString = carto_WGS84.height.toFixed(4)/self.terrainExaggeration;

                entity.position = cartesian;
                entity.label.show = true;
                entity.label.text = '(' + longitudeString + ', ' + latitudeString + ', ' + heightString + ')';

                const object = {
                    "name": 'GeoPoint',
                    "arguments": {
                        "type": 'LAT_LONG',
                        "latitude": CesiumMath.toDegrees(cartographic.latitude),
                        "longitude": CesiumMath.toDegrees(cartographic.longitude)
                    }
                };

                vizsocket.add(object);
            }
        }.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
    };

    addImagery(port, folder_location){
        if(typeof port === "undefined") {
            port = this.port;
        }
        this.layerList[folder_location] = this.layers.addImageryProvider(new CreateTileMapServiceImageryProvider({
            url : this.serveraddress(port) + '/' + folder_location
        }));
    };

    addTerrain(port, folder_location) {
        if(typeof port === "undefined") {
            port = this.port;
        }
        const new_terrain_provider = new CesiumTerrainProvider({
            url : this.serveraddress(port) + '/' + folder_location
        });
        this.terrainList[folder_location] = new_terrain_provider;
        this.viewer.scene.terrainProvider = new_terrain_provider;
    };

    addRectangle(center, length){

    };

    addMesh(upperLeft, lowerRight, dem){
        console.log('draping mesh');
        console.log(dem[0]);
        if (upperLeft != this.mesh_upper_left) {
            this.mesh_upper_left = upperLeft;

            const [lon_west, lon_east] = [upperLeft.longitude, lowerRight.longitude];
            const lon_spacing = dem[0].length;
            const lonstep = (lon_east - lon_west) / lon_spacing;
            const [lat_north, lat_south] = [upperLeft.latitude, lowerRight.latitude];
            const lat_spacing = dem.length;
            const latstep = (lat_north - lat_south) / lat_spacing;

            const [ul_col, ul_row, lr_col, lr_row] = [upperLeft.col, upperLeft.row, lowerRight.col, lowerRight.row];
            console.log(ul_col);
            console.log(lr_row);

            // Remove all "old" entities
            console.log('made it until the loop');
            let col = ul_col-1;
            let i = -1;
            for (let lon = lon_west; lon < lon_east; lon += lonstep) {
                i++;
                col+=1;
                let row = lr_row+1;
                let j = lat_spacing+1;
                //console.log(lon);
                for (let lat = lat_south; lat < lat_north; lat += latstep) {
                    j-=1;
                    row -=1;
                    let hackyhash = row.toString()+col.toString();
                    if(!this.mesh_rowcol.includes(hackyhash)) {
                        console.log(dem[j][i]);
                        let entity = this.viewer.entities.add({
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

    addLatLongHover(){
        const viewer = this.viewer;
        const entity = viewer.entities.add({
            label : {
                show : false
            }
        });

        const scene = viewer.scene;
        const handler = new ScreenSpaceEventHandler(scene.canvas);
        self = this;
        handler.setInputAction(function(movement) {
            const ray = viewer.camera.getPickRay(movement.endPosition);
            const cartesian= viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                const cartographic = Cartographic.fromCartesian(cartesian);
                const longitudeString = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
                const latitudeString = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
                this.globalpoint = {
                    "latitude":CesiumMath.toDegrees(cartographic.latitude),
                    "longitude":CesiumMath.toDegrees(cartographic.longitude)
                };
                const carto_WGS84 = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
                const heightString = carto_WGS84.height.toFixed(4)/self.terrainExaggeration;

                entity.position = cartesian;
                entity.label.show = true;
                entity.label.text = '(' + longitudeString + ', ' + latitudeString + ', ' + heightString + ')';
            }
        }.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
    };

    // returns positions projected on the terrain in Cartesian3, required for entity creation
    getRaisedPositions(latLongCoords) {
        //console.log(latLongCoords);
        return new Promise(function(resolve, reject) {
            const cartographicArray = [];
            for (i in latLongCoords['latitude']) {
                cartographicPoint = Cartographic.fromDegrees(latLongCoords['longitude'][i], latLongCoords['latitude'][i]);
                cartographicArray.push(cartographicPoint);
            }
            //console.log(cartographicArray);
            self = this;
            const ellipsoid = this.viewer.scene.globe.ellipsoid;
            sampleTerrain(this.viewer.terrainProvider, 15, cartographicArray)
                .then(function (raisedPositionsCartograhpic) {
                    raisedPositionsCartograhpic.forEach(function (coord, i) {
                        raisedPositionsCartograhpic[i].height *= self.terrainExaggeration;
                    });
                    let inter = ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic);
                    //console.log(inter[0]);
                    resolve(ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic));
                });
        }.bind(this));
    };
}

export {ViewerWrapper}