import * as path from 'path';
import { last } from 'lodash';
import WebpackChain from 'webpack-chain';

function getFilename(filePath?: string): string {
  return last((filePath || '').split('/'));
}

export default function setAssetsPath(
  config: WebpackChain,
  outputAssetsPath = { js: '', css: '' },
) {
  const filename = getFilename(config.output.get('filename'));
  config.output.filename(path.join(outputAssetsPath.js, filename));
  const options = config.plugin('MiniCssExtractPlugin').get('args')[0];
  config.plugin('MiniCssExtractPlugin').tap(args => {
    return [
      {
        filename: path.join(outputAssetsPath.css, getFilename(options.filename))
      }
    ];
  });
};
