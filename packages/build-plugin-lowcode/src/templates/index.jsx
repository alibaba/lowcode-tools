import init, { editor, project, material, setters } from '@alifd/lowcode-preset-plugin';
import mergeWith from 'lodash/mergeWith';
{{{setterImportStr}}}

const queryObject = new URLSearchParams(window.location.search);
const fullbackMeta = '{{{fullbackMeta}}}' || '';
let platform = queryObject.get('platform') || '';
let metaType = queryObject.get('metaType') || platform || '';
const metaPathMap = {{{metaPathMap}}};
const key = metaType ? `meta.${metaType}` : 'meta';
if (!metaPathMap[key]) {
  console.warn(`[@alifd/build-plugin-lowcode] metaType can only in [${Object.keys(metaPathMap)}], current metaType is ${key}, fullback to ${fullbackMeta || 'default'}.`);
  metaType = fullbackMeta === 'default' ? '' : fullbackMeta;
}
const isNewEngineVersion = !!material;
const devMode = !!{{{ devMode }}};
const baseLibrary = '{{{baseLibrary}}}';
const basePackages = [
  {
    package: 'moment',
    version: '2.24.0',
    urls: ['https://g.alicdn.com/mylib/moment/2.24.0/min/moment.min.js'],
    library: 'moment',
  },
  {
    package: "lodash",
    library: "_",
    urls: [
      "https://g.alicdn.com/platform/c/lodash/4.6.1/lodash.min.js"
    ]
  },
  {
    title: 'fusion组件库',
    package: '@alifd/next',
    version: '1.25.23',
    urls: [
      'https://g.alicdn.com/code/lib/alifd__next/1.25.23/next.min.css',
      'https://g.alicdn.com/code/lib/alifd__next/1.25.23/next-with-locales.min.js',
    ],
    library: 'Next',
  },
  {
    package: 'antd',
    version: '4.17.3',
    urls: [
      'https://g.alicdn.com/code/lib/antd/4.17.3/antd.min.js',
      'https://g.alicdn.com/code/lib/antd/4.17.3/antd.min.css',
    ],
    library: 'antd',
  },
];

if (baseLibrary === 'rax') {
  basePackages.push({
    title: 'meet',
    package: '@alifd/meet',
    version: 'meet@2.4.2-beta.6',
    urls: [
      'https://mc-fusion.alibaba-inc.com/unpkg/@alifd/meet@2.4.2-beta.6/umd/meet.lowcode.js',
      'https://mc-fusion.alibaba-inc.com/unpkg/@alifd/meet@2.4.2-beta.6/umd/meet.min.css',
    ],
    library: 'Meet',
  });
}

const assets = {
  packages: []
};

let assetsName = './assets-dev.json';

const setterMap = {{{setterMap}}};
if (typeof setterMap === 'object' && Object.keys(setterMap).length) {
  setters.registerSetter(setterMap);
}
if (devMode) {
  assets.packages.push({
    "package": "{{{package}}}",
    "version": "{{{version}}}",
    "library": "{{{library}}}",
    "urls": {{{ urls }}},
    "editUrls": {{{editUrls}}},
    "advancedUrls": {{{advancedRenderUrls}}},
  });
  assets.groupList = {{{groups}}};
  assets.sort = {
    "groupList": {{{groups}}},
    "categoryList": {{{categories}}}
  };
  assets.ignoreComponents = {{{ignoreComponents}}};

  assets.components = [{
    exportName: '{{{metaExportName}}}',
    url: metaType ? `/meta.${metaType}.js` : '/meta.js',
  }];
}

const schema = getPageSchema() || {
  componentName: 'Page',
  id: 'node_dockcviv8fo1',
  props: {
    ref: 'outterView',
    style: {
      height: '100%',
    },
  },
  fileName: 'lowcode',
  dataSource: {
    list: [],
  },
  state: {
    text: 'outter',
    isShowDialog: false,
  },
  css: 'body {font-size: 12px;} .botton{width:100px;color:#ff00ff}',
  lifeCycles: {
    componentDidMount: {
      type: 'JSFunction',
      value: "function() {\n    console.log('did mount');\n  }",
    },
    componentWillUnmount: {
      type: 'JSFunction',
      value: "function() {\n    console.log('will umount');\n  }",
    },
  },
  methods: {
    testFunc: {
      type: 'JSFunction',
      value: "function() {\n    console.log('test func');\n  }",
    },
    onClick: {
      type: 'JSFunction',
      value: 'function() {\n    this.setState({\n      isShowDialog: true\n    })\n  }',
    },
    closeDialog: {
      type: 'JSFunction',
      value: 'function() {\n    this.setState({\n      isShowDialog: false\n    })\n  }',
    },
  },
  children: [],
};

const LCE_CONTAINER = document.getElementById('lce-container');

init(() => {
  return {
    name: 'editor-init',
    async init() {
      if (!devMode) {
        const devAssets = await (await fetch(assetsName)).json();
        const packages = devAssets.packages;
        assets.packages = assets.packages.concat(packages);
        assets.components = devAssets.components.map(item => {
          if (item.advancedUrls && metaType && item.advancedUrls[metaType] && item.advancedUrls[metaType].length) {
            item.url = item.advancedUrls[metaType][0];
          } else if (item.urls && metaType && item.urls[metaType]) {
            item.url = item.urls[metaType];
          }
          return item;
        });
        assets.groupList = devAssets.groupList;
      } else {
        const extraAssets = {{{extraAssets}}};
        const builtinAssets = {{{builtinAssets}}};
        extraAssets && await handleExtraAssets(assets, extraAssets);
        builtinAssets && await handleExtraAssets(assets, builtinAssets);
      }

      assets.packages = basePackages.concat(assets.packages);
      assets.packages = assets.packages.map(item => {
        if (item.editUrls && item.editUrls.length) {
          item.renderUrls = item.urls;
          item.urls = item.editUrls;
        }
        return item;
      })

      if (baseLibrary && baseLibrary === 'rax') {
        editor.set('renderEnv', 'rax');
        project.onRendererReady(() => {
          editor.get('designer').currentDocument.simulator._iframe.onload = () => {
            editor.get('designer').currentDocument.simulator.set('device', 'phone');
          }
        });
      }

      if (isNewEngineVersion) {
        material.setAssets(assets);
        project.openDocument(schema);
      } else {
        editor.setAssets(assets);
        project.open(schema);
      }
    },
  }
}, [], LCE_CONTAINER);

function getPageSchema() {
  const schema = JSON.parse(
    window.localStorage.getItem('projectSchema') || '{}'
  );

  const pageSchema = schema?.componentsTree?.[0];
  return pageSchema;
};

async function handleExtraAssets(assets, extraAssets) {
  if (extraAssets && Array.isArray(extraAssets) && extraAssets.length) {
    const baseSchemas = await Promise.all(
      extraAssets.map(async (url) => {
        if (typeof url === 'object') {
          return url;
        } else {
          try {
            return (await fetch(url)).json();
          } catch (e) {
            console.error(`get assets data from builtin assets ${url} failed: `, e);
            return {};
          }
        }
      })
    );
    baseSchemas.forEach((item) => {
      const _assets = {
        ...item,
        packages: item.packages || [item.package],
        components: item.components,
        componentList: (item.componentList || []).map((comp) => {
          if (comp.children) {
            comp.children = comp.children.map((snippet) => {
              if (!snippet.sort) {
                snippet.sort = {
                  category: comp.title,
                  group: '原子组件',
                };
              }
              return snippet;
            });
          }
          return comp;
        }),
      };
      mergeWith(assets, _assets, (objValue, srcValue) => {
        if (Array.isArray(objValue) && Array.isArray(srcValue)) {
          return srcValue.concat(objValue);
        }
      });
    });
  }
}