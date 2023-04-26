const { join } = require('path');
const fs = require('fs-extra');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const { externals } = JSON.parse(fs.readFileSync('./build.json', 'utf8'));

module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.resolve.plugin('tsconfigpaths').use(TsconfigPathsPlugin, [
      {
        configFile: './tsconfig.json',
      },
    ]);

    config.merge({
      node: {
        fs: 'empty',
      },
    });

    const hasTsx = fs.existsSync(join(`./demo/index.tsx`));
    config.merge({
      entry: {
        lowcode: hasTsx ? require.resolve(`./demo/index.tsx`) : require.resolve(`./demo/index.ts`),
        preview: require.resolve(`./demo/preview.tsx`) ,
      },
    });
    config
      .plugin('index')
      .use(HtmlWebpackPlugin, [
        {
          inject: false,
          minify: false,
          templateParameters: {
            version,
          },
          template: require.resolve('./public/index.html'),
          filename: 'index.html',
        },
      ]);
    
    config.externals(externals);

    config
      .plugin('preview')
      .use(HtmlWebpackPlugin, [
        {
          inject: false,
          templateParameters: {
          },
          template: require.resolve('./public/preview.html'),
          filename: 'preview.html',
        },
      ]);

    // config.plugin('analyzer').use(BundleAnalyzerPlugin);

    config.plugins.delete('hot');
    config.devServer.hot(false);

    config.module // fixes https://github.com/graphql/graphql-js/issues/1272
      .rule('mjs$')
      .test(/\.mjs$/)
      .include
        .add(/node_modules/)
        .end()
      .type('javascript/auto');
  });
};
