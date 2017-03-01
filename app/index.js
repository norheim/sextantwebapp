import * as _ from 'lodash';
import 'bootstrap-loader';
import * as messenger from './socket.js';
import {ViewerWrapper} from './cesiumlib';

import * as EllipsoidTerrainProvider from 'cesium/Source/Core/EllipsoidTerrainProvider';
import * as Cartesian3 from 'cesium/Source/Core/Cartesian3';
import * as CesiumMath from 'cesium/Source/Core/Math';
import * as Cartographic from 'cesium/Source/Core/Cartographic';
import * as Ellipsoid from 'cesium/Source/Core/Ellipsoid';
import * as Color from 'cesium/Source/Core/Color';
import * as Transforms from 'cesium/Source/Core/Transforms';
import * as PointPrimitiveCollection from 'cesium/Source/Scene/PointPrimitiveCollection';
import * as sampleTerrain from 'cesium/Source/Core/sampleTerrain';
import * as ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import * as ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import * as CallbackProperty from 'cesium/Source/DataSources/CallbackProperty';

const viewerWrapper = new ViewerWrapper('http://localhost', 3001, 1, 'cesiumContainer');
const viewer = viewerWrapper.viewer;

const camera = viewer.scene.camera;
/*
var center = Cartesian3.fromDegrees(-155.20178273, 19.36479555);
var points = scene.primitives.add(new PointPrimitiveCollection());
pointPrimitives.modelMatrix = Transforms.eastNorthUpToFixedFrame(center);
pointPrimitives.add({
	color : Color.ORANGE,
	position : new Cartesian3(0.0, 0.0, 0.0) // center
});
pointPrimitives.add({
	color : Color.YELLOW,
	position : new Cartesian3(1000000.0, 0.0, 0.0) // east
});
pointPrimitives.add({
	color : Cesium.Color.GREEN,
	position : new Cartesian3(0.0, 1000000.0, 0.0) // north
});
pointPrimitives.add({
	color : Cesium.Color.CYAN,
	position : new Cartesian3(0.0, 0.0, 1000000.0) // up
});*/

function zoom(){
	hawaii = camera.setView({
		destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
	});
}

function heading(headingAngle) {
    if (headingAngle != undefined) {
        console.log(headingAngle);
        camera.setView({
            destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
            orientation: {
                heading: CesiumMath.toRadians(headingAngle),
                pitch: -CesiumMath.toRadians(90),
                roll: 0.0
            }
        })
    }
}

gpsmesh = messenger.addChannel({
    name: 'gpsmesh',
    send: function(data){
        return data
    },
    onrecieve: function(data){
        gps_tracks.addMesh()
    }
});

function DynamicLines(){
	this.points = [];
	this.pointcounter = 0;
	this.entity = Object();

    this.getPoints = function(){
        return this.points;
    };

    this.pushPoint = function(lat, lon){
        console.log(lat.toString()+','+lon.toString());
        viewerWrapper.getRaisedPositions({latitude: [lat], longitude: [lon]}).then(function(raisedMidPoints){
            this.points.push(raisedMidPoints[0]);
        }.bind(this));
    };
    this.addMesh = function(){
        gps_mesh.send('')
    };

	this.addPoint = function(lat, lon){
        console.log('adding point');
		this.pointcounter+=1;
        this.pushPoint(lat, lon);
		if(this.pointcounter == 2) {
			console.log(this.points);
			this.entity = viewer.entities.add({
			    name : 'GPS coordinates',
			    polyline : {
			        positions : new CallbackProperty(this.getPoints.bind(this), false),
			        width : 2,
			        material : Color.GREEN
			    }
			});
			//this.zoomTo()
		}else if(this.pointcounter > 2){
			lascoords = _.takeRight(this.points,2);
			console.log(lascoords[0]==lon);
			console.log(lascoords[1]==lat);
			if(lascoords[0]!=lon) {
				this.pushPoint(lon, lat);
				//this.zoomTo()
			}
		}
	};

	this.zoomTo = function(){
		viewer.zoomTo(this.entity);
	}
}

gps_tracks = new DynamicLines();

function zoomtotracks(){
	return gps_tracks.zoomTo();
}
doPrintLatLong = true;

coordsContainer = document.getElementById('coords');
function getLocation(data){
	if (doPrintLatLong){
			coords = JSON.parse(data);
			if(coords.latitude != 0 && coords.longitude != 0){
				const wrappedCoords = coords.longitude.toString() + ',' +
				coords.latitude.toString() +'</br>';
				coordsContainer.innerHTML = wrappedCoords+coordsContainer.innerHTML;
				gps_tracks.addPoint(coords.latitude, coords.longitude);
                //console.log(coords.longitude, coords.latitude);
			}
	}
}

serial = messenger.addChannel({
	name: 'serialstatus',
	onrecieve: function(data){
		console.log(data);
		document.getElementById('serialports').innerHTML = data;
	}
});

gpstracksilencer = messenger.addChannel({
    name: 'gpstracksilencer',
    send: function(data){
        return data
    }
});


gpsmesh = messenger.addChannel({
    name: 'gpsmesh',
    onrecieve: function(data){
        console.log('got mesh data');
        //console.log(data);
        //viewerWrapper.addMesh(data['upper_left'], data['lower_right'], data['dem']);
        //console.log(data);
    }
});

gpsmesh.connect();

gpstrack = messenger.addChannel({
    name: 'gpstrack',
    onconnect: function (data) {
        return data
    },
    onrecieve: function(data){
        console.log('got gps data');
        console.log(data);
        getLocation(data);
    }
});

waypointrequest = messenger.addChannel({
	name: 'waypoints',
	send: function(data){
		return data
	},
	onrecieve: function (data) {
        console.log(data);
        midPoints = JSON.parse(data);
        viewerWrapper.getRaisedPositions(midPoints).then(function(raisedMidPoints){
            console.log(raisedMidPoints);
            entity = viewer.entities.add({
                polyline: {
                    positions: raisedMidPoints,
                    width: 2,
                    material: Color.RED
                }
            });
            viewer.zoomTo(entity);
        });
    }
});
console.log(messenger);

getpextant = messenger.addChannel({
	name:'pextant',
    send: function(data) {
        return data
    },
	onrecieve: function (data) {
        console.log(data);
        midPoints = JSON.parse(data);
        viewerWrapper.getRaisedPositions(midPoints).then(function(raisedMidPoints){
            console.log(raisedMidPoints);
            entity = viewer.entities.add({
                polyline: {
                    positions: raisedMidPoints,
                    width: 2,
                    material: Color.ORANGE
                }
            });
            viewer.zoomTo(entity);
        });
    }
});

meshmsg = messenger.addChannel({
    name:'meshmessenger',
    send: function(data) {
        return data
    },
    onrecieve: function (data) {
        console.log(data);
    }
});

calibrate = messenger.addChannel({
    name: 'calibrate',
    send: function (data) {
        return data
    }
});

function getglobalpoint(){
	return viewerWrapper.globalpoint;
}
module.exports = {
    start: gpstrack,
    stop: gpstracksilencer,
    zoom: zoom,
    heading: heading,
    zoomtotracks: zoomtotracks,
    serialrequest: serial,
    getwaypoints: waypointrequest,
    getpextant: getpextant,
    globalpoint: getglobalpoint,
    calibrate: calibrate
};

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function() {
    //clearInterval(timer):
  });
}