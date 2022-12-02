import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import InitFunc from './base';

export default async (answers) => {
  new InitFunc({
    argv: yargs(hideBin(process.argv)).argv,
    answers,
    templatePkg: '@alilc/lowcode-template-editor',
    prefix: 'lowcode-editor',
  }).init();
}