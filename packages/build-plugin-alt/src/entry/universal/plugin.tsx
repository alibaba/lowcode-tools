import * as React from 'react';
import {
  ILowCodePluginContext,
  plugins,
  skeleton,
} from '@alilc/lowcode-engine';
import Logo from '../../builtIn/logo';
import UndoRedo from '@alilc/lowcode-plugin-undo-redo';
import ComponentsPane from '@alilc/lowcode-plugin-components-pane';
import ZhEn from '@alilc/lowcode-plugin-zh-en';
import SchemaPlugin from '@alilc/lowcode-plugin-schema';
import CodeEditor from "@alilc/lowcode-plugin-code-editor";
import { getPageSchema, saveSchema, resetSchema, preview } from './utils';


export default async ({ type }) => {
  // plugin API 见 https://yuque.antfin.com/ali-lowcode/docs/cdukce
  (SchemaPlugin as any).pluginName = 'SchemaPlugin';
  await plugins.register(SchemaPlugin);
  (CodeEditor as any).pluginName = 'CodeEditor';
  await plugins.register(CodeEditor);

  const editorInit = (ctx: ILowCodePluginContext) => {

    return {
      name: 'editor-init',
      async init() {
        const assets = await (
          await fetch(
            `https://dailyfusion.alicdn.com/assets-daily/@alife/mc-assets-2485@0.1.94/assets.json?t=${Date.now()}`
          )
        ).json();

        if (type === 'setter') {
          const COMP_NAME = "BuiltInComp";
          const COMP_VERSION = '1.0.0';
          const COMP_TITLE = '内置调试组件';
          const COMP_PACKAGE = 'setter-plugin-builtin-component';

          (assets as any).packages.push({
            package: COMP_PACKAGE,
            version: COMP_VERSION,
            urls: [
              `/js/component.js`,
              `/css/component.css`
            ],
            library: COMP_NAME
          });

          (assets as any).components.unshift({
            componentName: COMP_NAME,
            title: COMP_TITLE,
            icon: "https://img.alicdn.com/tfs/TB1rT0gPQL0gK0jSZFAXXcA9pXa-200-200.svg",
            docUrl: "",
            screenshot: "",
            npm: {
              package: COMP_PACKAGE,
              version: COMP_VERSION
            },
            props: [
              {
                name: "custom",
                title: "内容",
                propType: "string"
              }
            ],
            configure: {
              props: {
                isExtends: true,
                override: [
                  {
                    name: "custom",
                    title: "",
                    setter: "DemoSetter"
                  }
                ]
              }
            }
          });

          (assets as any).componentList.unshift({
            title: '内置',
            children: [
              {
                componentName: COMP_NAME,
                title: COMP_TITLE,
                snippets: [
                  {
                    title: "主要",
                    screenshot: "https://alifd.oss-cn-hangzhou.aliyuncs.com/fusion-cool/icons/icon-light/ic_light_button.png",
                    schema: {
                      componentName: COMP_NAME,
                      props: {
                      }
                    }
                  }
                ]
              },
            ]
          })
        }

        // 设置物料描述
        const { material, project } = ctx;
        material.setAssets(assets);

        const schema = await getPageSchema();

        // 加载 schema
        project.openDocument(schema);
      },
    };
  };
  editorInit.pluginName= 'editorInit';

  await plugins.register(editorInit);

  const builtinPluginRegistry = (ctx: ILowCodePluginContext) => {
    return {
      name: 'builtin-plugin-registry',
      async init() {
        // 注册 logo 面板
        skeleton.add({
          area: 'topArea',
          type: 'Widget',
          name: 'logo',
          content: Logo,
          contentProps: {
            logo:
              'https://img.alicdn.com/tfs/TB1_SocGkT2gK0jSZFkXXcIQFXa-66-66.png',
            href: '/',
          },
          props: {
            align: 'left',
            width: 100,
          },
        });

        // 注册回退/前进
        skeleton.add({
          area: 'topArea',
          type: 'Widget',
          name: 'undoRedo',
          content: UndoRedo,
          props: {
            align: 'right',
            width: 88,
          },
        });

        // 注册组件面板
        skeleton.add({
          area: 'leftArea',
          type: 'PanelDock',
          name: 'componentsPane',
          content: ComponentsPane,
          contentProps: {},
          props: {
            align: 'top',
            icon: 'zujianku',
            description: '组件库',
          },
        });

        // 注册中英文面板
        skeleton.add({
          area: 'leftArea',
          type: 'Widget',
          name: 'zhEn',
          content: ZhEn,
          contentProps: {},
          props: {
            align: 'bottom',
          },
        });

      },
    };
  }
  builtinPluginRegistry.pluginName = 'builtinPluginRegistry';

  await plugins.register(builtinPluginRegistry);

  // 将新版本setter覆盖内置引擎setter (新版本部分setter处于内测状态，如果有问题可以将该插件注册移除，或者联系@度城)
  const setterRegistry = (ctx: ILowCodePluginContext) => {
    const { setterMap, pluginMap } = window.AliLowCodeEngineExt;
    return {
      name: 'ext-setters-registry',
      async init() {
        // 注册setterMap
        window.AliLowCodeEngine.setters.registerSetter(setterMap);
        // 注册插件
        // 注册事件绑定面板
        window.AliLowCodeEngine.skeleton.add({
          area: 'centerArea',
          type: 'Widget',
          content: pluginMap.EventBindDialog,
          name: 'eventBindDialog',
          props: {},
        });

        // 注册变量绑定面板
        skeleton.add({
          area: 'centerArea',
          type: 'Widget',
          content: pluginMap.VariableBindDialog,
          name: 'variableBindDialog',
          props: {},
        });
      }
    }
  }
  setterRegistry.pluginName = 'setterRegistry';
  await plugins.register(setterRegistry);

  // 注册保存面板
  const saveSample = (ctx: ILowCodePluginContext) => {
    return {
      name: 'saveSample',
      async init() {
        ctx.skeleton.add({
          name: 'saveSample',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
          },
          content: <button
            className='save-sample'
            onClick={saveSchema}
          >保存到本地</button>
        });
        ctx.skeleton.add({
          name: 'resetSchema',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
          },
          content: <button
            className='save-sample'
            onClick={resetSchema}
          >重置页面</button>
        });
        ctx.hotkey.bind('command+s', (e) => {
          e.preventDefault();
          saveSchema();
        });
      },
    };
  }
  saveSample.pluginName = 'saveSample';
  await plugins.register(saveSample);

  const previewSample = (ctx: ILowCodePluginContext) => {
    return {
      name: 'previewSample',
      async init() {
        ctx.skeleton.add({
          name: 'previewSample',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
          },
          content: <button
            className='save-sample'
            onClick={preview}
          >预览</button>,
        });
      },
    };
  }

  previewSample.pluginName = 'previewSample';

  await plugins.register(previewSample);
}

