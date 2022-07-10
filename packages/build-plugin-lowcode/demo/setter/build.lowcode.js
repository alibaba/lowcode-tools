const package = require('./package.json');

module.exports = {
  alias: {
    '@': './src/components',
  },
  plugins: [
    [
      '../../src/index.js',
      {
        engineScope: '@alilc',
        extraAssets: [
          'https://unpkg.com/@alilc/lowcode-materials@1.0.3/build/lowcode/assets-prod.json'
        ],
        type: 'setter',
        setterName: 'SelectSetter',
        npmClient: 'cnpm',
        noParse: true
      },
    ],
  ],
};
