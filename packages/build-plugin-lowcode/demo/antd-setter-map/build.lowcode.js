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
        setterMap: {
          InputSetter: '../src/setters/InputSetter',
        },
        npmClient: 'cnpm',
        staticResources: {
          antdJsUrl: 'https://g.alicdn.com/code/lib/antd/4.20.0/antd.min.js',
          antdCssUrl: 'https://g.alicdn.com/code/lib/antd/4.20.0/antd.min.css'
        }
      },
    ],
  ],
};
