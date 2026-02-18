import chalk from 'chalk';

let jsonMode = false;

export const logger = {
  setJsonMode: (enabled: boolean) => {
    jsonMode = enabled;
  },
  info: (text: string, ...args: any[]) => {
    if (!jsonMode) console.log(text, ...args);
  },
  success: (text: string, ...args: any[]) => {
    if (!jsonMode) console.log(chalk.green(text), ...args);
  },
  error: (text: string, ...args: any[]) => {
    if (!jsonMode) {
      console.log(chalk.red(text), ...args);
    } else {
      console.error(JSON.stringify({ error: text }));
    }
  },
  warn: (text: string, ...args: any[]) => {
    if (!jsonMode) console.log(chalk.yellow(text), ...args);
  },
  json: (data: any) => {
    console.log(JSON.stringify(data));
  },
};
