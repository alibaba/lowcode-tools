import * as React from 'react';
import {
  plugins,
  skeleton,
} from '@alilc/lowcode-engine';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import Logo from '../../builtIn/logo';
import UndoRedo from '@alilc/lowcode-plugin-undo-redo';
import ComponentsPane from '@alilc/lowcode-plugin-components-pane';
import ZhEn from '@alilc/lowcode-plugin-zh-en';
import SchemaPlugin from '@alilc/lowcode-plugin-schema';
import CodeEditor from "@alilc/lowcode-plugin-code-editor";
import { getPageSchema, saveSchema, resetSchema, preview } from './utils';
import assets from '../../public/assets.json';

;
export default async ({ type, demoPlugin = undefined }) => {

  const registerPlugin = async (plugin) => {
    // 避免要调试的插件被二次注册
    if (demoPlugin?.pluginName && plugin.pluginName === demoPlugin?.pluginName) {
      return;
    }
    await plugins.register(plugin);
  }
  // plugin API 见 https://lowcode-engine.cn/site/docs/api/plugins
  await registerPlugin(SchemaPlugin);
  await registerPlugin(CodeEditor);

  const editorInit = (ctx: IPublicModelPluginContext) => {

    return {
      name: 'editor-init',
      async init() {

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
            category: '调试用',
            group: '调试用',
            title: COMP_TITLE,
            icon: "https://img.alicdn.com/imgextra/i1/O1CN01m4IZ481VKPwFFbDhP_!!6000000002634-2-tps-112-112.png",
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
            snippets: [
              {
                title: "调试用内置组件",
                screenshot: "https://img.alicdn.com/imgextra/i1/O1CN01m4IZ481VKPwFFbDhP_!!6000000002634-2-tps-112-112.png",
                schema: {
                  componentName: COMP_NAME,
                  props: {
                  }
                }
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
        }

        // 设置物料描述
        const { material, project } = ctx;
        material.setAssets(assets as any);

        const schema = await getPageSchema(type);

        // 加载 schema
        project.openDocument(schema);
      },
    };
  };
  editorInit.pluginName = 'editorInit';

  await registerPlugin(editorInit);

  const builtinPluginRegistry = (ctx: IPublicModelPluginContext) => {
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
      },
    };
  }
  builtinPluginRegistry.pluginName = 'builtinPluginRegistry';

  await registerPlugin(builtinPluginRegistry);

  // 注册回退/前进
  await registerPlugin(UndoRedo);
  // 注册中英文切换
  await registerPlugin(ZhEn);

    // 注册保存面板
    const saveSample = (ctx: IPublicModelPluginContext) => {
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
    await registerPlugin(saveSample);
}
