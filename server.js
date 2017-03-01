const express = require('express');
const path = require('path');
const terrainServer = require('./terrainserver');
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
let app = express();
const port = (process.env.PORT || 3001);

(function() {
  // Step 1: Create & configure a webpack compiler
  const webpack = require('webpack');
  const webpackConfig = require('./webpack.config');
  const compiler = webpack(webpackConfig);

  // Step 2: Attach the dev middleware to the compiler & the server
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true, publicPath: webpackConfig.output.publicPath
  }));

  // Step 3: Attach the hot middleware to the compiler & the server
  app.use(webpackHotMiddleware(compiler, {
    log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
  }));
})();

// Serve static files from the public folder
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

const cesiumPath = path.resolve(__dirname, 'node_modules', 'cesium', 'Build','Cesium');
app.use(express.static(cesiumPath));

// Host terrain tiles
// TODO: move terrain folder in here?
const terrainPath = 'C:\\Users\\johan\\Dropbox (MIT)\\BASALT\\pextant\\pextant\\maps\\terrain';
app = terrainServer(app, terrainPath);

//require("!style!css!./style.css");

app.get('/Widget', function (req, res) {
 res.send('Hello world');
});

app.listen(port, function () {
  console.log('Example app listening on port 3001');
});