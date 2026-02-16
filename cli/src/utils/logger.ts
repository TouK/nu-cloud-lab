import chalk from 'chalk';

export const logger = {
  info: (text: string, ...args: any[]) => console.log( text, ...args),
  success: (text: string, ...args: any[]) => console.log(chalk.green(text), ...args),
  error: (text: string, ...args: any[]) => console.log(chalk.red(text), ...args),
  warn: (text: string, ...args: any[]) => console.log(chalk.yellow(text), ...args),
};
