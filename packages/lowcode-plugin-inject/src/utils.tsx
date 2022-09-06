import * as queryString from 'query-string';
import fetchJsonp from 'fetch-jsonp';
import * as React from 'react';
import { pascal } from 'case';
import { Notification } from '@alifd/next';
import { buildComponents } from '@alilc/lowcode-utils';

const typeMap = {
  vc: ['prototype', 'view'],
  vs: ['setter'],
  vp: ['plugin'],
  ve: ['pane'],
  vu: ['utils'],
  plugin: ['designerPlugin'],
  component: ['meta', 'view'],
};

const queryFlag = '__injectFrom'; // 不推荐
const injectTypeFlag = '__injectType'; // 不推荐
const injectEnvFlag = '__injectEnv'; // 不推荐
const debugFlag = 'debug'; // 推荐
const injectAPIUrl = 'http://127.0.0.1:8899/apis/injectInfo';
const arrayFlag = '__components';
const jsonpFlag = '__injectComponent';
const prototypeKeyFlag = '__prototype';
const injectDeviceFlag = '__device';


window[arrayFlag] = [];
window[jsonpFlag] = function addComponents(component) {
  window[arrayFlag].push(component);
};

const searchParams = new URLSearchParams(window.location.search);
// 是否需要开启 inject 逻辑

export const needInject = searchParams.get('__injectFrom') // 历史兼容
  || searchParams.get('__injectType') === 'auto' // 历史兼容
  || searchParams.has('debug')
  || (window as any).injectConfig;


let urlCache = null;
// 获取 inject 资源的 url，格式：['url1', 'url2']
function getInjectUrls(resourceType, type = 'url'): Promise<any> {
  const filter = (_urls) => {
    if (!resourceType) {
      return type === 'url' ? _urls.map(item => item.url || item) : _urls;
    }
    const filteredUrls = _urls.filter((item) => {
      if (typeof item === 'string') {
        return item.indexOf(`name=@ali/${resourceType}-`) >= 0;
      }
      if (item.type) {
        return typeMap[resourceType].indexOf(item.type) >= 0;
      }
      return false;
    })
    return type === 'url' ? filteredUrls.map(item => item.url || item) : filteredUrls;
  };

  return new Promise((resolve) => {
    if (!urlCache) {
      const urlParams = queryString.parse(window.location.search);
      let urls = urlParams[queryFlag] || [];
      urls = Array.isArray(urls) ? urls : [urls];

      const { type, injects } = window.injectConfig || {};
      if (type === 'auto' || urlParams[injectTypeFlag] === 'auto' || urlParams[debugFlag] !== undefined) {
        let finalInjectAPIUrl = injectAPIUrl;
        if (urlParams['injectServerHost']) {
          finalInjectAPIUrl = `http://${urlParams['injectServerHost']}:8899/apis/injectInfo`;
        }
        fetchJsonp(finalInjectAPIUrl).then(res => res.json()).then((data) => {
            urls = envFilter(data.content);
            urlCache = urls;
            resolve(filter(urlCache));
        }).catch((err) => {
            urlCache = [];
            resolve([]);
            console.error(err);
          });
      } else if (type === 'custom' && injects) {
        urls = urls.concat(injects);
        urlCache = urls;
        resolve(filter(urlCache));
      } else {
        urlCache = urls;
        resolve(filter(urlCache));
      }
    } else {
      resolve(filter(urlCache));
    }
  });
}

function loadScript(url, callback) {
  const src = ((_url) => {
    const isInFileProtocol = _url.indexOf('//') === 0 && window.location.protocol === 'file:';
    return isInFileProtocol ? `//${_url}` : _url;
  })(url);
  const scriptElement = document.createElement('script');
  scriptElement.crossOrigin = 'anonymous';
  scriptElement.src = src;
  scriptElement.async = true;
  if (callback) {
    scriptElement.onload = () => callback();
    scriptElement.onerror = () => callback(new Error(`Inject ${url} failed`));
  }
  document.body.insertBefore(scriptElement, document.body.firstChild);
}

function promiseLoadScript(url) {
  return new Promise((rs, rj) => {
    loadScript(url, e => (e ? rj(e) : rs({})));
  }).then(
    () => {
      console.info(`%c Injected ${url}`, 'font-weight:bold; font-size: 20px; color: orange;');
    },
    (e) => {
      console.error(e);
    },
  );
}

function loadComponentFromSources(sources) {
  return Promise.all(sources.map(url => promiseLoadScript(url)));
}

// 获取 inject 的资源，格式 [{name, module, pluginType}]
export async function getInjectedResource(type) {
  const urls = await getInjectUrls(type);
  await loadComponentFromSources(urls);
  return window[arrayFlag].filter((item) => {
      const _item = item.default || item;
      if (!type) {
        return true;
      }
      if (_item.type && typeMap[type].indexOf(_item.type) < 0) {
        return false;
      }
      if (!_item.type && _item.name && _item.name.indexOf(`@ali/${type}-`) < 0) {
        return false;
      }
      return true;
  }).map((item) => {
      const _item = item.default || item;
      _item.module = getModule(_item.module);
      return _item;
    });
}

function getModule(module) {
  if (Array.isArray(module)) {
    return module.map(item => getModule(item));
  }
  return module.default || module;
}

function envFilter(injects) {
  if (!injects) {
    return [];
  }

  const urlParams = queryString.parse(window.location.search);

  // 从 window 或者 url 中获取当前是设计器还是预览环境；没有配置则读取 window 是否有 VisualEngine
  const env = window.injectEnv || urlParams[injectEnvFlag] || (window.VisualEngine || window.LowcodeEditor || window.AliLowCodeEngine ? 'design' : 'preview') || 'design';

  let device = urlParams[injectDeviceFlag] || (window.g_config && window.g_config.device) || (window.pageConfig && window.pageConfig.device) || 'web';
  if (device === 'both') { // 乐高有双端的能力，开启后 device 是 both
    device = /Mobile/.test(window.navigator.userAgent) ? 'mobile' : 'web';
  }

  let prototypeKey = urlParams[prototypeKeyFlag] || (window.pageConfig
    && window.pageConfig.designerConfigs
    && window.pageConfig.designerConfigs.prototypeKey);
  prototypeKey = prototypeKey === 'default' ? '' : prototypeKey;

  return injects.filter((item) => {
    if (env === 'design') {
      // 设计器不需要注入组件的 view 和 vu
      if (['utils'].indexOf(item.type) >= 0) {
        return false;
      }
      // 注入指定的 prototype
      if (item.type === 'prototype') {
        if (item.subType && item.subType !== prototypeKey) {
          return false;
        }
        if (!item.subType && prototypeKey) {
          // 看有没有对应的 prototype.js 如果没有则用默认的
          const proto = injects.find(item2 => item2.packageName === item.packageName && item2.type === 'prototype' && item2.subType === prototypeKey);
          if (proto) {
            return false;
          }
        }
      }
    }
    if (env === 'preview') {
      // 预览不需要注入 prototype、vp、setter、pane
      if (['prototype', 'plugin', 'setter', 'pane'].indexOf(item.type) >= 0) {
        return false;
      }
      // PC 端应用不需要加载 view.mobile
      if (device === 'web' && item.type === 'view' && item.subType === 'mobile') {
        return false;
      }
      // 移动端应用如果有 view.mobile 则不需要加载 view，否则还是加载 view
      if (device === 'mobile' && item.type === 'view' && item.subType !== 'mobile') {
        // 看当前组件有没有 view.mobile
        const viewMobile = injects.find(item2 => item2.packageName === item.packageName && item2.type === 'view' && item2.subType === 'mobile');
        if (viewMobile) {
          return false;
        }
      }
    }
    return true;
  });
}

function getComponentFromUrlItems(items) {
  const map = {};
  items.forEach((item) => {
    const { packageName, type, url, library } = item;
    if (!map[packageName]) {
      map[packageName] = {
        packageName,
      };
    }
    map[packageName][type] = url;
    map[packageName]['library'] = library;
  })
  return map;
}


export async function injectAssets(assets) {
  if (!needInject) return assets;
  try {
    const injectUrls = await getInjectUrls('component', 'item');
    const components = getComponentFromUrlItems(injectUrls)
    Object.keys(components).forEach((name) => {
      const item = components[name];
      const pascalCaseName = pascal(name);
      if (!assets.packages) assets.packages = [];
      if (!assets.components) assets.components = [];
      assets.packages.push({
        "package": name,
        "version": '0.1.0',
        "library": item.library || pascalCaseName,
        "urls": [item.view],
        "editUrls": [item.view],
      });
      assets.components.push({
        exportName: `${pascalCaseName}Meta`,
        url: item.meta,
      });
    })
    if (Object.keys(components).length > 0) {
      Notification.success({
        title: '成功注入以下组件',
        content: (
          <div>
            {Object.keys(components).map((name) => (
              <p>组件：<b>{name}</b></p>
            ))}
          </div>
        )
      })
    }
  } catch (err) { }
  return assets;
}

export async function injectComponents(components) {
  if (!needInject) return components;
  const injectUrls = await getInjectUrls('component', 'item');
  await loadComponentFromSources(injectUrls.map(item => item.url || item));
  const injectedComponents = getComponentFromUrlItems(injectUrls);
  const libraryMap = {};
  const componentsMap = {};
  Object.keys(injectedComponents).forEach((name) => {
    const { library } = injectedComponents[name];
    const pascalName = pascal(name);
    libraryMap[name] = library || pascalName;
    componentsMap[pascalName] = window[`${pascalName}Meta`]?.components?.find(item => item.componentName === pascalName)?.npm;
  })
  const injectedComponentsForRenderer = await buildComponents(libraryMap, componentsMap, undefined);
  if (Object.keys(injectedComponents).length > 0) {
    Notification.success({
      title: '成功注入以下组件',
      content: (
        <div>
          {Object.keys(injectedComponents).map((name) => (
            <p>组件：<b>{name}</b></p>
          ))}
        </div>
      )
    })
  }
  return { ...components, ...injectedComponentsForRenderer };
}

export async function filterPackages(packages = []) {
  if (!needInject) return packages;
  const injectUrls = await getInjectUrls('component', 'item');
  const injectedComponents = getComponentFromUrlItems(injectUrls);
  return packages.filter((item) => {
    return !(item.package in injectedComponents)
  });
}