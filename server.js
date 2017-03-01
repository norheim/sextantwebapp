var express = require('express');
var path = require('path');
var terrainServer = require('./terrainserver');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpackHotMiddleware = require("webpack-hot-middleware");
var app = express();
var port = (process.env.PORT || 3001);

(function() {
  // Step 1: Create & configure a webpack compiler
  var webpack = require('webpack');
  var webpackConfig = require('./webpack.config');
  var compiler = webpack(webpackConfig);

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
var publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// Host terrain tiles
// TODO: move terrain folder in here?
var terrainPath = 'C:\\Users\\johan\\Dropbox (MIT)\\BASALT\\pextant\\pextant\\maps\\terrain';
app = terrainServer(app, terrainPath);

//require("!style!css!./style.css");

app.get('/Widget', function (req, res) {
 res.send('Hello world');
});

app.listen(port, function () {
  console.log('Example app listening on port 3001');
});