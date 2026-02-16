import type { NuCloudConfig } from '../config/types.js';
import { generateData } from '../template/generator.js';
import { sendData } from './sender.js';
import { logger } from '../../utils/logger.js';
import { sleep } from '../../utils/process.js';

export class Producer {
  constructor(
    private config: NuCloudConfig,
    private dryRun: boolean = false
  ) {}

  async sendOnce(data?: any): Promise<void> {
    const payload = data || generateData();
    await sendData(this.config, payload, this.dryRun);
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
