/**
 * Created by johan on 5/24/2017.
 */
import * as messenger from './socket.js';
import viewerWrapper from './index.js';

gpsmesh = messenger.addChannel({
    name: 'gpsmesh',
    send: function(data){
        return data
    },
    onrecieve: function(data){
        gps_tracks.addMesh()
    }
});

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
        const midPoints = JSON.parse(data);
        const styleOptions = {
            width: 2,
            material: Color.RED
        };
        LineString(midPoints, styleOptions)
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
        const midPoints = JSON.parse(data);
        const styleOptions = {
            width: 2,
            material: Color.ORANGE
        };
        LineString(midPoints, styleOptions)
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
