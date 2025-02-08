const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    about: './src/pages/about/client.js',
    home: './src/pages/home/client.js',
    'shogi-test': './src/pages/shogi-test/client.js'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',  // [name]はentryのキーに置き換わる
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: 'public' }
      ],
    }),
  ],
}; 