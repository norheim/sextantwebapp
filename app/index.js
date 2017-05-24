import * as _ from 'lodash';
import 'bootstrap-loader';
import {ViewerWrapper} from './cesiumlib';
import {Cartesian3, CesiumMath, Color, CallbackProperty} from './demo_code/cesium_imports'
import {SSE} from './sseUtils'

const host = 'http://localhost';
//const host = 'http://18.189.2.237';
const viewerWrapper = new ViewerWrapper(host, 3001, 1, 'cesiumContainer');
const sse = new SSE('https://localhost');
const viewer = viewerWrapper.viewer;
const camera = viewer.scene.camera;

function zoom(){
	const hawaii = camera.setView({
		destination: Cartesian3.fromDegrees(-155.2118, 19.3647, 5000)
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
function LineString(latlongPoints, styleOptions) {
    viewerWrapper.getRaisedPositions(latlongPoints).then(function (raisedMidPoints) {
        //console.log(raisedMidPoints);
        const polylinePositon = {
            positions: raisedMidPoints
        };
        const polylineArguments = Object.assign({}, polylinePositon, styleOptions);
        const entity = viewer.entities.add({
            polyline: polylineArguments
        });
        viewer.zoomTo(entity);
    });
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
    this.addMesh = function(){
        gps_mesh.send('')
    };
	this.addPoint = function(lat, lon){
        console.log('adding point');
		this.pointcounter+=1;
        this.pushPoint(lat, lon);
		if(this.pointcounter === 2) {
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
			console.log(lascoords[0]===lon);
			console.log(lascoords[1]===lat);
			if(lascoords[0]!==lon) {
				this.pushPoint(lon, lat);
				//this.zoomTo()
			}
		}
	};
	this.zoomTo = function(){
		viewer.zoomTo(this.entity);
	}
}


const gps_tracks = new DynamicLines();
sse.subscribe('position', gps_tracks.addPoint, 'EV2');

function zoomtotracks(){
	return gps_tracks.zoomTo();
}

const doPrintLatLong = true;

const coordsContainer = document.getElementById('coords');

function getLocation(data){
	if (doPrintLatLong){
			const coords = JSON.parse(data);
			if(coords.latitude !== 0 && coords.longitude !== 0){
				const wrappedCoords = coords.longitude.toString() + ',' +
				coords.latitude.toString() +'</br>';
				coordsContainer.innerHTML = wrappedCoords+coordsContainer.innerHTML;
				gps_tracks.addPoint(coords.latitude, coords.longitude);
                //console.log(coords.longitude, coords.latitude);
			}
	}
}

function getglobalpoint(){
	return viewerWrapper.globalpoint;
}

module.exports = {
    'zoom': zoom,
    'heading': heading,
    'zoomtotracks': zoomtotracks,
    'globalpoint': getglobalpoint
};

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function() {
    //clearInterval(timer):
  });
}