const webpack = require('webpack');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const autoprefixer = require('autoprefixer');
const path = require('path');
const fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];
const { name } = require('./package.json');

module.exports = (env = {}) => {

    const options = {
        entry: {
            script: path.join(__dirname, 'src', 'index.js')
        },
        output: {
            path: path.join(__dirname, 'dist'),
            filename: '[name].bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
                    exclude: /node_modules/
                },             
                {
                    test: /\.js$/,
                    use: ['babel-loader?cacheDirectory'],
                    exclude: /node_modules/
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-inline-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.csv$/,
                    loader: 'csv-loader',
                    options: {
                        dynamicTyping: true,
                        header: true,
                        skipEmptyLines: true
                    }
                },
                {
                    test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
                    loader: 'file-loader?name=[name].[ext]',
                    exclude: /node_modules/
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    exclude: /node_modules/
                }
            ]
        },
        plugins: [
            new webpack.LoaderOptionsPlugin({
                options: {
                    postcss: [
                        autoprefixer()
                    ]
                }
            }),
            new CleanWebpackPlugin(['dist']),
            new HtmlWebpackPlugin({
                template: path.join(__dirname, 'src', 'index.html'),
                filename: 'index.html',
                chunks: ['script']
            }),
            new HtmlReplaceWebpackPlugin([{
                pattern: '@@title',
                replacement: name || 'javel'
            }]),
            new WriteFilePlugin({
                log: false
            }),
            new CopyWebpackPlugin([{
                from: './assets',
                to: 'assets'
            }])
        ]
    };

    if (env.dev || env.serve) {
        options.plugins.unshift(new webpack.HotModuleReplacementPlugin());
        options.devtool = 'cheap-module-source-map';
    }
    
    return options;

};