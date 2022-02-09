import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fs as fieFs } from 'fie-api';
import * as inquirer from 'inquirer';
import Base from './base';

class InitComponent extends Base {
  constructor(options) {
    super(options);
  }
  renderTpl() {
    const src = path.join(this.installPath, 'node_modules', this.templatePkg, 'projectTemplate');
    const copyParams = {
      src,
      dist: this.copyPath,
      data: this.answers,
      templateSettings: {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
      }
    };
    fieFs.copyDirectory(copyParams);
  }
};

export default async (answers) => {
  const promptList = [{
    type: 'list',
    name: 'packageType',
    message: '请选择包模式',
    choices: [{
      name: 'pc-单包模式',
      value: 'pc-single',
    }, {
      name: 'pc-多包模式',
      value: 'pc-multiple',
    }, {
      name: '跨端-单包模式',
      value: 'mobile-single',
    }, {
      name: '跨端-多包模式',
      value: 'mobile-multiple',
    }],
    default: 'pc-single',
  }];
  const result = await inquirer.prompt(promptList);
  new InitComponent({
    argv: yargs(hideBin(process.argv)).argv,
    answers: {
      ...result,
      ...answers,
    },
    templatePkg: `@alifd/${result.packageType}-component-template`,
    prefix: 'lowcode-setter',
  }).init();
}