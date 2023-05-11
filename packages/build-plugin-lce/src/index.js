const path = require('path');
const fs = require('fs-extra');
const { getWebpackConfig, getJestConfig } = require('build-scripts-config');
const openBrowser = require('react-dev-utils/openBrowser');
const chokidar = require('chokidar');

const getRightEntryExtname = require('./common/getRightEntryExtname');
const getUMDWebpack = require('./common/getUMDWebpack');
const htmlInjection = require('./common/htmlInjection');
const setDevLog = require('./common/setDevLog');
const setSassStyleExpanded = require('./common/setSassStyleExpanded');

const defaultUserConfig = require('./configs/userConfig');
const reactUserConfig = require('./configs/react/userConfig');
const babelCompiler = require('./compiler/babel');

module.exports = ({
  context,
  registerTask,
  registerCliOption,
  registerUserConfig,
  onHook,
  log,
  onGetJestConfig,
}) => {
  const { command, rootDir, commandArgs, userConfig } = context;
  const { plugins, ...compileOptions } = userConfig;
  const { library } = compileOptions;

  // config htmlInjection for once
  if (userConfig.htmlInjection) {
    htmlInjection.configWebpack(userConfig.htmlInjection);
  }

  /**
   * register task for demo
   */
  const mode = command === 'start' ? 'development' : 'production';
  const webpackConfig = getWebpackConfig(mode);

  setSassStyleExpanded(webpackConfig);

  /**
   * # register task for production
   */
  // get the right index entry from the src folder
  const extNames = getRightEntryExtname(path.resolve(rootDir, 'src/'));
  let hasMain = false;
  if (fs.existsSync(path.join(rootDir, 'src', 'main.scss'))) {
    hasMain = true;
  }
  // pack the right entry files to dist
  if (extNames && library && (command === 'build' || commandArgs.watchDist)) {
    registerTask('component-dist', getUMDWebpack({ context, compileOptions, extNames, hasMain }));
  }

  // register cli options
  const cliOptions = ['watch', 'watch-dist', 'https', 'disable-open'];
  registerCliOption(
    cliOptions.map((name) => ({
      name,
      commands: ['start', 'build'],
    })),
  );

  // register user config
  registerUserConfig(defaultUserConfig.concat(reactUserConfig));

  if (commandArgs.watch) {
    const srcPath = path.join(rootDir, 'src');
    const watcher = chokidar.watch(srcPath, {
      ignoreInitial: true,
      interval: 1000,
    });
    watcher.on('change', (file) => {
      log.info(`${file} changed, start compile library.`);
      babelCompiler(context, {
        log,
        userOptions: compileOptions,
        type: 'react',
      });
    });

    watcher.on('error', (error) => {
      log.error('fail to watch file', error);
    });
  }

  if (command === 'test') {
    // jest config
    onGetJestConfig((jestConfig) => {
      const { moduleNameMapper, ...rest } = jestConfig;
      const defaultJestConfig = getJestConfig({ rootDir, moduleNameMapper });
      return {
        ...defaultJestConfig,
        ...rest,
        // defaultJestConfig.moduleNameMapper already combine jestConfig.moduleNameMapper
        moduleNameMapper: defaultJestConfig.moduleNameMapper,
      };
    });
  }

  const compilerHook = 'before.build.load';
  onHook(compilerHook, async () => {
    /**
     * # generate es and lib by using babel.
     */
    babelCompiler(context, {
      log,
      userOptions: compileOptions,
      type: 'react',
    });
  });

  onHook('after.start.compile', async ({ urls, stats }) => {
    // 自定义 log 内容
    setDevLog({ log, context, urls, stats });
  });

  onHook('after.start.devServer', ({ url }) => {
    // do not open browser when restart dev
    if (!process.env.RESTART_DEV && !commandArgs.disableOpen) {
      openBrowser(url);
    }
  });
};
