import * as React from 'react';
import { plugins, setters } from '@alilc/lowcode-engine';
import { IPublicModelPluginContext, IPublicEnumPluginRegisterLevel, IPublicTypePlugin } from '@alilc/lowcode-types';
import { getInjectedResource, injectAssets, needInject, injectComponents, filterPackages, setInjectServerHost } from './utils';
import { Notification } from '@alifd/next';
import { AppInject } from './appInject';

let injectedPluginConfigMap = null;
let injectedPlugins = [];

export async function getInjectedPlugin(name: string, ctx: IPublicModelPluginContext) {
  if (!injectedPluginConfigMap) {
    injectedPluginConfigMap = {};
    injectedPlugins = await getInjectedResource('plugin');
    if (injectedPlugins && injectedPlugins.length > 0) {
      injectedPlugins.forEach((item: any) => {
        let pluginName = item.module?.pluginName;
        if (!pluginName) {
          const config = item.module(ctx);
          pluginName = config?.name;
        }
        injectedPluginConfigMap[pluginName] = item.module;
      });
    }
  }
  if (name === undefined) return undefined;
  return injectedPluginConfigMap[name];
}

interface IOptions {
  injectServerHost?: string;
}

const Inject = (ctx: IPublicModelPluginContext, options: IOptions = {}) => {
  if (!needInject) {
    return {
      init() {}
    }
  }

  if (ctx.registerLevel === IPublicEnumPluginRegisterLevel.Workspace) {
    return AppInject(ctx, options);
  }

  if (options?.injectServerHost) {
    setInjectServerHost(options.injectServerHost);
  }

  // inject 已有的设计器插件
  // 覆盖后续的插件注册逻辑，所有只有本插件后面注册的插件才可以支持 inject 逻辑
  const originalRegister = plugins.register;
  plugins.register = async function (plugin: IPublicTypePlugin, pluginOptions: any, options: any) {
    let pluginName = plugin.pluginName;
    if (!pluginName) {
      const pluginConfig = plugin(ctx, pluginOptions);
      // 兼容逻辑
      pluginName = (pluginConfig as any).name;
    }
    const injectedSameNamePlugin = await getInjectedPlugin(pluginName, ctx);
    if (injectedSameNamePlugin) {
      injectedPluginConfigMap[pluginName] = null;
      return originalRegister.call(this, injectedSameNamePlugin, pluginOptions, options);
    } else {
      return originalRegister.call(this, plugin, pluginOptions, options);
    }
  }

  return {
    // 插件名，注册环境下唯一
    name: 'LowcodePluginInjectAlt',
    // 依赖的插件（插件名数组）
    dep: [],
    // 插件的初始化函数，在引擎初始化之后会立刻调用
    async init() {

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

