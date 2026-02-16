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

  // Password is optional - empty password means no authentication
  // If endpoint requires auth, it will return 401 and user will know
}
