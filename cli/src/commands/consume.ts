import { Command } from 'commander';
import { Consumer } from '../lib/consumer/consumer.js';
import { logger } from '../utils/logger.js';

export const consumeCommand = new Command('consume')
  .description('Start webhook consumer')
  .option('--port <number>', 'Server port', (val) => parseInt(val, 10), 6555)
  .option('--debug', 'Enable debug logging')
  .option('--no-tunnel', 'Skip cloudflared tunnel')
  .action(async (options) => {
    const consumer = new Consumer(options.port, options.debug, options.tunnel);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('\nShutting down...');
      await consumer.stop();
      process.exit(0);
    });

    try {
      await consumer.start();
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
