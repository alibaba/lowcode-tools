## 概述

## 使用文档

```
export interface LowcodeOptions {
  builtinAssets?: Array<string|Assets>; // 会作为内置资产保存到构建产物中
  extraAssets?: Array<string|Assets>; // 只在调试环境加载到资产包中
  noParse?: boolean; // 关闭自动解析生成 lowcode meta
  categories?: string[]; // 组件在组件面板中的分类
  groups?: string[]; // 组件在组件面板中的 tab 分组
  baseLibrary?: 'react'|'rax';
  setterMap?: SetterMap; // 注入 setter
}

export interface SetterMap {
  [SetterName: string]: string;
}

```
## 开发调试
### 组件开发

`demo/component` 目录下是测试组件的项目，改项目引用了 build-plugin-lowcode ，相关配置在 `demo/component/build.lowcode.js` 中；

可以修改 build-plugin-lowcode 的代码、修改 demo/component/build.lowcode.js 的配置进行调试；

```
在 build-plugin-lowcode 根目录下执行启动调试环境
npm run component:dev
```