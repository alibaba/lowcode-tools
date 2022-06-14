{{{ componentsImportStr }}}

const componentCategorySort = {};
{{{categories}}}
  .reverse()
  .forEach((item, index) => {
    componentCategorySort[item] = ++index;
  });

function generateComponentList(components) {
  const componentList = [
    {
      title: '常用',
      icon: '',
      children: [],
    },
    {
      title: '容器',
      icon: '',
      children: [],
    },
    {
      title: '导航',
      icon: '',
      children: [],
    },
    {
      title: '内容',
      icon: '',
      children: [],
    },
    {
      title: 'Feedback 反馈',
      icon: '',
      children: [],
    },
  ];

  const groupMap = {
    原子组件: true,
  };
  const compGroup = {};

  components.forEach((comp) => {
    const category = comp.category || '其他';
    if (comp.group && !compGroup[comp.componentName]) {
      compGroup[comp.componentName] = comp.group;
    }
    if (comp.group && !groupMap[comp.group]) {
      groupMap[comp.group] = true;
    }
    let target = componentList.find((item) => item.title === category);
    if (!target) {
      target = {
        title: category,
        icon: '',
        children: [],
      };

      componentList.push(target);
    }

    if (comp.snippets && comp.snippets.length) {
      target.children.push({
        componentName: comp.componentName,
        title: comp.title || comp.componentName,
        sort: {
          category: target.title,
          group: compGroup[comp.componentName] || '原子组件',
          priority: componentCategorySort[target.title] || 0,
        },
        icon: '',
        package: comp.npm.pkg,
        snippets: comp.snippets || [],
      });
    }
  });
  return componentList;
}

function fillRealVersion(meta, packageName = '{{{packageName}}}', version = '{{{version}}}', basicLibraryVersion={{{basicLibraryVersion}}}) {
  if (!meta || !version) {
    return meta;
  }
  const { npm } = meta;
  if (!npm) {
    return meta;
  }
  if (typeof basicLibraryVersion === 'object' && basicLibraryVersion[npm.package]) {
    meta.npm = {
      ...npm,
      version: basicLibraryVersion[npm.package]
    };
  } else if (npm.package === packageName) {
    meta.npm = {
      ...npm,
      version
    };
  }
  return meta;
}

const componentMetas = [{{{ components }}}];
const components = [];
const npmInfo = {{{ npmInfo }}};
componentMetas.forEach(meta => {
  if (Array.isArray(meta)) {
    components.push(
      ...meta.map((item) => {
        if (!item.npm) {
          const { componentName } = item;
          const names = componentName.split('.');
          const [exportName, subName] = names;
          item.npm = {
            exportName: exportName,
            main: '',
            destructuring: true,
            subName: names.length > 1 ? componentName.slice(componentName.indexOf('.') + 1) : subName,
          };
        }
        item.npm = { ...npmInfo, ...(item.npm || {}) };
        return fillRealVersion(item);
      }),
    );
  } else if (meta.components) {
    components.push(
      ...meta.components.map((item) => {
        if (!item.npm) {
          const { componentName } = item;
          const names = componentName.split('.');
          const [exportName, subName] = names;
          item.npm = {
            exportName: exportName,
            main: '',
            destructuring: true,
            subName: names.length > 1 ? componentName.slice(componentName.indexOf('.') + 1) : subName,
          };
        }
        item.npm = { ...npmInfo, ...(item.npm || {}) };
        return fillRealVersion(item);
      }),
    );
  } else {
    if (!meta.npm) {
      const { componentName } = meta;
      const names = componentName.split('.');
      const [exportName, subName] = names;
      meta.npm = {
        exportName: exportName,
        main: '',
        destructuring: true,
        subName: names.length > 1 ? componentName.slice(componentName.indexOf('.') + 1) : subName,
      };
    }
    meta.npm = { ...npmInfo, ...(meta.npm || {}) };
    components.push(fillRealVersion(meta));
  }
});

const componentList = generateComponentList(components);

export { components, componentList };

const execCompile = !!{{{ execCompile }}};

if (!execCompile) {
  window.{{{metaExportName}}} = { components, componentList };
}