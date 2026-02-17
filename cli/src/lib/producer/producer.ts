import type { NuCloudConfig } from '../config/types.js';
import { generateData, type TemplateObject } from '../template/generator.js';
import { sendData } from './sender.js';
import { logger } from '../../utils/logger.js';
import { sleep } from '../../utils/process.js';

export class Producer {
  constructor(
    private config: NuCloudConfig,
    private dryRun: boolean = false,
    private template?: TemplateObject
  ) {}

  async sendOnce(): Promise<void> {
    const payload = this.template ? generateData(this.template) : generateData();
    await sendData(this.config, payload, this.dryRun);
  }

  async sendCount(count: number, delaySeconds?: number): Promise<void> {
    const delay = delaySeconds ?? this.config.producer?.delay_seconds ?? 1;

    logger.info(`Sending ${count} message${count > 1 ? 's' : ''} with ${delay}s delay`);

    for (let i = 0; i < count; i++) {
      await this.sendOnce();

      // Don't sleep after last message
      if (i < count - 1) {
        await sleep(delay);
      }
    }

    logger.success(`Sent ${count} message${count > 1 ? 's' : ''}`);
  }

  async startLoop(delaySeconds?: number): Promise<void> {
    const delay = delaySeconds ?? this.config.producer?.delay_seconds ?? 1;

    logger.info(`Starting producer with ${delay}s delay between messages`);
    logger.info(`Press Ctrl+C to stop\n`);

    while (true) {
      await this.sendOnce();
      await sleep(delay);
    }
  }
}
