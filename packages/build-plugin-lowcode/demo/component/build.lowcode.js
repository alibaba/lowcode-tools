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
          'https://alifd.alicdn.com/npm/@alilc/lowcode-materials@1.0.3/dist/assets.json'
        ],
        setterMap: {
          TestSetter: '@alilc/magic-editor-setter@1.0.0'
        },
        npmClient: 'cnpm'
      },
    ],
  ],
  chainWebpack(config, taskName) {
    
  }
};
