const SUPPORTED_COMMAND = ['start', 'build'];

const COMMON_EXTERNALS = {
  react: 'var window.React',
  'react-dom': 'var window.ReactDOM',
  'prop-types': 'var window.PropTypes',
  '@alifd/next': 'var window.Next',
  '@alifd/meet': 'var window.Meet',
  '@ali/visualengine': 'var window.VisualEngine',
  '@ali/visualengine-utils': 'var window.VisualEngineUtils',
  '@ali/lowcode-engine': 'var window.AliLowCodeEngine',
  '@alilc/lowcode-engine': 'var window.AliLowCodeEngine',
  '@ali/lowcode-rax-renderer': 'var window.alilcLowcodeRaxRenderer',
  rax: 'var window.Rax',
  antd: 'var window.antd',
  '@alifd/lowcode-preset-plugin': 'var window.PluginLowcodeEditor',
  'monaco-editor/esm/vs/editor/editor.api': 'var window.monaco',
  'monaco-editor/esm/vs/editor/editor.main.js': 'var window.monaco',
};

const DEFAULT_GROUPS = ['精选组件', '原子组件'];
const DEFAULT_CATEGORIES = [
  '基础元素',
  '布局容器类',
  '表格类',
  '表单详情类',
  '帮助类',
  '对话框类',
  '业务类',
  '通用',
  '引导',
  '信息输入',
  '信息展示',
  '信息反馈',
];

const STATIC_RESOURCES = {
  themeVariableUrl: 'https://alifd.alicdn.com/npm/@alifd/theme-lowcode-dark@0.6.1/variables.css',
  themeStyleUrl:
    'https://alifd.alicdn.com/npm/@alifd/theme-lowcode-dark@0.6.1/dist/next.var.min.css',
  engineCoreCssUrl:
    'https://dev.g.alicdn.com/ali-lowcode/ali-lowcode-engine/0.16.6/engine-core.css',
  enginePresetCssUrl:
    'https://alifd.alicdn.com/npm/@alifd/lowcode-preset-plugin@1.1.8/dist/editor-preset-plugin.css',
  engineExtCssUrl: 'https://g.alicdn.com/ali-lowcode/lowcode-engine-ext/1.0.20/engine-ext.css',
  engineCoreJsUrl: 'https://dev.g.alicdn.com/ali-lowcode/ali-lowcode-engine/0.16.6/engine-core.js',
  engineExtJsUrl: 'https://g.alicdn.com/ali-lowcode/lowcode-engine-ext/1.0.20/engine-ext.js',
  enginePresetJsUrl:
    'https://alifd.alicdn.com/npm/@alifd/lowcode-preset-plugin@1.1.8/dist/editor-preset-plugin.js',
  raxRenderJsUrl: 'https://alifd.alicdn.com/npm/@alilc/lowcode-rax-renderer@1.0.18/dist/index.umd.js',
  raxRenderCssUrl: 'https://alifd.alicdn.com/npm/@alilc/lowcode-rax-renderer@1.0.18/dist/index.css',
};

const ALILC_STATIC_RESOURCES = {
  themeVariableUrl: 'https://alifd.alicdn.com/npm/@alifd/theme-lowcode-dark@0.6.1/variables.css',
  themeStyleUrl:
    'https://alifd.alicdn.com/npm/@alifd/theme-lowcode-dark@0.6.1/dist/next.var.min.css',
  engineCoreCssUrl:
    'https://uipaas-assets.com/prod/npm/@alilc/lowcode-engine/1.0.18/dist/css/engine-core.css',
  engineExtCssUrl:
    'https://uipaas-assets.com/prod/npm/@alilc/lowcode-engine-ext/1.0.5/dist/css/engine-ext.css',
  enginePresetCssUrl:
    'https://alifd.alicdn.com/npm/@alifd/lowcode-preset-plugin@1.1.8/dist/editor-preset-plugin.css',
  engineCoreJsUrl:
    'https://uipaas-assets.com/prod/npm/@alilc/lowcode-engine/1.0.18/dist/js/engine-core.js',
  engineExtJsUrl:
    'https://uipaas-assets.com/prod/npm/@alilc/lowcode-engine-ext/1.0.5/dist/js/engine-ext.js',
  enginePresetJsUrl:
    'https://alifd.alicdn.com/npm/@alifd/lowcode-preset-plugin@1.1.8/dist/editor-preset-plugin.js',
  raxRenderJsUrl: 'https://alifd.alicdn.com/npm/@alilc/lowcode-rax-renderer@1.0.18/dist/index.umd.js',
  raxRenderCssUrl: 'https://alifd.alicdn.com/npm/@alilc/lowcode-rax-renderer@1.0.18/dist/index.css',
};

const STATIC_RESOURCES_MAP = {
  '@ali': STATIC_RESOURCES,
  '@alilc': ALILC_STATIC_RESOURCES,
};

const BASIC_LIBRARY_VERSION = {
  '@alifd/next': '1.25.23',
  '@alifd/meet': '2.6.3',
  antd: '4.17.3',
};
const COMPONENT_PROPS = [
  'componentName',
  'title',
  'description',
  'docUrl',
  'screenshot',
  'icon',
  'tags',
  'keywards',
  'devMode',
  'npm',

  'props',
  'configure',
  'snippets',
  'group',
  'category',
  'priority',
];

const UNPKG_BASE_URL_MAP = {
  '@ali': 'https://unpkg.alibaba-inc.com',
  '@alilc': 'https://unpkg.com',
};

const META_TYPES = ['', 'dev', 'web', 'mobile', 'design', 'sketch'];

module.exports = {
  SUPPORTED_COMMAND,
  COMMON_EXTERNALS,
  DEFAULT_GROUPS,
  DEFAULT_CATEGORIES,
  STATIC_RESOURCES,
  ALILC_STATIC_RESOURCES,
  STATIC_RESOURCES_MAP,
  BASIC_LIBRARY_VERSION,
  COMPONENT_PROPS,
  UNPKG_BASE_URL_MAP,
  META_TYPES,
};
