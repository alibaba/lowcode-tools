import WebpackChain from 'webpack-chain';
import { PluginContext } from 'build-scripts/lib';
import MomentLocalesPlugin from 'moment-locales-webpack-plugin';
import * as path from 'path';

interface IOptions extends Partial<PluginContext> {
  entry: object;
  type: string;
}

export default (config: WebpackChain, { rootDir, entry, type }: IOptions) => {
  config.target('web');
  config.context(rootDir);
  config.merge({
    entry,
  });
  config.output.filename('[name].js');
  // remove CopyWebpackPlugin (component compile do not have public folder)
  config.plugins.delete('CopyWebpackPlugin');
  config.node.set('fs', 'empty');

  // disable vendor
  config.optimization.splitChunks({ cacheGroups: {} });

  config.plugin('momentLocale').use(MomentLocalesPlugin, [{
    localesToKeep: ['en', 'zh-cn']
  }]);

  // config.resolve.modules
  //   .add(path.join(rootDir, 'node_modules'))
  //   .add('node_modules')
  //   .add(path.join(__dirname, '../node_modules'));

  config.resolve.alias.set(`__lowcode-${type}-demo__`, path.join(rootDir, 'src/index'));

  config.externals({
    "react": "var window.React",
    "react-dom": "var window.ReactDOM",
    "prop-types": "var window.PropTypes",
    "@alifd/next": "var window.Next",
    "@ali/visualengine": "var window.VisualEngine",
    "@ali/visualengine-utils": "var window.VisualEngineUtils",
    "@ali/lowcode-engine": "var window.AliLowCodeEngine",
    "@alilc/lowcode-engine": "var window.AliLowCodeEngine",
    "@ali/lowcode-engine-ext": "var window.AliLowCodeEngineExt",
    "@alilc/lowcode-engine-ext": "var window.AliLowCodeEngineExt",
    "monaco-editor/esm/vs/editor/editor.api": "var window.monaco",
    "monaco-editor/esm/vs/editor/editor.main.js": "var window.monaco",
    "@alilc/lowcode-editor-skeleton": "var window.AliLowCodeEngine.common.skeletonCabin",
    "@alilc/lowcode-editor-core": "var window.AliLowCodeEngine.common.editorCabin",
    "@alilc/lowcode-designer": "var window.AliLowCodeEngine.common.designerCabin",
  });

}