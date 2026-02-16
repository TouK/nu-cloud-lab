import axios from 'axios';
import type { NuCloudConfig } from '../config/types.js';
import { logger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { generateAvroSchema } from '../template/schema.js';
import { MESSAGE_TEMPLATE } from '../template/generator.js';

export async function sendData(
  config: NuCloudConfig,
  data: any,
  dryRun: boolean = false
): Promise<void> {
  const { url, username, password } = config.api;

  // Add auth only if password is non-empty
  const auth = password && password.trim() !== ''
    ? { username, password }
    : undefined;

  if (dryRun) {
    logger.info('DRY RUN - Would send to:', url);
    if (!auth) {
      logger.warn('No authentication (empty password)');
    }
    logger.info('Data:', JSON.stringify(data, null, 2));
    return;
  }

  try {
    await axios.post(url, data, {
      auth,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    logger.success(`Sent message:`, data);
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new ValidationError(
        'Authentication failed (401). Check username/password in config.'
      );
    }
    if (error.response?.status === 400 && error.response?.data?.includes("Invalid message")) {
      throw new ValidationError(
        `\n\nSchema validation error detected!\n` +
        `Your message structure might not match the expected Avro schema.\n\n` +
        `Current message structure:\n${JSON.stringify(data, null, 2)}\n\n` +
        `Suggested Avro schema for your current message structure:\n` +
        `${generateAvroSchema(MESSAGE_TEMPLATE)}\n\n` +
        `Please use the topic with the appropriate schema in Nu Cloud matching your message structure.\n` +
        `You can copy the schema above and use it in the Nu Cloud interface to create new topic.\n`
      );
    }
    logger.error(`Failed to send: ${JSON.stringify(data)}, Response: ${error.message}`);
    throw error;
  }
}
