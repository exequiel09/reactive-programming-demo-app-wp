const webpack            = require('webpack');
const path               = require('path');
const merge              = require('webpack-merge');
const CopyWebpackPlugin  = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const dist = path.join(__dirname, 'dist');

module.exports = merge(require('./webpack.config'), {
    devtool: 'none',

    output: {
        path: dist,
    },

    plugins: [
        // copy index file to the dist folder
        new CopyWebpackPlugin([
            { from: 'index.html', to: 'index.html' },
        ]),

        // remove first the build folder before building anything
        new CleanWebpackPlugin(['dist'], {
            root: __dirname
        }),
    ]
});


