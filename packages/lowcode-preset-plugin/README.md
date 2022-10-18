## Usage

// in build.lowcode.js

```
[
  '@alifd/build-plugin-lowcode',
  {
    library,
    engineScope: "@alilc",
    staticResources: {
      enginePresetJsUrl: 'https://cdn.jsdelivr.net/npm/@alilc/lowcode-preset-plugin@0.1.1/dist/lowcode-preset-plugin.js',
      enginePresetCssUrl: 'https://cdn.jsdelivr.net/npm/@alilc/lowcode-preset-plugin@0.1.1/dist/lowcode-preset-plugin.css'
    },
    externals: {
      '@alifd/lowcode-preset-plugin': 'window.LowcodePresetPlugin'
    }
  },
],
```

## Develop

npm start