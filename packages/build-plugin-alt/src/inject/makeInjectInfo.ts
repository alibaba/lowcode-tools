import * as fs from 'fs-extra';
import { getFilePath } from './utils';

export default ({ pkg, port, type, library }) => {
  const cacheFilePath = getFilePath();
  fs.ensureFileSync(cacheFilePath);
  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  } catch (e) { }
  if (type !== 'component') {
    cache[`${port}-utils`] = {
      packageName: pkg.name,
      type: type === 'plugin' ? 'designerPlugin' : 'setter',
      library,
      subType: '',
      url: `http://127.0.0.1:${port}/js/utils.js?name=${pkg.name}`,
    };
  } else {
    cache[`${port}-view`] = {
      packageName: pkg.name,
      library,
      type: 'view',
      url: `http://127.0.0.1:${port}/view.js?name=${pkg.name}`,
    };
    cache[`${port}-meta`] = {
      packageName: pkg.name,
      library,
      type: 'meta',
      url: `http://127.0.0.1:${port}/meta.js?name=${pkg.name}`,
    }
  }

  fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, ' '));
}