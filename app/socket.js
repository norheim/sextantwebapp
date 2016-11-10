var socket = require('socket.io-client')('http://localhost:3000');

function BounceRequest(channelname, callbackfx, messenger){
	console.log(channelname);
	this.channelname = channelname;
	this.callbackfx = callbackfx;
	this.messenger = messenger;
	
	socket.on(channelname, function(data){
		this.callbackfx(data);
	}.bind(this));

	this.request = function(){
		console.log('request sent');
		console.log(this.channelname);
		this.messenger.emit(this.channelname, 'hihihi')
	}.bind(this)
}

function Messenger(){
	this.socketLoaded = false;
	this.socket = socket;
	this.bounceRequests = {};

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

	this.requestCoords = function(){
		this.emit('serialstatus', '');
	}

	this.emit = function(channel, jsonmsg){
		if(this.socketLoaded){
			console.log('socker emitting: '+channel.toString());
			this.socket.emit(channel, jsonmsg);
		}else{
			console.log('socket not loaded yet');
		}
	}

	this.addBounceRequest = function(channelname, callbackfx){
		console.log('adding new bounce');
		br = new BounceRequest(channelname, callbackfx, this);
		//console.log(channelname);
		//console.log(br);
		this.bounceRequests[channelname] = br;
		console.log('added bounce');
		return this.bounceRequests[channelname].request
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

socket.on('message', function(data){
	console.log(data);
});


/*socket.on('serialstatus', function(data){
	console.log(data);
});*/

socket.on('disconnect', function(){
	console.log('disconnect');
});

module.exports = messenger;