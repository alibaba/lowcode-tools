import * as os from 'os';
import * as path from 'path';

export const getFilePath = () => {
  const homedir = os.homedir();
  const cacheFilePath = path.join(homedir, '.altrc', 'inject.json');
  return cacheFilePath;
}