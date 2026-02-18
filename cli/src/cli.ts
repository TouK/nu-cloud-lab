import { Command } from 'commander';
import { sendCommand } from './commands/send.js';
import { produceCommand } from './commands/produce.js';
import { consumeCommand } from './commands/consume.js';
import { schemaCommand } from './commands/schema.js';
import { initCommand } from './commands/init.js';
import packageJson from '../package.json' assert { type: 'json' };

export function createCLI(): Command {
  const program = new Command();

  program
    .name('nu-cli')
    .description('CLI tool for Nussknacker Cloud - produce and consume messages')
    .version(packageJson.version, '-v, --version', 'display version number');

  program.addCommand(sendCommand);
  program.addCommand(produceCommand);
  program.addCommand(consumeCommand);
  program.addCommand(schemaCommand);
  program.addCommand(initCommand);

  return program;
}
