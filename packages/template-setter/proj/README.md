# <%- componentName %> [![][npm-image]][npm-url]

<%- description %>

---

## 标准组件描述协议中使用

```js
 configure: {
   props: [
     {
        type: 'field',
        name: 'someprop',
        title: '某属性',
        setter: '<%- componentName %>'
     }
   ]
 }
```

[npm-image]: https://img.shields.io/badge/<%- name %>
[npm-url]: https://www.npmjs.com/package/<%- name %>
