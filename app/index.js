_ = require('lodash');
require('bootstrap-loader');
messenger = require('./socket.js');
ViewerWrapper = require('./cesiumlib');

var EllipsoidTerrainProvider = require('cesium/Source/Core/EllipsoidTerrainProvider');
var Cartesian3 = require('cesium/Source/Core/Cartesian3');
var CesiumMath = require('cesium/Source/Core/Math');
var Cartographic = require('cesium/Source/Core/Cartographic');
var Ellipsoid = require('cesium/Source/Core/Ellipsoid');
var Color = require('cesium/Source/Core/Color');
var sampleTerrain = require('cesium/Source/Core/sampleTerrain');
var ScreenSpaceEventHandler = require('cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('cesium/Source/Core/ScreenSpaceEventType');
var CallbackProperty = require('cesium/Source/DataSources/CallbackProperty');

var viewerWrapper = new ViewerWrapper('http://localhost', 3001, 1, 'cesiumContainer');
var viewer = viewerWrapper.viewer;

var camera = viewer.scene.camera;


function zoom(){
	hawaii = camera.setView({
		destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000),
	});
}

function DynamicLines(){
	this.points = [];
	this.pointcounter = 0;
	this.entity = Object();

	this.toCartesian = function(){
		//console.log(this.pointcounter);
		/*coordarray = Cartographic.fromDegreesArray(this.points);
		sampleTerrain(viewer.terrainProvider, 15, coordarray)
			.then(function (raisedPositionsCartograhpic) {
				console.log('made it here');
				raisedPositionsCartograhpic.forEach(function (coord, i) {
					raisedPositionsCartograhpic[i].height *= viewerWrapper.terrainExaggeration;
				});
				console.log(raisedPositionsCartograhpic[0].height);
				var raisedPositionsOut = ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic);
				return raisedPositionsOut;
			});*/
		return Cartesian3.fromDegreesArray(this.points);
	}

	this.addPoint = function(lat, lon){
		this.pointcounter+=1;

		if(this.pointcounter < 2) {
			this.points.push(lon, lat);
		}else if(this.pointcounter == 2){
			console.log(this.points);
			this.entity = viewer.entities.add({
			    name : 'GPS coordinates',
			    polyline : {
			        positions : new CallbackProperty(this.toCartesian.bind(this), false),
			        width : 2,
			        material : Color.RED
			    }
			});
			this.zoomTo()
		}else if(this.pointcounter > 2){
			lascoords = _.takeRight(this.points,2);
			console.log(lascoords[0]==lon);
			console.log(lascoords[1]==lat);
			if(lascoords[0]!=lon) {
				this.points.push(lon, lat);
				this.zoomTo()
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

var ellipsoid = viewer.scene.globe.ellipsoid;
waypointrequest = messenger.addChannel({
	name: 'waypoints',
	onrecieve: function (data) {
		console.log(data);
		waypoints = JSON.parse(data);
		coordarray = [];
		console.log(waypoints['latitude']);
		for (i in waypoints['latitude']) {
			console.log(i);
			cartographicpoint = Cartographic.fromDegrees(waypoints['longitude'][i], waypoints['latitude'][i])
			coordarray.push(cartographicpoint);
		}
		console.log(coordarray);

		sampleTerrain(viewer.terrainProvider, 15, coordarray)
			.then(function (raisedPositionsCartograhpic) {
				console.log('made it here');
				raisedPositionsCartograhpic.forEach(function (coord, i) {
					raisedPositionsCartograhpic[i].height *= viewerWrapper.terrainExaggeration;
				});
				console.log(raisedPositionsCartograhpic[0].height);
				var raisedPositions = ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic);
				console.log(raisedPositions);
				entity = viewer.entities.add({
					polyline: {
						positions: raisedPositions,
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
	onrecieve: function(data){
		console.log(data);
		waypoints = JSON.parse(data);
		console.log(data);
		coordarray = [];
		
		for(i in waypoints['latitude']){
			cartographicpoint = Cartographic.fromDegrees(waypoints['longitude'][i], waypoints['latitude'][i])
			coordarray.push(cartographicpoint);
		}
		/*
		var raisedPositions = ellipsoid.cartographicArrayToCartesianArray(coordarray);
		entity = viewer.entities.add({
		        polyline : {
		            positions : raisedPositions,
		            width : 10,
		            material : Color.RED
		        }
		    });
		viewer.zoomTo(entity);*/
		
		console.log(coordarray);
		console.log(coordarray);

		sampleTerrain(viewer.terrainProvider, 15, coordarray)
			.then(function (raisedPositionsCartograhpic) {
				console.log('made it here');
				raisedPositionsCartograhpic.forEach(function (coord, i) {
					raisedPositionsCartograhpic[i].height *= viewerWrapper.terrainExaggeration;
				});
				console.log(raisedPositionsCartograhpic[0].height);
				var raisedPositions = ellipsoid.cartographicArrayToCartesianArray(raisedPositionsCartograhpic);
				console.log(raisedPositions);
				entity = viewer.entities.add({
					polyline: {
						positions: raisedPositions,
						width: 2,
						material: Color.ORANGE
					}
				});
				viewer.zoomTo(entity);
			});
	}
});


module.exports = {
  start: gpstrack,
  //stop: stop,
  zoom: zoom,
  //zoomtotracks: zoomtotracks,
  serialrequest: serial,
  getwaypoints: waypointrequest,
  getpextant: getpextant
};

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function() {
    //clearInterval(timer);
  });
}