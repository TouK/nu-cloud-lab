import { Command } from 'commander';
import { loadConfig } from '../lib/config/loader.js';
import { sendData } from '../lib/producer/sender.js';
import { generateData, loadTemplate } from '../lib/template/generator.js';
import { parseData, parseFile, validateObject } from '../utils/parser.js';
import { logger } from '../utils/logger.js';

export const sendCommand = new Command('send')
  .description('Send a single message to Nu Cloud')
  .option('-C, --config <path>', 'Config file path', '.nu-cli.yaml')
  .option('-p, --profile <name>', 'Config profile to use')
  .option('-d, --data <json>', 'Message data as JSON/YAML string')
  .option('-f, --file <path>', 'Message data from file (JSON/YAML)')
  .option('-t, --template <path>', 'Template file to use (overrides config)')
  .option('--dry-run', 'Show what would be sent without sending')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config, options.profile);

      let messageData: any;

      // Priority: --data > --file > --template > config template > default
      if (options.data) {
        logger.info('Using data from --data flag');
        messageData = parseData(options.data);
        validateObject(messageData, 'Message data');
      } else if (options.file) {
        logger.info(`Using data from file: ${options.file}`);
        messageData = await parseFile(options.file);
        validateObject(messageData, 'Message file');
      } else if (options.template) {
        logger.info(`Using template: ${options.template}`);
        const template = await parseFile(options.template);
        validateObject(template, 'Template');
        messageData = generateData(template);
      } else {
        // Use template from config or default
        const templatePath = config.producer?.template_path;
        if (templatePath) {
          logger.info(`Using template from config: ${templatePath}`);
        } else {
          logger.info('Using default template');
        }
        const template = await loadTemplate(templatePath);
        messageData = generateData(template);
      }

      await sendData(config, messageData, options.dryRun);

      if (!options.dryRun) {
        logger.success('Message sent successfully');
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
