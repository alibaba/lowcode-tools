import { init, plugins } from '@alilc/lowcode-engine';
import { createFetchHandler } from '@alilc/lowcode-datasource-fetch-handler'
import { IPublicTypeEngineOptions, IPublicTypePlugin } from '@alilc/lowcode-types';

import registerDefaultPlugins from './plugins';
import registerDefaultSetters from './setters';

import './index.scss';

export * from '@alilc/lowcode-engine';

const defaultConfig = {
  // locale: 'zh-CN',
  enableCondition: true,
  enableCanvasLock: true,
  // 默认绑定变量
  supportVariableGlobally: true,
  // simulatorUrl 在当 engine-core.js 同一个父路径下时是不需要配置的！！！
  // 这里因为用的是 alifd cdn，在不同 npm 包，engine-core.js 和 react-simulator-renderer.js 是不同路径
  simulatorUrl: [
    'https://alifd.alicdn.com/npm/@alilc/lowcode-react-simulator-renderer@latest/dist/css/react-simulator-renderer.css',
    'https://alifd.alicdn.com/npm/@alilc/lowcode-react-simulator-renderer@latest/dist/js/react-simulator-renderer.js'
  ],
  requestHandlersMap: {
    fetch: createFetchHandler()
  }
};

export default async (cb: IPublicTypePlugin, customPlugins: any, container: HTMLElement, config: IPublicTypeEngineOptions & { presetConfig: any }) => {

  const realConfig = { ...defaultConfig, ...(config || {}) };
  const { presetConfig } = realConfig;

  await registerDefaultPlugins(presetConfig);
  registerDefaultSetters();

  // 处理外部传入初始化回调
  if (typeof cb === 'function') {
    cb.pluginName = 'editorInit';
    await plugins.register(cb);
  }

  init(container, realConfig);
}