// __BEGIN_LICENSE__
//Copyright (c) 2015, United States Government, as represented by the 
//Administrator of the National Aeronautics and Space Administration. 
//All rights reserved.
//
//The xGDS platform is licensed under the Apache License, Version 2.0 
//(the "License"); you may not use this file except in compliance with the License. 
//You may obtain a copy of the License at 
//http://www.apache.org/licenses/LICENSE-2.0.
//
//Unless required by applicable law or agreed to in writing, software distributed 
//under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR 
//CONDITIONS OF ANY KIND, either express or implied. See the License for the 
//specific language governing permissions and limitations under the License.
// __END_LICENSE__

import 'moment'

class SSE{
    constructor(host){
        this.host = host;
        this.activeChannels = undefined;
        this.lastHeartbeat = undefined;
        this.heartbeat()
    }

    heartbeat(){
        setInterval(this.checkHeartbeat, 11000);
        this.subscribe('heartbeat', this.connectedCallback, 'sse');
    }

    checkHeartbeat() {
        let connected = false;
        if (this.lastHeartbeat !== undefined) {
            const diff = moment.duration(moment().diff(this.lastHeartbeat));
            if (diff.asSeconds() <= 10) {
                connected = true;
            }
        }
        if (!connected) {
            SSE.disconnectedCallback();
        }
    }

    connectedCallback(event){
        try {
            this.lastHeartbeat = moment(JSON.parse(event.data).timestamp);
            const cdiv = $("#connected_div");
            if (cdiv.hasClass('alert-danger')){
                cdiv.removeClass('alert-danger');
                cdiv.addClass('alert-success');
                const c = $("#connected");
                c.removeClass('fa-bolt');
                c.addClass('fa-plug');
            }
        } catch(err){
            // in case there is no such page
        }
    }

    static disconnectedCallback(event){
        try {
            const cdiv = $("#connected_div");
            if (cdiv.hasClass('alert-success')){
                cdiv.removeClass('alert-success');
                cdiv.addClass('alert-danger');
                const c = $("#connected");
                c.addClass('fa-bolt');
                c.removeClass('fa-plug');
            }
        } catch(err){
            // in case there is no such page
        }
    }
    parseEventChannel(event){
        return this.parseChannel(event.target.url);
    }
    static parseChannel(fullUrl){
        const splits = fullUrl.split('=');
        if (splits.length > 1){
            return splits[splits.length-1];
        }
        return 'sse';
    }
    getChannel() {
        // get the active channels over AJAX
        if (this.activeChannels === undefined){
            $.ajax({
                url: '/xgds_core/sseActiveChannels',
                dataType: 'json',
                async: false,
                success: $.proxy(function(data) {
                    this.activeChannels = data;
                }, this)
            });
        }
        return this.activeChannels;
    }

    sourceAddress(channel){
        return this.host + "/sse/stream?channel=" + channel
    }

    subscribe(event_type, callback, channel = undefined) {
        if (channel !== undefined) {
            const address = this.sourceAddress(channel);
            const source = new EventSource(address);
            source.addEventListener(event_type, callback, false);
            return source;
        } else {
            for (let channel of this.getChannels()){
                let source = new EventSource("/sse/stream?channel=" + channel);
                source.addEventListener(event_type, callback, false);
            }
        }
    }
}

export {SSE}