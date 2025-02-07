require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react']
});
require('ignore-styles');
require('./server'); 