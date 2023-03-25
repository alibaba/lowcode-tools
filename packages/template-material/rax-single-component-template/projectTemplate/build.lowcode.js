const { library } = require('./build.json');

module.exports = {
  alias: {
    '@': './src',
  },
  plugins: [
    [
      '@alifd/build-plugin-lowcode',
      {
        library,
        baseLibrary: 'rax',
        engineScope: "<%= arguments[0].engineScope || '@ali' %>"
      }
    ],
  ],
};
