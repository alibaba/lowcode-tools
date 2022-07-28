import * as fs from 'fs-extra';
import * as path from 'path';
import * as spawn from 'cross-spawn';
import { pascal } from 'case';
import * as ejs from 'ejs';
import * as dayjs from 'dayjs';
import * as glob from 'glob';
import * as chalk from 'chalk'
import { IAnswer } from './interface';
import { getInstallPath, transformFileName } from './utils';

export default class InitFunc {
  projectName: string;
  installPath: string;
  templatePkg: string;
  copyPath: string;
  answers: IAnswer;
  prefix: string;
  useBeta: boolean;
  constructor({ argv, answers, templatePkg, prefix }) {
    this.projectName = argv['_'][0] || './';
    this.installPath = getInstallPath();
    this.templatePkg = templatePkg;
    this.copyPath = path.join(process.cwd(), this.projectName);
    this.answers = answers;
    this.prefix = prefix;
    this.useBeta = argv.beta;
  }
  addPrefix(name) {
    const prefix = this.prefix;
    if (new RegExp(`^${prefix}`).test(name)) {
      return name;
    }
    return `${prefix}-${name}`;
  }
  isDirEmpty(dir) {
    return glob.sync('**', {
      cwd: dir,
      nodir: true,
      dot: true,
    }).length === 0;
  }
  ensureInstallPath() {
    fs.ensureDirSync(this.installPath);
  }
  installTpl() {

    spawn.sync('npm', [
      'install', 
      `${this.templatePkg}${this.useBeta ? '@beta' : '@latest'}`, 
      '--no-save', 
      '--no-package-lock', 
      '--no-shrinkwrap',
      '--registry=https://registry.npmmirror.com',
    ], { stdio: 'inherit', cwd: this.installPath });
  }

  renderTpl() {
    const templatePath = path.join(this.installPath, 'node_modules', this.templatePkg, 'proj');
    const setterName = this.addPrefix(this.answers.projectName);
    const setterComponentName = pascal(setterName);
    const renderData = {
      ...this.answers,
      name: setterName,
      componentName: setterComponentName,
      version: '1.0.0',
      nowDate: dayjs().format('YYYY-MM-DD'),
    };
    fs.ensureDirSync(this.copyPath);
    if (!this.isDirEmpty(this.copyPath)) {
      console.log(chalk.red('需要初始化的项目目录不为空，请清空后重试'));
      return;
    }
    glob.sync('**', {
      cwd: templatePath,
      nodir: true,
      dot: true,
      ignore: ['node_modules/**'],
    }).forEach((fileName) => {
      const filePath = path.join(templatePath, fileName);
      const fileTpl = fs.readFileSync(filePath, 'utf-8');
      const fileContent = ejs.render(fileTpl, renderData);
      const copyPath = path.join(this.copyPath, transformFileName(fileName));
      fs.ensureFileSync(copyPath);
      fs.writeFileSync(copyPath, fileContent);
    });
  }

  initInstallPathPackageJson() {
    const pkgPath = path.join(this.installPath, 'package.json');
    const isExist = fs.pathExistsSync(pkgPath);
    if (isExist) return;
    fs.writeFileSync(pkgPath, JSON.stringify({ private: true }, null, ' '));
  }

  init() {
    console.log(chalk.green('正在为你初始化项目，请稍等...'));
    this.ensureInstallPath();
    this.initInstallPathPackageJson();
    this.installTpl();
    this.renderTpl();
  }
}