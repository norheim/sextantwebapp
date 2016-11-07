var express = require('express');
var path = require('path');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpackHotMiddleware = require("webpack-hot-middleware");
var app = express();

(function() {
  // Step 1: Create & configure a webpack compiler
  var webpack = require('webpack');
  var webpackConfig = require('./webpack.config');
  var compiler = webpack(webpackConfig);

  // Step 2: Attach the dev middleware to the compiler & the server
  app.use(require("webpack-dev-middleware")(compiler, {
    noInfo: true, publicPath: webpackConfig.output.publicPath
  }));

  // Step 3: Attach the hot middleware to the compiler & the server
  app.use(require("webpack-hot-middleware")(compiler, {
    log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
  }));
})();

// Serve static files from the public folder
var publicPath = path.resolve(__dirname, 'public');
/*var cesiumPathWidgets = path.resolve(__dirname, 'node_modules', 'cesium', 
  'Source', 'Widgets');
var cesiumPathAssets = path.resolve(__dirname, 'node_modules', 'cesium', 
  'Source', 'Assets');
var cesiumPathWorkers = path.resolve(__dirname, 'node_modules', 'cesium', 
  'Source', 'Workers');
var cesiumPathCore = path.resolve(__dirname, 'node_modules', 'cesium', 
  'Source', 'Core');*/

app.use(express.static(publicPath));
/*app.use('/Widgets', express.static(cesiumPathWidgets));
app.use('/Assets', express.static(cesiumPathAssets));
app.use('/Workers/Core', express.static(cesiumPathCore));
app.use('/Workers', express.static(cesiumPathWorkers));*/

//require("!style!css!./style.css");

app.get('/Widget', function (req, res) {
 res.send('Hello world');
});

app.listen(3001, function () {
  console.log('Example app listening on port 3001');
})