import WebpackChain from 'webpack-chain';
import { PluginContext } from 'build-scripts/lib';
import * as path from 'path';

interface IOptions extends Partial<PluginContext> {
  type: string;
}

export default (config: WebpackChain, { pkg, type }: IOptions) => {
  config.entryPoints.clear();
  config.merge({
    entry: {
      utils: path.join(__dirname, 'entry.js'),
    },
  });
  config.output.library('__injectComponent');
  config.output.libraryTarget('jsonp');
  config.devServer.host('0.0.0.0');
  config.plugin('define').tap((args) => {
   return [{
        ...args[0],
        __altUtilsName: JSON.stringify(`__lowcode-${type}-demo__`),
        __bundleType: JSON.stringify(type === 'plugin' ? 'designerPlugin' : 'setter'),
        name: JSON.stringify(pkg.name),
   }]
  });
}