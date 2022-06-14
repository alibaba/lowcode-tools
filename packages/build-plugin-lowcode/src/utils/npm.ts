const path = require('path');
const { pathExists } = require('fs-extra');
const spawn = require('cross-spawn-promise');

async function isNPMInstalled(args) {
  return pathExists(path.join(args.workDir, 'node_modules'));
}

async function install(args) {
  if (await isNPMInstalled(args)) return;
  const { workDir, npmClient = 'tnpm' } = args;
  try {
    await spawn(npmClient, ['i'], { stdio: 'inherit', cwd: workDir });
  } catch (e) {
    // TODO
  }
}

async function isNPMModuleInstalled(args, name) {
  const modulePkgJsonPath = path.resolve(args.workDir || '', 'node_modules', name, 'package.json');
  return pathExists(modulePkgJsonPath);
}

async function installModule(args, name) {
  if (await isNPMModuleInstalled(args, name)) return;
  const { workDir, npmClient = 'tnpm' } = args;
  try {
    await spawn(npmClient, ['i', name], { stdio: 'inherit', cwd: workDir });
  } catch (e) {
    // TODO
  }
}

module.exports = {
  installModule,
  install,
};
