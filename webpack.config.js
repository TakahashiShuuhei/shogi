const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/client.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'client.js',
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