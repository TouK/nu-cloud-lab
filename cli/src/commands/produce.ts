import { Command } from 'commander';
import { loadConfig } from '../lib/config/loader.js';
import { Producer } from '../lib/producer/producer.js';
import { loadTemplate } from '../lib/template/generator.js';
import { parseFile } from '../utils/parser.js';
import { logger } from '../utils/logger.js';

export const produceCommand = new Command('produce')
  .description('Send messages to Nu Cloud continuously')
  .option('-C, --config <path>', 'Config file path', 'config.yaml')
  .option('-p, --profile <name>', 'Config profile to use')
  .option('-d, --delay <seconds>', 'Delay between messages (overrides config)', parseFloat)
  .option('-t, --template <path>', 'Template file to use (overrides config)')
  .option('-c, --count <number>', 'Send specified number of messages and exit', parseInt)
  .option('--dry-run', 'Show what would be sent without sending')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config, options.profile);
      
      // Load template (priority: --template > config > default)
      let template;
      if (options.template) {
        logger.info(`Using template: ${options.template}`);
        template = await parseFile(options.template);
      } else if (config.producer?.template_path) {
        logger.info(`Using template from config: ${config.producer.template_path}`);
        template = await loadTemplate(config.producer.template_path);
      } else {
        logger.info('Using default template');
        template = await loadTemplate();
      }
      
      const producer = new Producer(config, options.dryRun, template);

      if (options.count) {
        await producer.sendCount(options.count, options.delay);
      } else {
        await producer.startLoop(options.delay);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
