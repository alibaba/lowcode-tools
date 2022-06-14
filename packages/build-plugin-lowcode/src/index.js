const path = require('path');
const glob = require('glob');
const axios = require('axios');
const fse = require('fs-extra');
const chokidar = require('chokidar');
const mergeWith = require('lodash/mergeWith');
const parser = require('@alilc/lowcode-material-parser');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { getWebpackConfig } = require('build-scripts-config');
const isWsl = require('is-wsl');

let INIT_STATE = false;
let PARSED_NPM_NAME;
const { debug } = console;

const UTILS = require('./utils');
const CONSTANTS = require('./constants');
const { installModule } = require('./utils/npm.ts');
const userWebpackConfig = require('./config/user-config');

const {
  parseProps,
  parseNpmName,
  generateEntry,
  asyncDebounce,
  camel2KebabComponentName,
  kebab2CamelComponentName,
} = UTILS;

const {
  COMMON_EXTERNALS,
  DEFAULT_GROUPS,
  DEFAULT_CATEGORIES,
  STATIC_RESOURCES_MAP,
  BASIC_LIBRARY_VERSION,
  COMPONENT_PROPS,
  UNPKG_BASE_URL_MAP,
  META_TYPES,
} = CONSTANTS;

const debounceBuild = asyncDebounce(build, 300);
const debounceStart = asyncDebounce(start, 300);

const defaultEntryPaths = [
  `./src/index.tsx`,
  `./index.js`,
  `./lib/index.js`,
  `./src/index.ts`,
  `./src/index.js`,
  `./src/index.jsx`,
  `./src/index.tsx`,
  `./components/index.ts`,
  `./components/index.tsx`,
];

const defaultScssEntryPaths = [
  `./src/index.scss`,
  `./src/main.scss`,
  `./index.scss`,
  `./main.scss`,
  `./components/index.scss`,
];

function getEntry(rootDir, entryPath) {
  if (entryPath && fse.existsSync(path.resolve(rootDir, entryPath))) {
    return path.resolve(rootDir, entryPath);
  }
  for (let i = 0; i < defaultEntryPaths.length; i++) {
    const p = path.resolve(rootDir, defaultEntryPaths[i]);
    if (fse.existsSync(p)) {
      return p;
    }
  }
  return '';
}

function getScssEntry(rootDir) {
  for (let i = 0; i < defaultScssEntryPaths.length; i++) {
    const p = path.resolve(rootDir, defaultScssEntryPaths[i]);
    if (fse.existsSync(p)) {
      return p;
    }
  }
  return '';
}

function formatComponentSchema(schema) {
  let { props } = schema;
  const defaultProps = {};
  let noStyleProp = true;
  if (props && Array.isArray(props)) {
    props.forEach((prop) => {
      if (prop.defaultValue) {
        defaultProps[prop.name] = prop.defaultValue;
      }
      if (noStyleProp && ['style'].includes(prop.name)) {
        noStyleProp = false;
      }
    });
    if (noStyleProp) {
      props.push({
        name: 'style',
        propType: 'object',
      });
    }
  } else {
    props = [
      {
        name: 'style',
        propType: 'object',
      },
    ];
  }
  schema.props = props;
  const parsedSchema = parseProps(schema);
  delete parsedSchema.props;
  parsedSchema.snippets = [
    {
      title: schema.componentName,
      screenshot: schema.screenshot,
      schema: {
        componentName: schema.componentName,
        props: defaultProps,
      },
    },
  ];
  return parsedSchema;
}

function getUsedComponentViews(rootDir, targetDir = 'lowcode', components) {
  let viewPaths = glob.sync(path.resolve(rootDir, `${targetDir}/**/view.@(js|ts|jsx|tsx)`));
  if (viewPaths && viewPaths.length) {
    viewPaths = viewPaths.map((item) => {
      return item.slice(path.resolve(rootDir, targetDir).length + 1, item.lastIndexOf('view') - 1);
    });
  }
  return components
    ? components.filter((component) => {
        return viewPaths.includes(camel2KebabComponentName(component));
      })
    : viewPaths.map((dir) => kebab2CamelComponentName(dir));
}

function getUsedComponentMetas(rootDir, lowcodeDir = 'lowcode', metaFilename, components) {
  let metaPaths = glob.sync(
    path.resolve(rootDir, `${lowcodeDir}/**/${metaFilename}.@(js|ts|jsx|tsx)`),
  );
  if (metaPaths && metaPaths.length) {
    metaPaths = metaPaths.map((item) => {
      return item.slice(
        path.resolve(rootDir, lowcodeDir).length + 1,
        item.lastIndexOf(metaFilename) - 1,
      );
    });
  }
  return components
    ? components.filter((component) => {
        return metaPaths.includes(camel2KebabComponentName(component));
      })
    : metaPaths.map((dir) => kebab2CamelComponentName(dir));
}

/**
 * 将 css 打包到 js 文件中
 * @param {object} config webpack chain 配置
 */
function useStyleLoader(config) {
  const cssRule = config.module.rule('css');
  const scssRule = config.module.rule('scss');
  const scssModuleRule = config.module.rule('scss-module');
  const lessRule = config.module.rule('less');
  const lessModuleRule = config.module.rule('less-module');
  cssRule.uses.delete('MiniCssExtractPlugin.loader');
  scssRule.uses.delete('MiniCssExtractPlugin.loader');
  scssModuleRule.uses.delete('MiniCssExtractPlugin.loader');
  lessRule.uses.delete('MiniCssExtractPlugin.loader');
  lessModuleRule.uses.delete('MiniCssExtractPlugin.loader');
  cssRule.use('style-loader').loader('style-loader').before('css-loader');
  scssRule.use('style-loader').loader('style-loader').before('css-loader');
  scssModuleRule.use('style-loader').loader('style-loader').before('css-loader');
  lessRule.use('style-loader').loader('style-loader').before('css-loader');
  lessModuleRule.use('style-loader').loader('style-loader').before('css-loader');
}

async function registerSetter(context, setterMap) {
  return Promise.all(Object.values(setterMap).map((setter) => installModule(context, setter)));
}

module.exports = async (options, pluginOptions = {}) => {
  const { registerUserConfig, registerCliOption } = options;
  const { rootDir, command } = options.context;
  if (!CONSTANTS.SUPPORTED_COMMAND.includes(command)) {
    debug('Command %s not supported.', command);
    return;
  }
  const cliOptions = ['watch', 'skip-demo', 'watch-dist', 'https', 'disable-open'];
  registerCliOption(
    cliOptions.map((name) => ({
      name,
      commands: ['start', 'build'],
    })),
  );
  registerUserConfig(userWebpackConfig);

  const mode = command === 'start' ? 'development' : 'production';
  process.argv.forEach((val, index) => {
    debug(`${index}: ${val}`);
  });

  const { setterMap, engineScope } = pluginOptions;
  if (setterMap) {
    await registerSetter(
      {
        workDir: rootDir,
        npmClient: engineScope === '@alilc' ? 'npm' : 'tnpm',
      },
      setterMap,
    );
  }

  if (mode === 'production') {
    await debounceBuild(options, pluginOptions, true);
    return;
  }
  await debounceStart(options, pluginOptions);
  const watchPattern = path.resolve(rootDir, 'src/**/**');
  const watcher = chokidar.watch(watchPattern);
  ['add', 'change', 'unlink'].forEach((item) => {
    watcher.on(item, async () => {
      await debounceStart(options, pluginOptions);
    });
  });
};

function confirmMetaTypes(rootDir, lowcodeDir, metaTypes) {
  return metaTypes.filter((item) => {
    const metaFilename = item ? `meta.${item}` : 'meta';
    const res = glob.sync(
      path.resolve(rootDir, `${lowcodeDir}/**/${metaFilename}.@(js|ts|jsx|tsx)`),
    );
    return res.length;
  });
}

function confirmRenderPlatforms(rootDir, platforms) {
  const result = platforms.filter((item) => {
    if (item === 'default') return false;
    const viewPath = `src/${item}/components`;
    const res = glob.sync(path.resolve(rootDir, `${viewPath}/**/view.@(js|ts|jsx|tsx)`));
    return res.length;
  });
  result.unshift('default');
  return result;
}

async function build(options, pluginOptions, execCompile) {
  const webPackConfig = getWebpackConfig('production');
  const { context } = options;
  const { rootDir, pkg: package, userConfig = {} } = context;
  const { alias = {} } = userConfig;
  const {
    components,
    metaFormat,
    noParse,
    engineScope,
    metaTypes = META_TYPES,
    bundleEachComponentMeta,
    lowcodeDir = 'lowcode',
    entryPath,
    platforms = [],
  } = pluginOptions || {};
  !noParse &&
    (await initLowCodeSchema(
      rootDir,
      package,
      alias['@'],
      metaFormat,
      metaFormat,
      components,
      engineScope === '@alilc' ? 'npm' : 'tnpm',
      entryPath,
    ));
  const confirmedMetaTypes = confirmMetaTypes(rootDir, lowcodeDir, metaTypes);
  const metaPaths = await Promise.all(
    confirmedMetaTypes.map((item) => {
      return bundleMetaV2(options, pluginOptions, execCompile, item);
    }),
  );
  const metaPathMap = {};
  metaPaths.forEach((item) => {
    metaPathMap[item.slice(item.lastIndexOf('/') + 1, item.lastIndexOf('.'))] = item;
  });
  const confirmedRenderPlatforms = confirmRenderPlatforms(rootDir, platforms);
  const renderViewPathMap = {};
  const renderViewPaths = await Promise.all(
    confirmedRenderPlatforms.map(async (item) => {
      return await bundleRenderView(options, pluginOptions, item, execCompile);
    }),
  );
  renderViewPaths.forEach((item) => {
    renderViewPathMap[item.slice(item.lastIndexOf('/') + 1, item.lastIndexOf('.'))] = item;
  });
  const result = {
    metaPathMap,
    renderViewPathMap,
    platforms: confirmedRenderPlatforms,
    viewPath: await bundleEditorView(
      webPackConfig,
      options,
      pluginOptions,
      metaPathMap,
      confirmedRenderPlatforms,
      execCompile,
    ),
    assetsPaths: await bundleAssets(
      options,
      pluginOptions,
      confirmedMetaTypes,
      confirmedRenderPlatforms,
      execCompile,
    ),
  };
  if (bundleEachComponentMeta) {
    result.componentMetaPath = await bundleComponentMeta(
      webPackConfig,
      options,
      pluginOptions,
      execCompile,
    );
  }
  return result;
}

async function start(options, pluginOptions) {
  const { registerTask, getAllTask, onGetWebpackConfig } = options;
  const { rootDir, pkg: package, commandArgs } = options.context;
  const { https } = commandArgs;
  if (!PARSED_NPM_NAME) {
    PARSED_NPM_NAME = parseNpmName(package.name);
  }
  const {
    package: packageName = package.name,
    library = PARSED_NPM_NAME.uniqueName,
    umdUrls,
    renderUrls,
    editUrls,
    baseLibrary = 'react',
    groups = DEFAULT_GROUPS,
    categories = DEFAULT_CATEGORIES,
    extraAssets = [],
    builtinAssets = [],
    ignoreComponents = {},
    staticResources = {},
    disableStyleLoader = false,
    engineScope = '@ali',
    externals = {},
    setterMap = {},
    fullbackMeta = 'default',
  } = pluginOptions || {};
  if (baseLibrary === 'rax' && Array.isArray(extraAssets)) {
    extraAssets.push(
      'https://g.alicdn.com/code/npm/@alife/mobile-page/0.1.1/build/lowcode/assets-prod.json',
    );
  }
  const metaExportName = `${PARSED_NPM_NAME.uniqueName}Meta`;
  const { viewPath, metaPathMap, renderViewPathMap, platforms } = await debounceBuild(
    options,
    pluginOptions,
    false,
  );
  const devViewUrls = !disableStyleLoader ? ['/view.js'] : ['/view.js', '/view.css'];
  const advancedRenderUrls = {};
  platforms.forEach((platform) => {
    advancedRenderUrls[platform] = [`./${platform}.view.js`];
  });
  let _setterMap = '{';
  const setterImportStr = Object.keys(setterMap || {})
    .map((item) => {
      _setterMap += `\n  ${item},`;
      return `import ${item} from '${setterMap[item]}';`;
    })
    .join('\n');
  _setterMap += '\n}';
  const indexJs = generateEntry({
    template: 'index.jsx',
    filename: 'index.jsx',
    rootDir,
    params: {
      package: packageName,
      version: package.version,
      library,
      urls: JSON.stringify(renderUrls || umdUrls || devViewUrls),
      editUrls: JSON.stringify(editUrls || umdUrls || devViewUrls),
      advancedRenderUrls: JSON.stringify(advancedRenderUrls),
      devMode: true,
      metaExportName,
      baseLibrary,
      groups: JSON.stringify(groups),
      categories: JSON.stringify(categories),
      extraAssets: JSON.stringify(extraAssets),
      builtinAssets: JSON.stringify(builtinAssets),
      ignoreComponents: JSON.stringify(ignoreComponents),
      setterImportStr,
      setterMap: _setterMap,
      metaPathMap: JSON.stringify(metaPathMap),
      fullbackMeta,
    },
  });
  const previewJs = generateEntry({
    template: 'preview.jsx',
    filename: 'preview.jsx',
    rootDir,
    params: {
      isRax: baseLibrary === 'rax',
    },
  });
  if (getAllTask().includes('lowcode-dev')) return;
  registerTask('lowcode-dev', getWebpackConfig('development'));
  onGetWebpackConfig('lowcode-dev', (config) => {
    const entry = {
      index: indexJs,
      preview: previewJs,
      ...metaPathMap,
      ...renderViewPathMap,
    };
    if (!editUrls && !umdUrls) {
      entry.view = viewPath;
    }

    config.merge({
      entry,
    });
    config.plugin('index').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          ...STATIC_RESOURCES_MAP[engineScope],
          ...staticResources,
        },
        template: require.resolve('./public/index.html'),
        filename: 'index.html',
      },
    ]);
    config.plugin('designer').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          ...STATIC_RESOURCES_MAP[engineScope],
          ...staticResources,
        },
        template: require.resolve('./public/designer.html'),
        filename: 'designer.html',
      },
    ]);
    config.plugin('preview').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          previewCssUrl: '',
        },
        template: require.resolve('./public/preview.html'),
        filename: 'preview.html',
      },
    ]);
    config.devServer.headers({ 'Access-Control-Allow-Origin': '*' });

    config.devServer.https(Boolean(https));
    config.devServer.set('transportMode', 'ws');
    // WSL 环境下正常的文件 watch 失效，需切换为 poll 模式
    if (isWsl) {
      config.merge({
        devServer: {
          watchOptions: {
            poll: 1000,
          },
        },
      });
    }
    config.externals({ ...COMMON_EXTERNALS, ...externals });
    !disableStyleLoader && useStyleLoader(config);
    if (baseLibrary === 'rax') {
      config.module.rule('scss').use('rpx-loader').loader('rpx-loader').before('css-loader');
    }
  });
}

async function initLowCodeSchema(
  rootDir,
  package,
  componentsPath,
  devAlias,
  metaFormat,
  components,
  npmClient = 'tnpm',
  lowcodeDir = 'lowcode',
  entryPath,
) {
  if (INIT_STATE) {
    return;
  }
  INIT_STATE = true;
  if (!PARSED_NPM_NAME) {
    PARSED_NPM_NAME = parseNpmName(package.name);
  }
  const entry = getEntry(rootDir, entryPath);
  const lowcodeDirExists = await fse.existsSync(path.resolve(rootDir, lowcodeDir));
  if (lowcodeDirExists) {
    const lowcodeDirs = await fse.readdir(path.resolve(rootDir, lowcodeDir));
    const componentsDirs = await fse.readdir(
      path.resolve(rootDir, componentsPath || 'src/components'),
    );
    const lowcodeDirMap = {};
    lowcodeDirs.forEach((item) => {
      lowcodeDirMap[item] = true;
    });
    const newComponentDir = componentsDirs.filter((dir) => !lowcodeDirMap[dir]);
    if (!newComponentDir || !newComponentDir.length) {
      return;
    }
  }
  let result = await parser.default({ accesser: 'local', entry, npmClient });
  if (!result) {
    // 未解析出结果，默认生成结果
    result = [
      formatComponentSchema({
        componentName: PARSED_NPM_NAME.uniqueName,
        npm: {
          package: package.name,
          version: package.version,
          exportName: 'default',
          main: 'lib/index.js',
          destructuring: false,
          subName: '',
        },
      }),
    ];
  } else if (result.length === 1 && result[0].componentName === 'default') {
    result[0].componentName = PARSED_NPM_NAME.uniqueName;
    if (result[0].title === 'default') {
      result[0].title = PARSED_NPM_NAME.uniqueName;
    }
  }
  const metaDevSubfix = devAlias ? `.${devAlias}` : '';
  const filteredComponents =
    !components || !components.length
      ? result
      : result.filter((item) => item && components.includes(item.componentName));
  filteredComponents.forEach((item) => {
    const componentNameFolder = camel2KebabComponentName(item.componentName);
    if (
      !fse.existsSync(
        path.resolve(
          rootDir,
          `${lowcodeDir}/${componentNameFolder}/meta${metaDevSubfix}.${metaFormat || 'ts'}`,
        ),
      ) &&
      !fse.existsSync(
        path.resolve(rootDir, `${lowcodeDir}/${componentNameFolder}/meta${metaDevSubfix}.js`),
      )
    ) {
      const schema = formatComponentSchema(item);
      if (schema.title === package.name) {
        schema.title = schema.componentName;
      }
      const { snippets } = schema;
      const componentDescription = schema;
      delete componentDescription.snippets;
      fse.outputFileSync(
        path.resolve(
          rootDir,
          `${lowcodeDir}/${componentNameFolder}/meta${metaDevSubfix}.${metaFormat || 'ts'}`,
        ),
        `
import { ComponentMetadata, Snippet } from '@alilc/lowcode-types';

const ${item.componentName}Meta: ComponentMetadata = ${JSON.stringify(
          componentDescription,
          null,
          2,
        )};
const snippets: Snippet[] = ${JSON.stringify(snippets, null, 2)};

export default {
  ...${item.componentName}Meta,
  snippets
};
`,
      );
    }
  });
}

async function bundleMetaV2(options, pluginOptions, execCompile, metaType) {
  const { registerTask, getAllTask, onGetWebpackConfig, context } = options;
  const { rootDir, pkg: package, userConfig = {} } = context;
  if (!PARSED_NPM_NAME) {
    PARSED_NPM_NAME = parseNpmName(package.name);
  }
  const metaExportName = `${PARSED_NPM_NAME.uniqueName}Meta`;
  let { components } = pluginOptions || {};
  const {
    categories = DEFAULT_CATEGORIES,
    externals = {},
    basicLibraryVersion: customBasicLibraryVersion,
    buildTarget = 'build',
    fullbackMeta = 'default',
    lowcodeDir = 'lowcode',
    npmInfo = {},
  } = pluginOptions || {};
  if (components && !Array.isArray(components)) {
    console.error('[@alifd/build-plugin-lowcode] components must be Array<ComponentName: string>');
    components = null;
  }
  const metaSuffix = metaType ? `.${metaType}` : '';
  const metaFilename = `meta${metaSuffix}`;
  let fullbackComponents;
  let fullbackMetaSuffix;
  if (fullbackMeta) {
    fullbackMetaSuffix = fullbackMeta === 'default' ? '' : `.${fullbackMeta}`;
    fullbackComponents = getUsedComponentMetas(
      rootDir,
      lowcodeDir,
      `meta${fullbackMetaSuffix}`,
      components,
    );
  }
  const usedComponents = getUsedComponentMetas(
    rootDir,
    lowcodeDir,
    `meta${metaSuffix}`,
    components,
  );
  const componentsImportStr = fullbackComponents
    .map((component) => {
      const componentNameFolder = camel2KebabComponentName(component);
      let metaJsPath = path.resolve(
        rootDir,
        `${lowcodeDir}/${componentNameFolder}/${metaFilename}`,
      );
      if (!usedComponents.includes(component) && fullbackComponents.includes(component)) {
        metaJsPath = path.resolve(
          rootDir,
          `${lowcodeDir}/${componentNameFolder}/meta${fullbackMetaSuffix}`,
        );
        usedComponents.push(component);
      }
      return `import ${
        component.includes('.') ? component.replace(/\./g, '') : component
      }Meta from '${metaJsPath}'`;
    })
    .join('\n');
  const metaPath = generateEntry({
    template: 'meta.js',
    filename: `meta${metaSuffix}.js`,
    rootDir,
    params: {
      componentsImportStr,
      components: usedComponents.map(
        (component) => `${component.includes('.') ? component.replace(/\./g, '') : component}Meta`,
      ),
      execCompile,
      metaExportName,
      categories: JSON.stringify(categories),
      npmInfo: JSON.stringify(npmInfo || {}),
      version: package.version,
      packageName: package.name,
      basicLibraryVersion: JSON.stringify(customBasicLibraryVersion || BASIC_LIBRARY_VERSION),
    },
  });
  if (!execCompile || getAllTask().includes(`lowcode-meta-${metaType}`)) return metaPath;
  registerTask(`lowcode-meta-${metaType}`, getWebpackConfig('production'));
  onGetWebpackConfig(`lowcode-meta-${metaType}`, (config) => {
    config.merge({
      entry: {
        [`meta${metaSuffix}`]: metaPath,
      },
    });
    config.output.library(metaExportName).libraryTarget('umd');
    config.output.path(path.resolve(rootDir, `${buildTarget}/${lowcodeDir}`));
    config.externals({ ...COMMON_EXTERNALS, ...externals });
    useStyleLoader(config);
  });
  return metaPath;
}

async function bundleEditorView(
  webPackConfig,
  options,
  pluginOptions,
  metaPathMap,
  platforms,
  execCompile,
) {
  const { registerTask, getAllTask, onGetWebpackConfig } = options;
  const { rootDir, pkg: package } = options.context;
  if (!PARSED_NPM_NAME) {
    PARSED_NPM_NAME = parseNpmName(package.name);
  }
  const {
    package: packageName = package.name,
    library = PARSED_NPM_NAME.uniqueName,
    umdUrls,
    renderUrls,
    editUrls,
    baseLibrary = 'react',
    components,
    groups = DEFAULT_GROUPS,
    categories = DEFAULT_CATEGORIES,
    staticResources = {},
    singleComponent = false,
    ignoreComponents = {},
    engineScope = '@ali',
    externals = {},
    setterMap = {},
    buildTarget = 'build',
    fullbackMeta = 'default',
    lowcodeDir = 'lowcode',
    entryPath,
  } = pluginOptions || {};
  const metaExportName = `${PARSED_NPM_NAME.uniqueName}Meta`;
  const advancedRenderUrls = {};
  platforms.forEach((platform) => {
    advancedRenderUrls[platform] = [
      `./render/${platform}/view.js`,
      `./render/${platform}/view.css`,
    ];
  });
  let _setterMap = '{';
  const setterImportStr = Object.keys(setterMap || {})
    .map((item) => {
      _setterMap += `\n  ${item},`;
      return `import ${item} from '${setterMap[item]}';`;
    })
    .join('\n');
  _setterMap += '\n}';
  const indexJsParams = {
    package: packageName,
    version: package.version,
    library,
    urls: JSON.stringify(
      renderUrls ||
        umdUrls || [
          `${buildTarget}/${lowcodeDir}/view.js`,
          `${buildTarget}/${lowcodeDir}/view.css`,
        ],
    ),
    editUrls: JSON.stringify(
      editUrls ||
        umdUrls || [
          `${buildTarget}/${lowcodeDir}/view.js`,
          `${buildTarget}/${lowcodeDir}/view.css`,
        ],
    ),
    advancedRenderUrls: JSON.stringify(advancedRenderUrls),
    metaUrl: `${buildTarget}/${lowcodeDir}/meta.js`,
    devMode: false,
    metaExportName,
    baseLibrary,
    groups: JSON.stringify(groups),
    categories: JSON.stringify(categories),
    ignoreComponents: JSON.stringify(ignoreComponents),
    extraAssets: 'false',
    builtinAssets: 'false',
    setterImportStr,
    setterMap: _setterMap,
    metaPathMap: JSON.stringify(metaPathMap),
    fullbackMeta,
  };
  const indexJs = generateEntry({
    template: 'index.jsx',
    filename: 'index.jsx',
    rootDir,
    params: indexJsParams,
  });
  const previewJs = generateEntry({
    template: 'preview.jsx',
    filename: 'preview.jsx',
    rootDir,
    params: {
      isRax: baseLibrary === 'rax',
    },
  });
  let componentViews;
  let componentViewsExportStr;
  let componentViewsImportStr;
  const lowcodeViewPath = path.resolve(rootDir, `${lowcodeDir}/view.tsx`);
  if (singleComponent && fse.existsSync(lowcodeViewPath)) {
    componentViewsImportStr = `import * as SingleComponentData from '${lowcodeViewPath}'`;
    componentViews = `{
      ...SingleComponentData
    }`;
    componentViewsExportStr = `export { default } from '${lowcodeViewPath}';export * from '${lowcodeViewPath}';`;
  } else {
    const _componentViews = getUsedComponentViews(rootDir, lowcodeDir, components) || [];
    componentViews = `{${_componentViews
      .map((component) => {
        return `${component}: ${component}`;
      })
      .join(',')}}`;
    componentViewsExportStr = _componentViews
      .map((component) => {
        return `const ${component} = getRealComponent(${component}Data, '${component}');\nexport { ${component} };`;
      })
      .join('\n');
    componentViewsExportStr += `\nexport { default } from '${getEntry(rootDir, entryPath)}';`;
    componentViewsImportStr = _componentViews
      .map((component) => {
        const componentNameFolder = camel2KebabComponentName(component);
        const viewJsPath = path.resolve(rootDir, `${lowcodeDir}/${componentNameFolder}/view`);
        return `import * as ${component}Data from '${viewJsPath}'`;
      })
      .join('\n');
  }
  const scssEntry = getScssEntry(rootDir);
  const viewPath = generateEntry({
    template: 'view.js',
    filename: 'view.js',
    rootDir,
    params: {
      entryPath: getEntry(rootDir, entryPath),
      scssImport: scssEntry ? `import '${scssEntry}'` : '',
      componentViews,
      componentViewsExportStr,
      componentViewsImportStr,
      library,
      execCompile,
    },
  });
  console.log('in render view: ', execCompile);
  if (!execCompile || editUrls || umdUrls || getAllTask().includes('lowcode-editor-view'))
    return viewPath;
  registerTask('lowcode-editor-view', webPackConfig);
  onGetWebpackConfig('lowcode-editor-view', (config) => {
    debug('editor view build');
    config.plugin('HtmlWebpackPlugin').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          ...STATIC_RESOURCES_MAP[engineScope],
          ...staticResources,
        },
        template: require.resolve('./public/index.html'),
        filename: 'index.html',
      },
    ]);
    config.plugin('designer').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          ...STATIC_RESOURCES_MAP[engineScope],
          ...staticResources,
        },
        template: require.resolve('./public/designer.html'),
        filename: 'designer.html',
      },
    ]);
    config.plugin('preview').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          previewCssUrl: './preview.css',
        },
        template: require.resolve('./public/preview.html'),
        filename: 'preview.html',
      },
    ]);
    config.merge({
      entry: {
        view: viewPath,
        index: indexJs,
        preview: previewJs,
      },
    });
    config.output.library(library).libraryTarget('umd');
    config.output.path(path.resolve(rootDir, `${buildTarget}/${lowcodeDir}`));
    config.externals({ ...COMMON_EXTERNALS, ...externals });
    if (baseLibrary === 'rax') {
      const scssRule = config.module.rule('scss');
      scssRule.use('rpx-loader').loader('rpx-loader').before('css-loader');
    }
  });
  return viewPath;
}

async function bundleRenderView(options, pluginOptions, platform, execCompile) {
  const { registerTask, getAllTask, onGetWebpackConfig } = options;
  const { rootDir, pkg: package } = options.context;
  if (!PARSED_NPM_NAME) {
    PARSED_NPM_NAME = parseNpmName(package.name);
  }
  const {
    library = PARSED_NPM_NAME.uniqueName,
    umdUrls,
    editUrls,
    baseLibrary = 'react',
    components,
    externals = {},
    buildTarget = 'build',
    lowcodeDir = 'lowcode',
    entryPath,
  } = pluginOptions || {};
  let componentViews;
  let componentViewsExportStr;
  let componentViewsImportStr;
  const _componentViews =
    getUsedComponentViews(rootDir, `src/${platform}/components`, components) || [];
  console.log('_componentViews: ', _componentViews);
  componentViews = `{${_componentViews
    .map((component) => {
      return `${component}: ${component}`;
    })
    .join(',')}}`;
  componentViewsExportStr = _componentViews
    .map((component) => {
      return `const ${component} = getRealComponent(${component}Data, '${component}');\nexport { ${component} };`;
    })
    .join('\n');
  componentViewsExportStr += `\nexport { default } from '${getEntry(rootDir, entryPath)}';`;
  componentViewsImportStr = _componentViews
    .map((component) => {
      const componentNameFolder = camel2KebabComponentName(component);
      const viewJsPath = path.resolve(
        rootDir,
        `src/${platform}/components/${componentNameFolder}/view`,
      );
      return `import * as ${component}Data from '${viewJsPath}'`;
    })
    .join('\n');
  if (platform === 'default') {
    componentViewsExportStr = '';
    componentViewsImportStr = '';
  }
  const scssEntry = getScssEntry(rootDir);
  const viewPath = generateEntry({
    template: 'view.js',
    filename: `${platform}.view.js`,
    rootDir,
    params: {
      entryPath: getEntry(rootDir, entryPath),
      scssImport: scssEntry ? `import '${scssEntry}'` : '',
      componentViews,
      componentViewsExportStr,
      componentViewsImportStr,
      library,
      execCompile,
    },
  });
  if (!execCompile || editUrls || umdUrls || getAllTask().includes(`render-view-${platform}`))
    return viewPath;
  registerTask(`render-view-${platform}`, getWebpackConfig('production'));
  onGetWebpackConfig(`render-view-${platform}`, (config) => {
    debug('render view build: ', viewPath);
    config.merge({
      entry: {
        view: viewPath,
      },
    });
    config.output.library(library).libraryTarget('umd');
    config.output.path(path.resolve(rootDir, `${buildTarget}/${lowcodeDir}/render/${platform}`));
    config.externals({ ...COMMON_EXTERNALS, ...externals });
    if (baseLibrary === 'rax') {
      const scssRule = config.module.rule('scss');
      scssRule.use('rpx-loader').loader('rpx-loader').before('css-loader');
    }
  });
  return viewPath;
}

async function bundleAssets(options, pluginOptions, metaTypes, renderTypes, execCompile) {
  const { onHook } = options;
  const { rootDir, pkg: package } = options.context;
  if (!PARSED_NPM_NAME) {
    PARSED_NPM_NAME = parseNpmName(package.name);
  }
  const metaExportName = `${PARSED_NPM_NAME.uniqueName}Meta`;
  const {
    package: packageName = package.name,
    baseUrl,
    library = PARSED_NPM_NAME.uniqueName,
    umdUrls,
    renderUrls,
    editUrls,
    groups = DEFAULT_GROUPS,
    categories = DEFAULT_CATEGORIES,
    builtinAssets = [],
    extraAssets = [],
    baseLibrary,
    ignoreComponents = {},
    buildTarget = 'build',
    engineScope = '@ali',
    lowcodeDir = 'lowcode',
  } = pluginOptions || {};

  if (baseLibrary === 'rax' && Array.isArray(extraAssets)) {
    extraAssets.push(
      `https://g.alicdn.com/code/npm/@alife/mobile-page/0.1.1/build/lowcode/assets-prod.json`,
    );
  }
  const baseSchemas = await Promise.all(
    builtinAssets.map(async (url) => {
      if (typeof url === 'object') {
        return url;
      } else {
        try {
          return await axios(url).then(({ data }) => data);
        } catch (e) {
          console.error(
            `[@alifd/build-plugin-lowcode] get assets data from builtin assets ${url} failed: `,
            e,
          );
          return {};
        }
      }
    }),
  );
  const extraSchemas = await Promise.all(
    extraAssets.map(async (url) => {
      if (typeof url === 'object') {
        return url;
      } else {
        try {
          return await axios(url).then(({ data }) => data);
        } catch (e) {
          console.error(
            `[@alifd/build-plugin-lowcode] get assets data from builtin assets ${url} failed: `,
            e,
          );
          return {};
        }
      }
    }),
  );
  const assetsPaths = await Promise.all(
    ['daily', 'prod', 'dev'].map(async (item) => {
      const _baseUrl =
        (baseUrl && baseUrl[item]) ||
        `${UNPKG_BASE_URL_MAP[engineScope]}/${package.name}@${package.version}`;
      let urls;
      let metaUrl;
      const metaUrls = {};
      const advancedRenderUrls = {};
      const advancedEditUrls = {};
      const advancedMetaUrls = {};
      if (item === 'dev') {
        urls = JSON.stringify([`./view.js`, `./view.css`]);
        metaTypes.forEach((item) => {
          const _url = item ? `./meta.${item}.js` : './meta.js';
          if (!metaUrl) metaUrl = _url;
          metaUrls[item || 'default'] = _url;
          advancedMetaUrls[item || 'default'] = [_url];
        });
        renderTypes.forEach((renderType) => {
          advancedRenderUrls[renderType] = [
            `./render/${renderType}.view.js`,
            `./render/${renderType}.view.css`,
          ];
        });
      } else {
        urls = JSON.stringify([
          `${_baseUrl}/${buildTarget}/${lowcodeDir}/view.js`,
          `${_baseUrl}/${buildTarget}/${lowcodeDir}/view.css`,
        ]);
        metaTypes.forEach((item) => {
          const _url = item
            ? `${_baseUrl}/${buildTarget}/${lowcodeDir}/meta.${item}.js`
            : `${_baseUrl}/${buildTarget}/${lowcodeDir}/meta.js`;
          if (!metaUrl) metaUrl = _url;
          metaUrls[item || 'default'] = _url;
          advancedMetaUrls[item || 'default'] = [_url];
        });
        renderTypes.forEach((renderType) => {
          advancedRenderUrls[renderType] = [
            `${_baseUrl}/${buildTarget}/${lowcodeDir}/render/${renderType}/view.js`,
            `${_baseUrl}/${buildTarget}/${lowcodeDir}/render/${renderType}/view.css`,
          ];
        });
      }
      const _urls = advancedRenderUrls.default || renderUrls || umdUrls;
      const _editUrls = editUrls || umdUrls;
      const assetsPath = generateEntry({
        template: 'assets.json',
        filename: `assets-${item}.json`,
        rootDir,
        params: {
          package: packageName,
          version: package.version,
          library,
          urls: _urls ? JSON.stringify(_urls) : urls,
          editUrls: _editUrls ? JSON.stringify(_editUrls) : urls,
          metaUrl,
          metaUrls: JSON.stringify(metaUrls),
          metaExportName,
          groups: JSON.stringify(groups),
          categories: JSON.stringify(categories),
          ignoreComponents: JSON.stringify(ignoreComponents),
          advancedRenderUrls: JSON.stringify(advancedRenderUrls),
          advancedEditUrls: JSON.stringify(advancedEditUrls),
          advancedMetaUrls: JSON.stringify(advancedMetaUrls),
        },
      });
      let schemas = baseSchemas;
      if (item === 'dev') {
        schemas = [...extraSchemas, ...baseSchemas];
      }
      const assetsData = require(assetsPath);
      schemas.forEach((schemaItem) => {
        mergeWith(assetsData, schemaItem, (objValue, srcValue) => {
          if (Array.isArray(objValue) && Array.isArray(srcValue)) {
            if (typeof objValue[0] === 'string') {
              const tempMap = {};
              srcValue.forEach((srcItem) => {
                tempMap[srcItem] = true;
              });
              objValue.forEach((objItem) => {
                if (!tempMap[objItem]) {
                  srcValue.push(objItem);
                }
              });
              return srcValue;
            } else {
              return srcValue.concat(objValue);
            }
          }
        });
      });
      const packageMap = {};
      assetsData.packages.forEach((packageItem) => {
        if (!packageMap[packageItem.package]) {
          packageMap[packageItem.package] = packageItem;
        }
      });
      assetsData.packages = Object.values(packageMap);
      fse.outputFileSync(assetsPath, JSON.stringify(assetsData, null, 2));
      return assetsPath;
    }),
  );
  if (!execCompile) return assetsPaths;
  onHook('after.build.compile', () => {
    ['dev', 'daily', 'prod'].forEach((item) => {
      const filename = `assets-${item}.json`;
      const targetPath = path.resolve(rootDir, `${buildTarget}/${lowcodeDir}/${filename}`);
      const originPath = path.resolve(rootDir, `.tmp/${filename}`);
      if (!fse.existsSync(originPath)) {
        return;
      }
      fse.outputFileSync(targetPath, JSON.stringify(require(originPath), null, 2));
    });
    updatePackage(rootDir, baseUrl, lowcodeDir, buildTarget, engineScope);
  });
  return assetsPaths;
}

function updatePackage(
  rootDir,
  baseUrl,
  lowcodeDir = 'lowcode',
  buildTarget = 'build',
  engineScope = '@ali',
) {
  const packageData = require(path.resolve(rootDir, 'package.json'));
  let { componentConfig } = packageData;
  if (!componentConfig) {
    componentConfig = {};
  }
  const isBetaVersion = packageData.version.includes('-beta');
  const _baseUrl =
    (baseUrl && (isBetaVersion ? baseUrl.daily : baseUrl.prod)) ||
    `${UNPKG_BASE_URL_MAP[engineScope]}/${packageData.name}@${packageData.version}`;
  componentConfig.materialSchema = `${_baseUrl}/${buildTarget}/${lowcodeDir}/assets-${
    isBetaVersion ? 'daily' : 'prod'
  }.json`;
  packageData.componentConfig = componentConfig;
  fse.outputFileSync(path.resolve(rootDir, 'package.json'), JSON.stringify(packageData, null, 2));
}

async function bundleComponentMeta(webPackConfig, options, pluginOptions, execCompile) {
  const { registerTask, getAllTask, onGetWebpackConfig, context, onHook } = options;
  const { rootDir, pkg: package } = context;
  let { components } = pluginOptions || {};
  const {
    devAlias,
    externals = {},
    buildTarget = 'build',
    lowcodeDir = 'lowcode',
  } = pluginOptions || {};
  if (components && !Array.isArray(components)) {
    console.error('[@alifd/build-plugin-lowcode] components must be Array<ComponentName: string>');
    components = null;
  }

  const metaDevSubfix = devAlias ? `.${devAlias}` : '';
  const metaFilename = `meta${metaDevSubfix}`;
  const usedDevComponents = getUsedComponentMetas(rootDir, `meta${metaDevSubfix}`, components);

  const componentsMetaPath = usedDevComponents.map((component) => {
    const componentMetaExportName = `${component}Meta`;
    const componentNameFolder = camel2KebabComponentName(component);
    const componentJsPath = `${lowcodeDir}/${componentNameFolder}/${metaFilename}`;
    const metaJsPath = path.resolve(rootDir, componentJsPath);
    const componentMetaName = `${component}Meta`;
    const componentImportStr = `import ${componentMetaName} from '${metaJsPath}';`;
    const componentMetaPath = generateEntry({
      template: 'component-meta.js',
      filename: `${componentJsPath}.js`,
      rootDir,
      params: {
        componentProps: COMPONENT_PROPS,
        componentImportStr,
        component: componentMetaName,
        execCompile,
        componentMetaExportName,
        version: package.version,
        packageName: package.name,
      },
    });
    return componentMetaPath;
  });

  usedDevComponents.forEach((component, idx) => {
    (function (comp, index) {
      const componentNameFolder = camel2KebabComponentName(comp);
      const taskName = `lowcode-${componentNameFolder}-meta`;
      if (!execCompile || getAllTask().includes(taskName)) return componentsMetaPath;
      registerTask(taskName, getWebpackConfig('production'));
      onGetWebpackConfig(taskName, (config) => {
        const componentMetaExportName = `${comp}Meta`;
        const componentJsPath = `${lowcodeDir}/${componentNameFolder}/${metaFilename}`;
        config.merge({
          entry: {
            [componentJsPath]: componentsMetaPath[index],
          },
        });
        config.output.library(componentMetaExportName).libraryTarget('umd');
        config.output.path(path.resolve(rootDir, `${buildTarget}/${lowcodeDir}`));
        config.externals({ ...COMMON_EXTERNALS, ...externals });
        useStyleLoader(config);
      });
    })(component, idx);
  });

  onHook('after.build.compile', () => {
    usedDevComponents.forEach((comp) => {
      const componentNameFolder = camel2KebabComponentName(comp);
      const componentJsPath = `${lowcodeDir}/${componentNameFolder}/${metaFilename}`;
      const originPath = path.resolve(
        rootDir,
        `${buildTarget}/${lowcodeDir}/${componentJsPath}.js`,
      );

      // 把meta.js里面的window替换成this
      const jsContent = fse.readFileSync(originPath, 'utf-8');
      const jsContentTarget = jsContent.replace('window', 'this');
      fse.outputFileSync(originPath, jsContentTarget);

      try {
        const targetPath = path.resolve(
          rootDir,
          `${buildTarget}/${lowcodeDir}/${componentJsPath}.json`,
        );
        fse.outputFileSync(targetPath, JSON.stringify(require(originPath), null, 2));
      } catch (e) {}
    });
  });

  return componentsMetaPath;
}

// function transferMeta2Json(rootDir) {
//   require('jsdom-global')();
//   // globalThis = global;
//   const jsdom = require('jsdom');
//   const { JSDOM } = jsdom;
//   const DOM = new JSDOM(
//     `
// <!DOCTYPE html>
// <html lang="en">

// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <meta http-equiv="X-UA-Compatible" content="ie=edge">
// <title>DEMO 预览</title>
// </head>

// <body>
// <div id="lce-container"></div>
// </body>
// </html>
//   `,
//     {
//       runScripts: 'dangerously',
//       resources: 'usable',
//       storageQuota: 10000000,
//       url: 'https://example.org?appCode=test',
//     },
//   );
//   const { window } = DOM;
//   window.onload = () => {
//     debug('ready to roll!');
//     try {
//       const p = require(path.resolve(rootDir, 'build/lowcode/meta.js'));
//       fse.outputFileSync(
//         path.resolve(rootDir, 'build/lowcode/meta.json'),
//         toJson(p.default.assetsProd),
//       );
//     } catch (e) {
//       debug('error: ', e);
//     }
//     process.exit(0);
//   };
// }
