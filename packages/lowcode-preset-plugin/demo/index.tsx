import init, { editor, project, material, setters } from '../src/index';
import { createFetchHandler } from '@alilc/lowcode-datasource-fetch-handler'
import { getPageSchema } from '../src/utils';

const LCE_CONTAINER = document.getElementById('lce-container');

const config =  {
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
  },
  presetConfig: {
    logo: {
      logo: 'https://cdn.npmmirror.com/npmmirror-logo.png'
    }
  }
};


(async function main() {
  await init((ctx) => {
    return {
      name: 'editor-init',
      async init() {
        // 修改面包屑组件的分隔符属性setter
        const assets = await (
          await fetch(
            `https://alifd.alicdn.com/npm/@alilc/lowcode-materials/build/lowcode/assets-prod.json`
          )
        ).json();
        // 设置物料描述
        const { material, project } = ctx;
  
        await material.setAssets(assets);
  
        const schema = await getPageSchema();
  
        // 加载 schema
        project.openDocument(schema);
      },
    };
  }, [], LCE_CONTAINER, config);
})();
