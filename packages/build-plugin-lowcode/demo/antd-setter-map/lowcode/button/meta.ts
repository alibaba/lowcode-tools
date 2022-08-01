
import { ComponentMetadata, Snippet } from '@alilc/lowcode-types';

const ButtonMeta: ComponentMetadata = {
  "componentName": "Button",
  "title": "Button",
  "docUrl": "",
  "screenshot": "",
  "devMode": "proCode",
  group: '测试组件',
  "npm": {
    "package": "@alilc/example-components",
    "version": "1.0.0",
    "exportName": "Button",
    "main": "src/index.tsx",
    "destructuring": true,
    "subName": ""
  },
  "configure": {
    "props": [
      {
        name: 'title',
        title: {
          label: 'title',
          tip: "标题",
        },
        setter: ['StringSetter', 'VariableSetter', 'InputSetter'],
      },
    ],
    "supports": {
      "style": true
    },
    "component": {}
  }
};
const snippets: Snippet[] = [
  {
    "title": "Button",
    "screenshot": "",
    "schema": {
      "componentName": "Button",
      "props": {}
    }
  }
];

export default {
  ...ButtonMeta,
  snippets
};
