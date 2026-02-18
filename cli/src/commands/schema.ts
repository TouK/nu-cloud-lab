import { Command } from 'commander';
import fs from 'fs/promises';
import { generateAvroSchema } from '../lib/template/schema.js';
import { loadTemplate } from '../lib/template/generator.js';
import { loadConfig } from '../lib/config/loader.js';
import { parseFile } from '../utils/parser.js';
import { logger } from '../utils/logger.js';

export const schemaCommand = new Command('schema')
  .description('Generate Avro schema from message template')
  .option('-C, --config <path>', 'Config file path', '.nu-cli.yaml')
  .option('-p, --profile <name>', 'Config profile to use')
  .option('-t, --template <path>', 'Template file to use (overrides config)')
  .option('-o, --output <path>', 'Output file (stdout if not specified)')
  .action(async (options) => {
    try {
      // Load template (priority: --template > config > default)
      let template;
      if (options.template) {
        logger.info(`Using template: ${options.template}`);
        template = await parseFile(options.template);
      } else {
        try {
          const config = await loadConfig(options.config, options.profile);
          if (config.producer?.template_path) {
            logger.info(`Using template from config: ${config.producer.template_path}`);
            template = await loadTemplate(config.producer.template_path);
          } else {
            logger.info('Using default template');
            template = await loadTemplate();
          }
        } catch {
          // If config loading fails, use default template
          logger.info('Using default template');
          template = await loadTemplate();
        }
      }

      const schema = generateAvroSchema(template);

      if (options.output) {
        await fs.writeFile(options.output, schema, 'utf-8');
        logger.success(`Schema written to ${options.output}`);
      } else {
        console.log(schema);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
