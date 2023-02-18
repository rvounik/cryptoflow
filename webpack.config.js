
// read env vars from .env file
const Dotenv = require('dotenv-webpack');

// use source maps on development environment
let sourceMapsEnabled = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// use gzipped js files on acceptance and production environments
let gzippedAssets = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'acceptance';

// this allows the use of relative paths (see below)
const path = require('path');

const paths = {
    DIST: path.resolve(__dirname, './web'),
    GLOBAL_CSS: path.resolve(__dirname, './src/css/index.scss'),
    GLOBAL_VARIABLES: path.resolve(__dirname, './src/css/variables/index.scss'),
    CONFIG: path.resolve(__dirname, './config'),
};

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
let cleanOptions = {
    cleanOnceBeforeBuildPatterns: ['**/*', 'js', 'assets', 'css'],
    verbose: false
};

// this is used to extract the css imports from the JS components
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// this is used to copy static assets over to the web folder
const CopyPlugin = require('copy-webpack-plugin');

// HTML output / minifier packages (inject includes in the index.html)
const HtmlWebpackPlugin = require('html-webpack-plugin');

// this allows GZipping js & css assets, requires server config: https://varvy.com/pagespeed/enable-compression.html
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    entry: {
        // each entry point defined here is scanned for imported files, that are matched against the rules defined below
        app: './src/js/App.js',
    },
    output: {
        // here you configure where and how the processed files will be stored, this usually points to a public folder
        // note that webpack will output every imported file it encounters as a .js file, even css! that is a known bug
        path: paths.DIST,
        filename: 'js/[contenthash:8].js',
        sourceMapFilename: '[file].map',
        chunkFilename: 'js/[contenthash:8].js',
        publicPath: '/'
    },
    mode: 'development',
    devtool: sourceMapsEnabled ? 'eval-source-map' : false,
    module: {
        // define rules for each 'import'-ed file webpack encounters, from App.js. if an imported file does not match a rule, webpack will error
        rules: [
            {
                // 1. process every imported .js file (starting from entry point) and split and transpile to the defined presets
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            root: 'config/'
                        }
                    }
                ],
                exclude: path.resolve(__dirname, 'node_modules')
            },
            {
                // 2. Global CSS: process all imported CSS starting at entry, but exclude everything loaded from App.js (parsed by step 3)
                test:  /\.scss$|\.sass$|\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    {
                        loader: 'css-loader',
                        options: {
                            url: false, // do not resolve url() directives in css (they will work once in web)
                            importLoaders: 0, // not required when using sass
                            modules: false, // disable css modules (so global class names wont be mangled)
                            sourceMap: false // disable source maps
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: 'config/postcss.config.js'
                            }
                        }
                    },
                    { loader: 'sass-resources-loader',
                        options: {
                            resources: paths.GLOBAL_VARIABLES
                        }
                    }
                ],
                exclude: path.resolve(__dirname, './src/js/App.js'), // already parsed by step 3
                include: paths.GLOBAL_CSS // should be parsed now
            },
            {
                // 3. CSS Modules: process all imported CSS starting at entry, but exclude global css (already parsed by step 2)
                test:  /\.scss$|\.sass$|\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    {
                        loader: 'css-loader',
                        options: {
                            url: false, // do not resolve url() directives in css (they will work once in web)
                            importLoaders: 0, // not required when using sass
                            modules: true, // enable css modules (so css is linked to the lazy loaded js component)
                            sourceMap: false // disable source maps
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: 'config/postcss.config.js'
                            }
                        }
                    },
                    { loader: 'sass-resources-loader',
                        options: {
                            resources: paths.GLOBAL_VARIABLES
                        }
                    }
                ],
                exclude: paths.GLOBAL_CSS // already parsed by step 2
            }
        ]
    },
    plugins: [
        new Dotenv(),
        new CleanWebpackPlugin(cleanOptions),
        new CopyPlugin({
            patterns: [
                { from: './src/assets', to: './assets' }
            ]
        }),
        new HtmlWebpackPlugin({
            inject: true,
            chunks: ['app'],
            template: 'index.html',
            cacheBuster: new Date().getTime(), // cache buster for other resources than the entry point files
            filename: 'index.html',
            minify: {
                removeComments: true
            }
        }),
        new MiniCssExtractPlugin({
            filename: "css/[contenthash:8].css",
            chunkFilename: "css/[contenthash:8].css"
        }),
        new CompressionPlugin({
            filename: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: gzippedAssets ? 1 : 100000000,
            minRatio: .9,
            deleteOriginalAssets: false
        })
    ],
    resolve: {
        extensions: ['.js', '.scss', '.sass', '.css'] // to be able to import or require 'file' instead of 'file.js'
    },
};
