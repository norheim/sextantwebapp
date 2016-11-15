_ = require('lodash');
require('bootstrap-loader');
messenger = require('./socket.js');
cesiumlib= require('./cesiumlib');

ViewerWrapper = cesiumlib.viewerwrapper;


var EllipsoidTerrainProvider = require('cesium/Source/Core/EllipsoidTerrainProvider');
var Cartesian3 = require('cesium/Source/Core/Cartesian3');
var CesiumMath = require('cesium/Source/Core/Math');
var Cartographic = require('cesium/Source/Core/Cartographic');
var Ellipsoid = require('cesium/Source/Core/Ellipsoid');
var Color = require('cesium/Source/Core/Color');
var Transforms = require('cesium/Source/Core/Transforms');
var PointPrimitiveCollection = require('cesium/Source/Scene/PointPrimitiveCollection');
var sampleTerrain = require('cesium/Source/Core/sampleTerrain');
var ScreenSpaceEventHandler = require('cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('cesium/Source/Core/ScreenSpaceEventType');
var CallbackProperty = require('cesium/Source/DataSources/CallbackProperty');

var viewerWrapper = new ViewerWrapper('http://localhost', 3001, 1, 'cesiumContainer');
var viewer = viewerWrapper.viewer;

var camera = viewer.scene.camera;
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
				var wrappedCoords = coords.longitude.toString() + ',' +
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

gpstrack = messenger.addChannel({
    name: 'gpstrack',
    initial: function (data) {
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
    globalpoint: getglobalpoint
};

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function() {
    //clearInterval(timer);
  });
}