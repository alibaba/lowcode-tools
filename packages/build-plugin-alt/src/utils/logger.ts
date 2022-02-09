import { green, cyan } from 'kolorist';

type IInfo = (msg: string, options?: {needBreak?: boolean}) => void;

export const info: IInfo = (msg, options = {}) => {
  const { needBreak } = options;
  console.log(`${needBreak ? '\n' : ''}${green('info')} ${cyan('[ALT]')} ${msg}`)
}