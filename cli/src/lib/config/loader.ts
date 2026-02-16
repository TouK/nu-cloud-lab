import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import type { NuCloudConfig } from './types.js';
import { validateConfig } from './validator.js';
import { logger } from '../../utils/logger.js';

export async function loadConfig(
  configPath?: string,
  profileName?: string
): Promise<NuCloudConfig> {
  const resolvedPath = configPath || path.join(process.cwd(), 'config.yaml');

  try {
    const content = await fs.readFile(resolvedPath, 'utf-8');
    let config = yaml.parse(content) as NuCloudConfig;

    // Merge profile if specified
    if (profileName && config.profiles?.[profileName]) {
      const profile = config.profiles[profileName];
      config = deepMerge(config, profile);
    }

    validateConfig(config);
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.error(`Config file not found: ${resolvedPath}`);
      logger.info('Run "nu-cloud init" to create a config file');
    }
    throw error;
  }
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }
  return result;
}
