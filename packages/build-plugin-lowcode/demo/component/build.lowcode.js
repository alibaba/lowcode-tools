const package = require('./package.json');

module.exports = {
  alias: {
    '@': './src/components',
  },
  plugins: [
    [
      '../../src/index.js',
      {
        engineScope: '@alilc'
      },
    ],
  ],
};
