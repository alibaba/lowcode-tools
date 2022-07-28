import * as os from 'os';
import * as path from 'path';

export const getInstallPath = () => {
  const homeDir = os.homedir();
  return path.join(homeDir, '.altrc');
}

export const transformFileName = (fileName) => {
  if (fileName === '_gitignore') {
    return '.gitignore';
  }
  if (fileName === '_npmignore') {
    return '.npmignore';
  }
  return fileName;
}