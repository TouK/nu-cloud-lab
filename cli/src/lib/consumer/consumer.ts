import type { FastifyInstance } from 'fastify';
import { createServer } from './server.js';
import { startTunnel, type TunnelProvider, type TunnelResult } from './tunnel.js';
import { logger } from '../../utils/logger.js';

export class Consumer {
  private server?: FastifyInstance;
  private tunnel?: TunnelResult | null;

  constructor(
    private port: number,
    private debug: boolean,
    private useTunnel: boolean = true,
    private tunnelProvider?: TunnelProvider,
    private tunnelPath?: string,
    private jsonMode: boolean = false
  ) {}

  async start(): Promise<void> {
    // Start Fastify server
    this.server = await createServer(this.port, this.debug, this.jsonMode);
    logger.success(`Server listening on http://localhost:${this.port}`);

    // Start tunnel if requested
    if (this.useTunnel) {
      // const spinner = logger.spinner('Starting tunnel...').start();

      try {
        this.tunnel = await startTunnel(this.port, {
          provider: this.tunnelProvider,
          path: this.tunnelPath,
        });

        if (this.tunnel) {
          // spinner.succeed('Tunnel established');

          logger.info('\nConsumer is ready to receive messages!\n');
          logger.info('Webhook URL (public):');
          logger.info(`   ${this.tunnel.url}\n`);
          logger.info('Copy this URL to Nu Cloud "Add Subscription" form\n');
        } else {
          // spinner.warn('Tunnel not available');
          logger.info(`\nLocal URL: http://localhost:${this.port}/webhook\n`);
        }
      } catch (error) {
        // spinner.fail('Failed to start tunnel');
        logger.warn(`Continuing without tunnel. Local URL: http://localhost:${this.port}/webhook\n`);
      }
    } else {
      logger.info(`\nLocal URL: http://localhost:${this.port}/webhook\n`);
    }

    logger.info('Press Ctrl+C to stop\n');
  }

  async stop(): Promise<void> {
    if (this.tunnel?.cleanup) {
      await this.tunnel.cleanup();
      logger.info('Tunnel stopped');
    }
    if (this.server) {
      await this.server.close();
      logger.info('Server stopped');
    }
  }
}
