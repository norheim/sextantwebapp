/**
 * Created by johan on 2/20/2017.
 */
import * as _ from 'lodash';
import 'bootstrap-loader';
//import * as messenger from './socket.js';
import {ViewerWrapper} from './cesiumlib';

console.log('creating the wrapper');
const port = (process.env.PORT || 3001);
const host = 'http://localhost';
//const host = 'http://18.189.2.237';
const viewerWrapper = new ViewerWrapper(host, port, 3, 'cesiumContainer');
const viewer = viewerWrapper.viewer;
const camera = viewer.scene.camera;
