const glob = require("glob");
const babel = require("@babel/core");
const path = require("path");
const fs = require("fs-extra");
const getRaxBabelConfig = require("rax-babel-config");
const getCompileBabel = require("build-plugin-component/src/utils/getCompileBabel");
const dts = require('build-plugin-component/src/compiler/dts');

const defaultDynamicImportLibraries = [
  "antd",
  "@alifd/next",
  "@alife/next",
  "@icedesign/base",
];

const getBabelConfig = ({
  target,
  componentLibs = defaultDynamicImportLibraries,
  rootDir,
  babelPlugins,
  babelOptions,
  type,
  alias,
  root = 'lowcode',
}) => {
  const params = target === "es" ? { modules: false } : {};
  let babelConfig;
  if (type === "react") {
    babelConfig = getCompileBabel(params, {
      babelPlugins,
      babelOptions,
      rootDir,
    });
  } else {
    babelConfig = getRaxBabelConfig({
      // Be careful~ change it's value by inlineStyle may cause break-change
      styleSheet: true,
      custom: {
        ignore: ["**/**/*.d.ts"],
      },
      ...params,
    });
    babelConfig.presets.push([
      require.resolve("@babel/preset-typescript"),
      { jsxPragma: "createElement" },
    ]);

    babelConfig.plugins = [...babelConfig.plugins, ...(babelPlugins || [])];
  }
  // generate babel-plugin-import config
  const plugins = [];
  componentLibs.forEach((libraryName) => {
    // check es folder if target is es
    const pluginOption = {
      libraryName,
      style: false, // style file will be require in style.js
    };
    if (target === "es") {
      ["es", "esm"].some((item) => {
        const dirPath = path.join(rootDir, "node_modules", libraryName, item);
        const dirExist = fs.existsSync(dirPath);

        if (dirExist) {
          pluginOption.libraryDirectory = item;
        }

        return dirExist;
      });
    }
    plugins.push([
      require.resolve("babel-plugin-import"),
      pluginOption,
      libraryName,
    ]);
  });
  babelConfig.plugins = babelConfig.plugins.concat(plugins);
  if (alias) {
    const aliasRelative = {};
    Object.keys(alias).forEach((aliasKey) => {
      let aliasValue = alias[aliasKey];
      aliasValue = aliasValue.replace('src', target);
      aliasRelative[aliasKey] = aliasValue.startsWith("./")
        ? aliasValue
        : `./${aliasValue}`;
    });
    babelConfig.plugins = babelConfig.plugins.concat([
      [
        require.resolve("babel-plugin-module-resolver"),
        {
          root: [root, target],
          alias: aliasRelative,
        },
      ],
    ]);
  }
  return babelConfig;
};

const findGitIgnorePath = (rootDir) => {
  let dir = rootDir;
  let gitignorePath;
  while (dir !== '/') {
    const tempPath = path.join(dir, ".gitignore")
    const fileExists = fs.pathExistsSync(tempPath);
    if (fileExists) {
      gitignorePath = tempPath;
      break;
    } else {
      dir = path.dirname(dir);
    }
  }
  return gitignorePath;
}

const reg = {
  REG_TS: /\.(tsx?)$/,
  REG_D_TS: /\.d\.ts$/,

  REG_JS: /\.(jsx?|tsx?)$/,
  REG_SASS: /\.(sa|sc|c)ss$/,
  REG_LESS: /\.(le|c)ss$/,

  REG_JS_INDEX: /index\.(jsx?|tsx?)$/,
  REG_SASS_INDEX: /index\.(sa|sc|c)ss$/,
  REG_LESS_INDEX: /index\.(le|c)ss$/,
};


const babelCompile = async ({
  source,
  target,
  rootDir,
  userOptions,
  type = "react",
}) => {
  const { REG_SASS, REG_LESS, REG_JS, REG_D_TS } = reg;
  const filesPath = glob.sync("**/*.*", {
    cwd: source,
    ignore: ["node_modules/**"],
  });
  const compileInfo = [];
  ['lib', 'es'].forEach((target) => {
    const targetPath = `${source}_${target}`;
    const distDirPath = path.join(rootDir, targetPath);
    const { babelPlugins = [], babelOptions = [], alias } = userOptions;
    fs.removeSync(distDirPath);
    fs.ensureDirSync(distDirPath);
    filesPath.forEach((filePath) => {
      const sourceFile = path.join(rootDir, source, filePath);
      if (!REG_JS.test(filePath) || REG_D_TS.test(filePath)) {
        // copy file if it does not match REG_JS
        try {
          fs.copySync(sourceFile, path.join(distDirPath, filePath));
          console.log(`file ${filePath} copied`);
        } catch (err) {
          throw new Error(err);
        }
      } else {
        const distFile = path.join(distDirPath, filePath.replace(REG_JS, ".js"));
        const babelConfig = getBabelConfig({
          target,
          rootDir,
          babelOptions,
          babelPlugins,
          type,
          alias,
        });
        const { code } = babel.transformFileSync(sourceFile, {
          filename: distFile,
          ...babelConfig,
        });
        fs.ensureDirSync(path.dirname(distFile));
        fs.writeFileSync(distFile, code, "utf-8");
        compileInfo.push({
          filePath,
          sourceFile,
          destPath: distDirPath,
        });
      }
    });
    // 检查 .gitignore 如果没有产出路径，则增加该配置
    const gitignorePath = findGitIgnorePath(rootDir);
    if (gitignorePath) {
      const gitignoreFile = fs.readFileSync(gitignorePath, "utf-8");
      if (!(new RegExp(`${targetPath}/`)).test(gitignoreFile)) {
        const newGitignoreFile = `${targetPath}/\r\n${gitignoreFile}`;
        fs.writeFileSync(gitignorePath, newGitignoreFile);
      }
    }
  });
  // 生成声明文件
  dts(compileInfo, {
    log: console,
  })
};

babelCompile.getBabelConfig = getBabelConfig;
module.exports = babelCompile;