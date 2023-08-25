import { IPublicModelPluginContext, IPublicEnumPluginRegisterLevel } from '@alilc/lowcode-types';
import { getInjectedResource, injectAssets } from './utils';
import Icon from './icon';
import { Pane } from './pane';
import React from 'react';
import { InjectConfig } from './controller';

const injectConfig = new InjectConfig();

let injectedPluginConfigMap = null;
let injectedPlugins = [];

export async function getInjectedPlugin(name: string, ctx: IPublicModelPluginContext) {
  if (!injectedPluginConfigMap) {
    injectedPluginConfigMap = {};
    injectedPlugins = await getInjectedResource('plugin');
    if (injectedPlugins && injectedPlugins.length > 0) {
      injectedPlugins.forEach((item: any) => {
        const config = item.module(ctx);
        injectedPluginConfigMap[config.name || item.module.pluginName] = item.module;
      });
    }
  }
  return injectedPluginConfigMap[name];
}

export function AppInject(ctx: IPublicModelPluginContext, options: any) {

  const { workspace } = ctx;

  const getInjectPlugin = async (plugin: any, pluginOptions: any, ctx?: IPublicModelPluginContext) => {
    let pluginName = plugin.pluginName;
    if (!pluginName) {
      const pluginConfig = plugin(ctx, pluginOptions);
      pluginName = pluginConfig.name;
    }

    const injectedSameNamePlugin = await getInjectedPlugin(pluginName, ctx);
    const resourceName  = ctx.editorWindow?.resource?.name;
    const viewName = (ctx?.editorWindow?.currentEditorView as any)?.viewName;
    const isGlobal = ctx?.registerLevel === IPublicEnumPluginRegisterLevel.Workspace;
    if (!injectedSameNamePlugin) {
      return plugin;
    }

    if (isGlobal) {
      if (injectConfig.has(pluginName, 'global')) {
        return injectConfig.get(pluginName, 'global') ? injectedSameNamePlugin : plugin;
      }

      injectConfig.set(pluginName, 'global', undefined, true)
      return injectedSameNamePlugin;
    }

    if (!viewName || !resourceName) {
      return injectedSameNamePlugin;
    }

    if (injectConfig.has(pluginName, resourceName, viewName)) {
      return injectConfig.get(pluginName, resourceName, viewName) ? injectedSameNamePlugin : plugin;
    }

    injectConfig.set(pluginName, resourceName, viewName, true);

    return injectedSameNamePlugin;
  }

  ctx.config.set('customPluginTransducer', async (originPlugin: any, ctx: IPublicModelPluginContext, options) => {
    const injectedSameNamePlugin = await getInjectPlugin(originPlugin, options, ctx);
    return injectedSameNamePlugin;
  });

  return {
    // 插件名，注册环境下唯一
    name: 'LowcodePluginInjectAlt',
    // 依赖的插件（插件名数组）
    dep: [],

    async init() {
      const subPluginName = '___injectPlugins___';

      const subPlugin =  (ctx: IPublicModelPluginContext) => {
        injectAssets(ctx)
        return {
          async init() {
          }
        }
      }

      subPlugin.pluginName = subPluginName;
      subPlugin.meta = {
        dependencies: [],
        engines: {
          lowcodeEngine: '^1.0.0', // 插件需要配合 ^1.0.0 的引擎才可运行
        },
      };

      workspace.onChangeActiveWindow(async () => {
        for (const pluginName in injectedPluginConfigMap) {
          const injectedSameNamePlugin = await getInjectedPlugin(pluginName, ctx);
          if (!injectedSameNamePlugin) {
            continue;
          }

          const resourceName  = workspace.window?.resource?.name;
          const currentEditorView = workspace.window?.currentEditorView;
          const viewName = (currentEditorView as any)?.viewName;
          if (injectConfig.get(pluginName, resourceName, viewName) && !currentEditorView?.plugins.has(pluginName)) {
            await currentEditorView?.plugins.register(injectedPluginConfigMap[pluginName], {
              autoInit: true,
            });
          }

          if (injectConfig.get(pluginName, 'global') && !workspace.plugins.has(pluginName)) {
            await workspace.plugins.register(injectedPluginConfigMap[pluginName], {
              autoInit: true,
            });
          }
        }

        if (workspace.window?.currentEditorView && !workspace.window?.currentEditorView.plugins?.has(subPlugin.pluginName)) {
          await workspace.window?.currentEditorView.plugins.register(subPlugin)
        }
      });

      await getInjectedPlugin(undefined, ctx);

      ctx.skeleton.add({
        area: 'leftArea',
        name: 'inject-pane',
        type: 'PanelDock',
        props: {
          icon: <Icon />,
          description: '调试',
          className: 'inject-pane-icon',
        },
        index: 2,
        panelProps: {
          width: '600px',
          canSetFixed: false,
        },
        content: (props) => {
          return <Pane {...props} injectConfig={injectConfig} />
        },
        contentProps: {
          pluginContext: ctx,
          injectConfig,
          injectedPluginConfigMap,
          getInjectInfo: async () => {
            const injectedSetters = await getInjectedResource('vs');
            return {
              injectedSetters,
            }
          },
          updateInjectConfig: (pluginName: string, resourceName: string, viewName: string, check: boolean) => {
            injectConfig.set(pluginName, resourceName, viewName, check)
            injectConfig.save()
          }
        },
      });
    }
  }

}