import io from 'socket.io-client';

const socket = io('http://localhost:2999');

class Messenger{
    constructor(socket_ref) {
        this.socketLoaded = false;
        this.socket_ref = socket_ref;
        this.channels = {};
    }

    emit(channel, jsonmsg){
        if(this.socketLoaded){
            console.log('socket emitting: ' + channel.toString());
            this.socket_ref.emit(channel, jsonmsg, channel.callback);
        }else{
            console.log('socket not loaded yet');
        }
    };

    addChannel(settings){
        const comsChannel = new ComsChannels(this, settings);
        this.channels[settings.name] = comsChannel;
        return comsChannel;
    }
}

class ComsChannelSettings{
    constructor(settingDict){
        this.name = settingDict.name;
    }
}

class ComsChannels{
    constructor(messenger, settings){
        this.messenger = messenger;
        this.settings = settings;
        this.channelname = settings.name;
        this.callback = function(error, message){
            // this means the server got the call
            console.log(error);
            console.log(message);
        };
    }

	connect(data = false){
		if (data){
			const initialJSONMessage = this.settings.onconnect(data);
			this.messenger.emit(initialJSONMessage);
		}
		this.messenger.socket_ref.on(this.channelname, function(data){
			console.log('Got a message from: '+this.channelname);
			this.settings.onrecieve(data);
		}.bind(this));
	};

	send(JSONData){
		console.log('Sending to: '+this.channelname);
		console.log(JSONData);
		this.messenger.emit(JSONData);
	};

	requestData(data){
		console.log('Requesting: '+this.channelname);
		this.messenger.emit('');
	}
}

let messenger = new Messenger(socket);
const messageChannel = messenger.addChannel({
	name: 'message',
	onrecieve: function (data) {
		console.log(data);
	}
});

export default messenger;

socket.on('connect', function(){
	//document.getElementById('header').style.backgroundColor = 'green';
	console.log('connected');
	messenger.socketLoaded = true;
	console.log(messenger.channels);
	messageChannel.connect();
	messageChannel.send('getting you loud and clear');
}.bind(this));

socket.on('disconnect', function(){
    //document.getElementById('header').style.backgroundColor = 'transparent';
	console.log('disconnected');
});
