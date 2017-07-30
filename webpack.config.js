const path              = require('path');
const webpack           = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const src  = path.join(__dirname, 'src');
const dist = path.join(__dirname, 'dist');

module.exports = {
    context: src,

    entry: [
        "babel-polyfill",
        "main.js"
    ],

    output: {
        path: dist,
        filename: '[name].js',
    },

    resolve: {
        extensions: ['.js'],
        modules: [
            src,
            'node_modules'
        ],
    },

    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: ({ resource }) => {
                return /node_modules/.test(resource) && !(/\.css/.test(resource));
            },
        }),
        new ExtractTextPlugin({
            filename: 'styles.css',
            allChunks: true
        }),
    ],

    module: {
        rules: [
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader'
            },

            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            },

            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
};


