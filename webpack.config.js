var path = require('path');
var webpack = require('webpack');

var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'public', 'build');
var mainPath = path.resolve(__dirname, 'app', 'maps.js');

config = {
    resolve: {
        modules: [
            path.resolve('./node_modules')
        ]
    },
    entry: [
        'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
        mainPath
    ],
    output: {
        path: buildPath,
        publicPath: '/build/',
        filename: 'bundle.js',
        library: 'sextant',
        sourcePrefix: '' // required for cesium
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.ProvidePlugin({
           $: "jquery",
           jQuery: "jquery"
       })
    ],

    module: {
        unknownContextCritical : false,
        loaders: [
            {test: /\.json$/, loader: "json-loader"},
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: [nodeModulesPath],
                query: {
                    plugins: ['transform-runtime'], //Don't know why needed, but recommended
                    presets: ['es2015', 'stage-0', 'react']
                }
            },
            {test: /\.js$/, loader: 'babel', exclude: [nodeModulesPath]},
            {test: /\.css$/, loader: "style!css" },
            {test: /\.(png|gif|jpg|jpeg)$/, loader: "file-loader"},
            {test: /\.(woff2?|svg)$/, loader: 'url?limit=10000' },
            {test: /\.(ttf|eot)$/, loader: 'file' },
            {test: /node_modules/, loader: 'ify'}
        ]
    }
};

module.exports = config;