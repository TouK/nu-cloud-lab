import { Command } from 'commander';
import { produceCommand } from './commands/produce.js';
import { consumeCommand } from './commands/consume.js';
import { schemaCommand } from './commands/schema.js';
import { initCommand } from './commands/init.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('nu-cloud')
    .description('CLI tool for Nu Cloud messaging - produce and consume messages')
    .version('0.1.0');

  program.addCommand(produceCommand);
  program.addCommand(consumeCommand);
  program.addCommand(schemaCommand);
  program.addCommand(initCommand);

  return program;
}
