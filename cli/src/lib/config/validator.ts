import type { NuCloudConfig } from './types.js';
import { ConfigError } from '../../utils/errors.js';

export function validateConfig(config: NuCloudConfig): void {
  if (!config.api) {
    throw new ConfigError('Missing "api" section in config');
  }

  if (!config.api.url) {
    throw new ConfigError('Missing "api.url" in config');
  }

  if (!config.api.username) {
    throw new ConfigError('Missing "api.username" in config');
  }

  if (!config.api.password || config.api.password === 'your_password') {
    throw new ConfigError(
      'Invalid or placeholder password in config. Please set a real password.'
    );
  }
}
