/** 生成 lowcode 的入口文件（meta.js, view.js） */
const fs = require("fs-extra");
const path = require("path");
const babel = require("@babel/core");
const { getBabelConfig } = require("./babel");
const { glob } = require("glob");

const getAvailableFileName = ({ fileName, lowcodeDir, rootDir }) => {
  let finalName = fileName;
  
  while (true) {
    const files = glob.sync(`${finalName}.*`, {
      cwd: lowcodeDir,
      ignore: ["node_modules/**"],
    });
    const fileHasExists = files.some((f) => {
      return /\.j|tsx?$/.test(f);
    });
    if (fileHasExists) {
      finalName = `${finalName}_entry`
    } else {
      break;
    }
  }
  return finalName;
};

module.exports = async ({
  rootDir,
  tmpDir = ".tmp",
  lowcodeDir = "lowcode",
  userOptions,
  type = "react",
  package,
}) => {
  const { babelPlugins = [], babelOptions = [], alias } = userOptions;
  const exportsData = {
    "./prototype": {},
    "./prototypeView": {},
    "./*": './*',
  };
  const targetExportsMap = {
    'lib': 'require',
    'es': 'import',
  };
  const fileNameEntryMap = {
    meta: './prototype',
    view: './prototypeView',
  };
  ['lib', 'es'].forEach((target) => {
    const babelConfigOptions = {
      target,
      babelOptions,
      babelPlugins,
      type,
      alias,
      rootDir,
    };
    const babelConfig = getBabelConfig(babelConfigOptions);
    ["meta", "view"].forEach((fileName) => {
      const filePath = path.join(rootDir, tmpDir, `${fileName}.js`);
      let fileContent = fs.readFileSync(filePath, "utf-8");
      fileContent = fileContent
        .replace(new RegExp(path.join(rootDir, "lowcode"), "g"), ".")
        .replace(new RegExp(path.join(rootDir, "src"), "g"), `../${target}`)
        .replace(/\.ts(x)?('|")/g, "$2")
        .replace(/\\\\/g, "/");
      const targetPath = `${lowcodeDir}_${target}`;
      if (!package.files.includes(`${targetPath}/`)) {
        package.files.push(`${targetPath}/`);
      }
      const entryName = getAvailableFileName({ fileName, lowcodeDir, rootDir });
      exportsData[fileNameEntryMap[fileName]][targetExportsMap[target]] = `./${targetPath}/${entryName}.js`;
      const distFilePath = path.join(rootDir, targetPath, `${entryName}.js`);
      const { code } = babel.transformSync(fileContent, {
        filename: distFilePath,
        ...babelConfig,
      });
      fs.ensureDirSync(path.dirname(distFilePath));
      fs.writeFileSync(distFilePath, code, "utf-8");
    });
  });
  package.exports = {
    ...package.exports,
    ...exportsData,
  };
};
