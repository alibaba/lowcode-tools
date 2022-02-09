/**
 * 去除 minicss 的逻辑
 * @param {*} config 
 */
 export default (config) => {
  ['scss', 'css', 'less'].forEach((item) => {
    config.module.rules.delete(item);
    const newConfig = config.module.rule(item).test(new RegExp(`\\.${item}$`))
      .exclude.add(new RegExp(`\\.module\\.${item}$`)).end()
      .use('style')
      .loader(require.resolve('style-loader'))
      .end()
      .use("css")
      .loader(require.resolve("css-loader"))
      .end()
      .use("postcss")
      .loader(require.resolve("postcss-loader"))
      .options({
        ident: "postcss",
        plugins: () => [
          // eslint-disable-next-line
          require("postcss-preset-env")({
            autoprefixer: {
              flexbox: "no-2009",
            },
            stage: 3,
          }),
        ],
      })
      .end();
    if (item !== 'css') {
      const loaderName = `${item === 'scss' ? 'sass' : item}-loader`
      newConfig.use(loaderName)
        .loader(require.resolve(loaderName))
        .end();
    }
  })
}