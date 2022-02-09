//@ts-nocheck 
//插件调试入口文件
function getDefault(module) {
  if (module.__esModule) {
    return module.default
  }

  return module;
}

const Module = getDefault(require(__altUtilsName));
const result = { "name": name, module: Module, pluginType: 'vuPlugin', type: __bundleType };
console.info('[vdev] Generating: ', result);
export default result;
