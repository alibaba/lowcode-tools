const _ = require('lodash');
const path = require('path');
const fse = require('fs-extra');
const hbs = require('handlebars');
const parseProps = require('./parse-props.ts');

/**
 * @description generate js file as webpack entry
 * @param {String} template template path
 * @param {String} filename
 * @param {String} rootDir
 * @param {Object} params params for compile template content
 * @returns {String} path of entry file
 */
function generateEntry({ template, filename = 'index.js', rootDir = process.cwd(), params }) {
  const hbsTemplatePath = path.join(__dirname, `../templates/${template}`);
  const hbsTemplateContent = fse.readFileSync(hbsTemplatePath, 'utf-8');
  const compileTemplateContent = hbs.compile(hbsTemplateContent);

  const tempDir = path.join(rootDir, '.tmp');
  const jsPath = path.join(tempDir, filename);

  const jsTemplateContent = compileTemplateContent(params);
  fse.outputFileSync(jsPath, jsTemplateContent);

  return jsPath;
}

function parseNpmName(npmName) {
  if (typeof npmName !== 'string') {
    throw new TypeError('Expected a string');
  }
  const matched =
    npmName.charAt(0) === '@' ? /(@[^\/]+)\/(.+)/g.exec(npmName) : [npmName, '', npmName];
  if (!matched) {
    throw new Error(`[parse-package-name] "${npmName}" is not a valid string`);
  }
  const scope = matched[1];
  const name = (matched[2] || '').replace(/\s+/g, '').replace(/[\-_]+([^\-_])/g, ($0, $1) => {
    return $1.toUpperCase();
  });
  const uniqueName =
    (matched[1] ? matched[1].charAt(1).toUpperCase() + matched[1].slice(2) : '') +
    name.charAt(0).toUpperCase() +
    name.slice(1);
  return {
    scope,
    name,
    uniqueName,
  };
}

function camel2KebabComponentName(camel) {
  return camel
    .replace(/[A-Z]/g, (item) => {
      return `-${item.toLowerCase()}`;
    })
    .replace(/^\-/, '');
}

function kebab2CamelComponentName(kebab) {
  const camel = kebab.charAt(0).toUpperCase() + kebab.substr(1);
  return camel.replace(/-([a-z])/g, (keb, item) => {
    return item.toUpperCase();
  });
}

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

  components.forEach((comp) => {
    const category = comp.category || '其他';
    let target = componentList.find((item) => item.title === category);
    if (!target) {
      target = {
        title: category,
        icon: '',
        children: [],
      };

      componentList.push(target);
    }

    if (comp.snippets) {
      target.children.push({
        componentName: comp.componentName,
        title: comp.title || comp.componentName,
        icon: '',
        package: comp.npm.pkg,
        snippets: comp.snippets || [],
      });
    }
  });
  return componentList;
}

function replacer(key, value) {
  if (typeof value === 'function') {
    return {
      type: 'JSFunction',
      value: String(value),
    };
  }
  return value;
}

function isAsyncFunction(fn) {
  return fn[Symbol.toStringTag] === 'AsyncFunction';
}
function reviewer(key, value) {
  if (!value) {
    return value;
  }
  if (key === 'icon') {
    if (typeof value === 'object') {
      return {
        type: 'smile',
        size: 'small',
      };
    }
  }
  if (typeof value === 'object') {
    if (value.type === 'JSFunction') {
      let _value = value.value && value.value.trim();
      let template = `
        return function lowcode() {
          const self = this;
          try {
            return (${_value}).apply(self, arguments);
          } catch(e) {
            console.log('call function which parsed by lowcode for key ${key} failed: ', e);
            return e.message;
          }
        };`;
      try {
        return Function(template)();
      } catch (e) {
        if (e && e.message.includes("Unexpected token '{'")) {
          console.log('method need add funtion prefix');
          _value = `function ${_value}`;
          template = `
          return function lowcode() {
            const self = this;
            try {
              return (${_value}).apply(self, arguments);
            } catch(e) {
              console.log('call function which parsed by lowcode for key ${key} failed: ', e);
              return e.message;
            }
          };`;
          return Function(template)();
        }
        console.error('parse lowcode function error: ', e);
        console.error(value);
        return value;
      }
    }
  }
  return value;
}

function toJson(object, replacer) {
  return JSON.stringify(object, replacer || this.replacer, 2);
}

function parseJson(json) {
  const input = typeof json === 'string' ? json : JSON.stringify(json);
  return JSON.parse(input, this.reviewer);
}

function asyncDebounce(func, wait) {
  const debounced = _.debounce(async (resolve, reject, bindSelf, args) => {
    try {
      const result = await func.bind(bindSelf)(...args);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }, wait);

  // This is the function that will be bound by the caller, so it must contain the `function` keyword.
  function returnFunc(...args) {
    return new Promise((resolve, reject) => {
      debounced(resolve, reject, this, args);
    });
  }

  return returnFunc;
}

module.exports = {
  toJson,
  parseProps,
  parseNpmName,
  generateEntry,
  asyncDebounce,
  generateComponentList,
  camel2KebabComponentName,
  kebab2CamelComponentName,
};
