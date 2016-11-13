var socket = require('socket.io-client')('http://localhost:2999');

function ComsChannels(messenger, settings){
    this.messenger = messenger;
    this.channelname = settings.name;
    this.settings = settings;

    this.connect = function(data){
        if('initial' in settings){
            initialMessage = settings.initial(data);
            this.messenger.emit(initialMessage);
        }
        this.messenger.socket_ref.on(this.channelname, function(data){
            console.log('Got a message from: '+this.channelname);
            this.settings.onrecieve(data);
        }.bind(this));
    };

    this.send = function(data){
        console.log('Sending to: '+this.channelname);
        sendData = this.settings.send(data);
        this.messenger.emit(this.channelname,sendData);
    };

    this.requestData = function(data){
        console.log('Requesting: '+this.channelname);
        this.messenger.emit(this.channelname, '');
    }
}

function Messenger(socket_ref){
    this.socketLoaded = false;
    this.socket_ref = socket_ref;
    this.channels = {};

    this.emit = function(channel, jsonmsg){
        if(this.socketLoaded){
            console.log('socket emitting: '+channel.toString());
            this.socket_ref.emit(channel,jsonmsg);
        }else{
            console.log('socket not loaded yet');
        }
    };

    this.addChannel= function(settings){
        comsChannel = new ComsChannels(this, settings);
        this.channels[settings.name] = comsChannel;
        return comsChannel;
    }

}

messenger = new Messenger(socket);

messages = messenger.addChannel({
    name: 'message',
    send: function (data) {
        return data;
    },
    onrecieve: function (data) {
        console.log(data);
    }
});

serial = messenger.addChannel({
    name: 'serialstatus',
    onrecieve: function(data){
        console.log(data);
        //document.getElementById('serialports').innerHTML = data;
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
        //getLocation(data);
    }
});

socket.on('connect', function(){
    console.log('connected');
    messenger.socketLoaded = true;
    console.log(messenger.channels);
    messenger.channels['message'].connect();
    messenger.channels['message'].send('getting you loud and clear');
    messenger.channels['serialstatus'].connect();
    messenger.channels['serialstatus'].requestData();
    messenger.channels['gpstrack'].connect('COM7');
    messenger.channels['gpstrack'].requestData();
}.bind(this));

socket.on('disconnect', function(){
    console.log('disconnect');
});

//module.exports = messenger;