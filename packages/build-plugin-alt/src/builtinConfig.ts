import setAssetsPath from './setAssetsPath';
import WebpackChain from 'webpack-chain';

export default (config: WebpackChain) => {
  setAssetsPath(config, { js: 'js', css: 'css' });
  config.merge({
    devServer: {
      logLevel: 'silent',
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    },
  });
  config.plugins.delete('hot');
  config.devServer.hot(false);
  config.output.library('BuiltInComp');
  config.output.libraryTarget('umd');
  config.plugins.delete('HtmlWebpackPlugin');
};