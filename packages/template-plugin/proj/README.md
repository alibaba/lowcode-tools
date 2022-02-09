# <%- name %> [![][npm-image]][npm-url]

<%- description %>

---

## 使用

### 注册插件
```jsx
import { plugins } from '@alilc/lowcode-engine';
import <%- componentName %> from '<%- name %>';

// 注册到引擎
plugins.register(<%- componentName %>);
```

### 插件属性 & 方法
无对外暴露的属性和方法

### 依赖插件
该插件依赖以下插件：

| 插件名 | 包名 |
| --- | --- |

## 开发
### 环境准备

### 启动
```sh
npm i & npm start
```

### 发布
```sh
npm run pub
```

[npm-image]: https://img.shields.io/badge/<%- name %>
[npm-url]: https://www.npmjs.com/package/<%- name %>
