
import { ComponentMetadata, Snippet } from '@alilc/lowcode-types';

const InputMeta: ComponentMetadata = {
  "componentName": "Input",
  "title": "Input",
  "docUrl": "",
  "screenshot": "",
  "devMode": "proCode",
  "npm": {
    "package": "@alilc/example-components",
    "version": "1.0.0",
    "exportName": "Input",
    "main": "src/index.tsx",
    "destructuring": true,
    "subName": ""
  },
  "configure": {
    "props": [
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "title",
            "zh-CN": "title"
          }
        },
        "name": "title",
        "setter": {
          "componentName": "StringSetter",
          "isRequired": true,
          "initialValue": ""
        }
      }
    ],
    "supports": {
      "style": true
    },
    "component": {}
  }
};
const snippets: Snippet[] = [
  {
    "title": "Input",
    "screenshot": "",
    "schema": {
      "componentName": "Input",
      "props": {}
    }
  }
];

export default {
  ...InputMeta,
  snippets
};
