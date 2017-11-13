const path = require('path');

module.exports = {
  entry: './public/src/clientGame.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public', 'dist')
  },
  module: {
    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
    }]
  }
};