import { Command } from 'commander';
import { loadConfig } from '../lib/config/loader.js';
import { Producer } from '../lib/producer/producer.js';
import { logger } from '../utils/logger.js';

export const produceCommand = new Command('produce')
  .description('Send messages to Nu Cloud')
  .option('-c, --config <path>', 'Config file path', 'config.yaml')
  .option('-p, --profile <name>', 'Config profile to use')
  .option('-d, --delay <seconds>', 'Delay between messages (overrides config)', parseFloat)
  .option('--once', 'Send single message and exit')
  .option('--dry-run', 'Show what would be sent without sending')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config, options.profile);
      const producer = new Producer(config, options.dryRun);

      if (options.once) {
        await producer.sendOnce();
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
