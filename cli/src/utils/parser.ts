import yaml from 'yaml';
import { ValidationError } from './errors.js';
import fs from 'fs/promises';

/**
 * Parse JSON or YAML string (try JSON first, fallback to YAML)
 */
export function parseData(input: string): any {
  // Try JSON first
  try {
    return JSON.parse(input);
  } catch (jsonError) {
    // Fallback to YAML
    try {
      return yaml.parse(input);
    } catch (yamlError) {
      throw new ValidationError(
        'Invalid data format. Must be valid JSON or YAML.\n' +
        `JSON error: ${(jsonError as Error).message}\n` +
        `YAML error: ${(yamlError as Error).message}`
      );
    }
  }
}

/**
 * Read and parse file (auto-detect JSON/YAML by extension or content)
 */
export async function parseFile(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extension-based parsing
  if (filePath.endsWith('.json')) {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new ValidationError(
        `Invalid JSON in file: ${filePath}\n${(error as Error).message}`
      );
    }
  }
  
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    try {
      return yaml.parse(content);
    } catch (error) {
      throw new ValidationError(
        `Invalid YAML in file: ${filePath}\n${(error as Error).message}`
      );
    }
  }
  
  // Auto-detect for other extensions
  return parseData(content);
}

/**
 * Validate that value is a plain object (not array, null, or primitive)
 */
export function validateObject(data: any, context: string): void {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new ValidationError(
      `${context} must be a plain object, got: ${typeof data === 'object' ? (Array.isArray(data) ? 'array' : 'null') : typeof data}`
    );
  }
}
