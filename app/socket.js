var socket = require('socket.io-client')('http://localhost:3000');

function Messenger(){
	this.socketLoaded = false;
	this.socket = socket;

	this.sendCoords = function(coords){
		coordsMin = {
			time: (new Date()).toJSON(),
			latitude : coords.latitude,
			longitude : coords.longitude
		}
		jsonmsg = JSON.stringify(coordsMin);
		console.log(jsonmsg);
		this.emit('coords', jsonmsg);
	}

	this.emit = function(channel, jsonmsg){
		if(this.socketLoaded){
			this.socket.emit(channel, jsonmsg)
		}else{
			console.log('socket not loaded yet');
		}
	}
}

messenger = new Messenger();

socket.on('connect', function(){
	socket.emit('message','getting you loud and clear');
	messenger.socketLoaded = true;
});

socket.on('event', function(data){
	console.log(data);
});

socket.on('disconnect', function(){
	console.log('disconnect');
});

module.exports = messenger;