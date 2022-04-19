import setAssetsPath from './setAssetsPath';
import WebpackChain from 'webpack-chain';
import * as path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import * as webpack from 'webpack';
import isWsl from 'is-wsl';


export default (config: WebpackChain, { pkg }) => {
  setAssetsPath(config, { js: 'js', css: 'css' });
  config.merge({
    devServer: {
      contentBase: path.join(__dirname, './public'),
      logLevel: 'silent',
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    },
  });
  if (isWsl) {
    config.merge({
      devServer: {
        watchOptions: {
          poll: 1000,
        }
      }
    })
  }
  config
    .plugin('index')
    .use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
        },
        template: path.join(__dirname, './public/index.html'),
        filename: 'index.html',
      },
    ]);
  config
    .plugin('preview')
    .use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
        },
        template: path.join(__dirname, './public/preview.html'),
        filename: 'preview.html',
      },
    ]);

  config.plugins.delete('hot');
  config.devServer.hot(false).disableHostCheck(true);
  config.plugin('define').use(webpack.DefinePlugin, [{ PACKAGE_NAME: JSON.stringify(pkg.name) }]);
};