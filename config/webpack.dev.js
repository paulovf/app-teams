var path = require('path');
var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var commonConfig = require('./webpack.common.js');

module.exports = webpackMerge(commonConfig(), {
    output: {
        path: path.resolve('dist'),
        filename: '[name].[hash].js',
        chunkFilename: '[id].chunk.js',
        sourceMapFilename: '[name].[hash].map'
    },

    devServer: {
        https: true,
        host: "2db36868-1f60-4601-a1f5-89e496877724",
        port: 8080,
        historyApiFallback: true,
        stats: 'minimal',
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        },
        outputPath: path.resolve('dist')
    }
});