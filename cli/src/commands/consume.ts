import { Command } from 'commander';
import { Consumer } from '../lib/consumer/consumer.js';
import { logger } from '../utils/logger.js';
import type { TunnelProvider } from '../lib/consumer/tunnel.js';

export const consumeCommand = new Command('consume')
  .description('Start webhook server to consume messages from Nu Cloud')
  .option('-p, --port <number>', 'Server port', '6555')
  .option('--tunnel <provider>', 'Tunnel provider: cloudflared, tailscale, none', 'auto')
  .option('--tunnel-path <path>', 'Webhook path for tunnel (tailscale)', '/webhook')
  .option('--no-tunnel', 'Skip tunnel setup')
  .option('--exact-path', 'Accept webhooks only on root path (/) instead of wildcard')
  .option('--debug', 'Enable debug logging')
  .option('--json', 'Output raw JSON messages only (suitable for piping)')
  .action(async (options) => {
    // Enable JSON mode if requested
    if (options.json) {
      logger.setJsonMode(true);
    }
    try {
      const port = parseInt(options.port, 10);

      // Determine tunnel configuration
      let tunnelProvider: TunnelProvider | undefined;
      let useTunnel = true;

      if (options.tunnel === 'none' || options.tunnel === false) {
        useTunnel = false;
      } else if (options.tunnel === 'auto') {
        tunnelProvider = undefined; // auto-detect
      } else {
        tunnelProvider = options.tunnel as TunnelProvider;
      }

      const consumer = new Consumer(
        port,
        options.debug,
        useTunnel,
        tunnelProvider,
        options.tunnelPath,
        options.json,
        !options.exactPath
      );

      // Graceful shutdown
      process.on('SIGINT', async () => {
        logger.info('\nShutting down...');
        await consumer.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await consumer.stop();
        process.exit(0);
      });

      await consumer.start();
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
