import type { IPlugin } from 'build-scripts';
import { getWebpackConfig } from 'build-scripts-config';
import WebpackChain from 'webpack-chain';
import * as path from 'path';
import babelCompiler from 'build-plugin-component/src/compiler/babel';
import openBrowser from 'react-dev-utils/openBrowser';
import { existsSync } from 'fs-extra';
import baseConfig from './baseConfig';
import devConfig from './devConfig';
import builtinConfig from './builtinConfig';
import injectConfig from './inject/config';
import makeInjectInfo from './inject/makeInjectInfo';
import injectApis from './inject/apis';
import dropMinicss from './utils/dropMinicss';
import { getIp } from './utils/getIp';

interface IOpitons {
  type: 'setter' | 'plugin' | 'component';
  inject: boolean;
  openUrl: string;
  generateMeta: boolean;
  library: string;
  usePrivateIp: boolean;
}

const plugin: IPlugin = ({ context, registerTask, onGetWebpackConfig, onHook, log }, options) => {
  const { type, inject, openUrl, generateMeta = true, library, usePrivateIp } = options as unknown as IOpitons;
  const { command, rootDir, userConfig, pkg } = context;
  const mainFilePrefix = path.join(rootDir, 'src', (pkg.main as string).replace(/lib\/(.*).js/, "$1"));
  let mainFile = `${mainFilePrefix}.tsx`;
  if (!existsSync(mainFile)) {
    mainFile = `${mainFilePrefix}.jsx`;
  }
  if (command === 'start') {
    if (type !== 'component') {
      const webpackConfig = getWebpackConfig('development') as WebpackChain;
      const taskName = `lowcode-${type}-demo`;
      registerTask(taskName, webpackConfig);
      onGetWebpackConfig(taskName, config => {
        baseConfig(config, {
          rootDir,
          type,
          pkg,
          mainFile,
          generateMeta,
          entry: {
            index: path.join(__dirname, `./entry/${type}.js`),
            preview: path.join(__dirname, './entry/preview.js'),
          }
        });
        devConfig(config, { pkg });
        if (inject) {
          dropMinicss(config);
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
            mainFile,
            entry: {
              component: path.join(__dirname, './builtIn/component.js'),
            }
          });
          builtinConfig(config);
        });
      }

    } else {
      // onGetWebpackConfig('lowcode-dev', (config) => {
      //   console.log(config.toConfig());
      // })
    }

    onHook('after.start.devServer', ({ url }) => {
      if (inject) {
        if (openUrl) {
          openBrowser(openUrl);
        } else {
          openBrowser('https://lowcode-engine.cn/demo/demo-general/index.html?debug');
        }
      } else {
        openBrowser(openUrl || url);
      }
    })

    onHook('before.start.load', ({ args }) => {
      if (inject) {
        let host = '127.0.0.1';
        if (usePrivateIp) {
          host = getIp();
        }
        console.log(host);
        makeInjectInfo({ pkg, host, port: args.port, type, library });
        injectApis();
      }
    });

  } else if (command === 'build' && type !== 'component') {
    const { basicComponents = [] } = userConfig;
    onHook('before.build.load', () => {
      const babelPlugins = [];
      if (type === 'plugin' && generateMeta && pkg.lcMeta) {
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
