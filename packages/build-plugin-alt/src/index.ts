import type { IPlugin } from 'build-scripts';
import { getWebpackConfig } from 'build-scripts-config';
import WebpackChain from 'webpack-chain';
import * as path from 'path';
import babelCompiler from 'build-plugin-component/src/compiler/babel';
import openBrowser from 'react-dev-utils/openBrowser';
import baseConfig from './baseConfig';
import devConfig from './devConfig';
import builtinConfig from './builtinConfig';
import injectConfig from './inject/config';
import makeInjectInfo from './inject/makeInjectInfo';
import injectApis from './inject/apis';

interface IOpitons {
  type: 'setter' | 'plugin' | 'component';
  inject: boolean;
  openUrl: string;
  generateMeta: boolean;
}

const plugin: IPlugin = ({ context, registerTask, onGetWebpackConfig, onHook, log }, options) => {
  const { type, inject, openUrl, generateMeta = false } = options as unknown as IOpitons;
  const { command, rootDir, userConfig, pkg } = context;
  if (command === 'start') {
    if (type !== 'component') {
      const webpackConfig = getWebpackConfig('development') as WebpackChain;
      const taskName = `lowcode-${type}-demo`;
      registerTask(taskName, webpackConfig);
      onGetWebpackConfig(taskName, config => {
        baseConfig(config, {
          rootDir,
          type,
          entry: {
            index: path.join(__dirname, `./entry/${type}.js`),
            preview: path.join(__dirname, './entry/preview.js'),
          }
        });
        devConfig(config, { pkg });
        if (inject) {
          injectConfig(config, { rootDir, pkg, type })
        }
      });

      if (type === 'setter') {
        const builtInTaskName = `lowcode-${type}-builtin`;
        const builtInWebpackConfig = getWebpackConfig('development') as WebpackChain;

        registerTask(builtInTaskName, builtInWebpackConfig);
        onGetWebpackConfig(builtInTaskName, (config: WebpackChain) => {
          baseConfig(config, {
            rootDir,
            type,
            entry: {
              component: path.join(__dirname, './builtIn/component.js'),
            }
          });
          builtinConfig(config);
        });
      }
      onHook('after.start.devServer', ({ url }) => {
        if (inject && openUrl) {
          openBrowser(openUrl);
        } else {
          openBrowser(openUrl || url);
        }
      })
    } else {
      onGetWebpackConfig('lowcode-dev', (config) => {
        // console.log(config.toConfig());
      })
    }
    onHook('before.start.load', ({ args }) => {
      if (inject) {
        makeInjectInfo({ pkg, port: args.port, type });
        injectApis();
      }
    });

  } else if (command === 'build' && type !== 'component') {
    const { basicComponents = [] } = userConfig;
    onHook('before.build.load', () => {
      const babelPlugins = [];
      if (type === 'plugin' && generateMeta && pkg.lcMeta) {
        const mainFile = path.join(rootDir, 'src', `${(pkg.main as string).replace(/lib\/(.*).js/, "$1")}.tsx`);
        babelPlugins.push([require.resolve('./babelPluginMeta'), {
          filename: mainFile,
          meta: pkg.lcMeta,
        }])
      }
      babelCompiler(context, {
        log,
        type: 'react',
        userOptions: {
          basicComponents,
          babelPlugins,
        }
      });
    })
  }
};

export default plugin;
