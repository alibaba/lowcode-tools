import * as React from 'react';
import { ILowCodePluginContext } from '@alilc/lowcode-engine';
import Icon from './icon';

const <%- componentName %> = (ctx: ILowCodePluginContext) => {
  return {
    // 插件名，注册环境下唯一
    name: '<%- componentName %>',
    // 依赖的插件（插件名数组）
    dep: [],
    // 插件对外暴露的数据和方法
    exports() {
      return {
        data: '你可以把插件的数据这样对外暴露',
        func: () => {
          console.log('方法也是一样');
        },
      }
    },
    // 插件的初始化函数，在引擎初始化之后会立刻调用
    init() {
      // 你可以拿到其他插件暴露的方法和属性
      // const { data, func } = ctx.plugins.pluginA;
      // func(); 

      // console.log(options.name);

      // 往引擎增加面板
      ctx.skeleton.add({
        area: 'leftArea',
        name: 'demoPane',
        type: 'PanelDock',
        props: {
          icon: <Icon />,
          description: 'Demo',
        },
        content: <div>这是一个 Demo 面板</div>,
      });

      ctx.logger.log('打个日志');
    },
  };
};

<%- componentName %>.pluginName = '<%- componentName %>';

export default <%- componentName %>;
