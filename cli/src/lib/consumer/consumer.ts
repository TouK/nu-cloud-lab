import type { FastifyInstance } from 'fastify';
import type { ChildProcess } from 'child_process';
import { createServer } from './server.js';
import { startCloudflaredTunnel } from './tunnel.js';
import { logger } from '../../utils/logger.js';

export class Consumer {
  private server?: FastifyInstance;
  private tunnelProcess?: ChildProcess;

  constructor(
    private port: number,
    private debug: boolean,
    private useTunnel: boolean = true
  ) {}

  async start(): Promise<void> {
    // Start Fastify server
    this.server = await createServer(this.port, this.debug);
    logger.success(`Server listening on http://localhost:${this.port}`);

    // Start tunnel if requested
    if (this.useTunnel) {
      const spinner = logger.spinner('Starting Cloudflare tunnel...').start();
      
      try {
        const tunnel = await startCloudflaredTunnel(this.port);
        
        if (tunnel) {
          this.tunnelProcess = tunnel.process;
          spinner.succeed('Cloudflare tunnel established');
          
          logger.info('\n🎉 Consumer is ready to receive messages!\n');
          logger.info('Webhook URL:');
          logger.info(`${tunnel.url}/webhook\n`);
          logger.info('Copy this URL to Nu Cloud "Add Subscription" form\n');
        } else {
          spinner.warn('Cloudflared not available');
          logger.info(`Local URL: http://localhost:${this.port}/webhook\n`);
        }
      } catch (error) {
        spinner.fail('Failed to start tunnel');
        logger.warn(`Continuing without tunnel. Local URL: http://localhost:${this.port}/webhook\n`);
      }
    } else {
      logger.info(`\nLocal URL: http://localhost:${this.port}/webhook\n`);
    }

    logger.info('Press Ctrl+C to stop\n');
  }

  async stop(): Promise<void> {
    if (this.tunnelProcess) {
      this.tunnelProcess.kill();
    }
    if (this.server) {
      await this.server.close();
    }
  }
}
