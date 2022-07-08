import Config from "webpack-chain"

/**
 * 去除 minicss 的逻辑
 * @param {*} config 
 */
export default (config: Config) => {
  config.plugins.delete('MiniCssExtractPlugin');
  ['scss', 'css', 'less'].forEach((ruleName) => {
    ['', '-module'].forEach((suffix) => {
      const finalRuleName = `${ruleName}${suffix}`;
      config.module.rule(finalRuleName).uses.delete('MiniCssExtractPlugin.loader');
      config.module.rule(finalRuleName)
        .use('style-loader')
        .before('css-loader')
        .loader(require.resolve('style-loader'));
    });
  });
}