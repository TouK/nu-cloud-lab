import { Command } from 'commander';
import fs from 'fs/promises';
import { generateAvroSchema } from '../lib/template/schema.js';
import { MESSAGE_TEMPLATE } from '../lib/template/generator.js';
import { logger } from '../utils/logger.js';

export const schemaCommand = new Command('schema')
  .description('Generate Avro schema from message template')
  .option('-o, --output <path>', 'Output file (stdout if not specified)')
  .action(async (options) => {
    try {
      const schema = generateAvroSchema(MESSAGE_TEMPLATE);

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
