import * as React from 'react';
import { ILowCodePluginContext, plugins, setters } from '@alilc/lowcode-engine';
import { getInjectedResource, injectAssets, needInject, injectComponents, filterPackages } from './utils';
import { Notification } from '@alifd/next';


let injectedPluginConfigMap = null;
let injectedPlugins = [];
let injectServerHost = '127.0.0.1';

export async function getInjectedPlugin(name: string, ctx: ILowCodePluginContext) {
  if (!injectedPluginConfigMap) {
    injectedPluginConfigMap = {};
    injectedPlugins = await getInjectedResource('plugin');
    if (injectedPlugins && injectedPlugins.length > 0) {
      injectedPlugins.forEach((item: any) => {
        const config = item.module(ctx);
        injectedPluginConfigMap[config.name] = item.module;
      });
    }
  }
  return injectedPluginConfigMap[name];
}

export function getInjectServerHost() {
  return injectServerHost;
}

interface IOptions {
  injectServerHost: string;
}

const Inject = (ctx: ILowCodePluginContext, options: IOptions) => {
  console.log('options?.injectServerHost', options?.injectServerHost)
  if (options?.injectServerHost) {
    injectServerHost = options.injectServerHost;
  }
  // inject 已有的设计器插件
  if (needInject) {
    // 覆盖后续的插件注册逻辑，所有只有本插件后面注册的插件才可以支持 inject 逻辑
    const originalRegister = plugins.register;
    plugins.register = async function (plugin: any, pluginOptions: any, options: any) {
      const pluginConfig = plugin(ctx, pluginOptions);
      // return originalRegister.call(this, plugin, pluginOptions, options);
      const injectedSameNamePlugin = await getInjectedPlugin(pluginConfig.name, ctx);
      if (injectedSameNamePlugin) {
        injectedPluginConfigMap[pluginConfig.name] = null;
        return originalRegister.call(this, injectedSameNamePlugin, pluginOptions, options);
      } else {
        return originalRegister.call(this, plugin, pluginOptions, options);
      }
    }
  }
  return {
    // 插件名，注册环境下唯一
    name: 'LowcodePluginInjectAlt',
    // 依赖的插件（插件名数组）
    dep: [],
    // 插件的初始化函数，在引擎初始化之后会立刻调用
    async init() {
      if (!needInject) {
        return;
      }

      // inject 新的设计器插件
      if (injectedPluginConfigMap) {
        // TODO 改为引擎的 onInit 事件
        setTimeout(async () => {
          for (const key in injectedPluginConfigMap) {
            if (injectedPluginConfigMap[key]) {
              // 这里是兼容新旧两种 API，新版只有 creator 和 options 两个入参，但老版有三个
              await plugins.register(injectedPluginConfigMap[key], { autoInit: true }, { autoInit: true });
            }
          }
        });
      }
      const injectedSetters = await getInjectedResource('vs');
      injectedSetters.forEach((item) => {
        setters.registerSetter(item.module.displayName, item.module);
      });
      if (injectedPlugins.length > 0 || injectedSetters.length > 0) {
        Notification.success({
          title: '成功注入以下插件',
          content: (
            <div>
              {injectedPlugins && injectedPlugins.map((item: any) => (
                <p>设计器插件：<b>{item.name}</b></p>
              ))}
              {injectedSetters && injectedSetters.map((item: any) => (
                <p>setter：<b>{item.name}</b></p>
              ))}
            </div>
          )
        })
      }
    },
  };
};

Inject.pluginName = 'LowcodePluginInjectAlt';

export default Inject;
Inject.meta = {
  dependencies: [],
  preferenceDeclaration: {
    title: '注入资源的主机地址',
    properties: [
      {
        key: 'injectServerHost',
        type: 'string',
        description: '注入资源的主机地址',
      },
    ],
  },
};

export {
  injectAssets,
  injectComponents,
  filterPackages,
}

