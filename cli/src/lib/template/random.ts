import { faker } from '@faker-js/faker';
import { logger } from '../../utils/logger.js';

export function getRandomValue(fieldType: string): any {
  // Faker.js syntax: faker:category.method or ::category.method
  if (fieldType.startsWith('faker:') || fieldType.startsWith('::')) {
    return parseFakerExpression(fieldType);
  }
  
  // Special: current_timestamp
  if (fieldType === "current_timestamp") {
    return new Date().toISOString();
  }
  
  // No transformation - return as-is
  return fieldType;
}

/**
 * Parse and execute faker.js expressions
 *
 * Examples:
 *   "::person.fullName" -> faker.person.fullName()
 *   "::number.int({min:18,max:65})" -> faker.number.int({min:18, max:65})
 *   "::helpers.arrayElement([1,2,3])" -> faker.helpers.arrayElement([1,2,3])
 *   '::helpers.arrayElements([1,2,3],{min:2,max:4})' -> faker.helpers.arrayElements([1,2,3], {min:2, max:4})
 *   
 *   Legacy "faker:" prefix still supported:
 *   "faker:person.fullName" -> faker.person.fullName()
 */
function parseFakerExpression(expr: string): any {
  // Pattern: ::category.method or faker:category.method (both supported)
  const match = expr.match(/^(?:faker:|::)([a-zA-Z.]+)(?:\(([^)]*)\))?$/);

  if (!match) {
    logger.warn(`Invalid faker syntax: ${expr}`);
    return expr;
  }

  const [, path, params] = match;
  const parts = path.split('.');

  // Navigate to faker method: faker.person.fullName
  let fn: any = faker;
  for (const part of parts) {
    fn = fn?.[part];
    if (!fn) {
      logger.warn(`Unknown faker path: ${path}`);
      return expr;
    }
  }

  if (typeof fn !== 'function') {
    logger.warn(`Faker path is not a function: ${path}`);
    return expr;
  }

  // Call with params if present
  if (params?.trim()) {
    const args = parseFakerParams(params, path);
    return fn(...args);
  }

  // Call without params
  return fn();
}

/**
 * Parse faker parameters as JSON array for spreading
 *
 * Treats params as JSON array and returns array of arguments:
 *   "[1,2,3]" -> [[1,2,3]]
 *   "[1,2,3],{min:2,max:4}" -> [[1,2,3], {min:2, max:4}]
 *   "{min:18,max:65}" -> [{min:18, max:65}]
 *
 * This allows spreading as ...args to faker functions.
 */
function parseFakerParams(params: string, _fakerPath: string): any[] {
  // Parse as JSON array
  try {
    const wrapped = `[${params}]`;

    // Support relaxed JSON syntax (unquoted keys)
    const relaxed = wrapped.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    const parsed = JSON.parse(relaxed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    // JSON parse failed
    logger.warn(`Failed to parse faker params as JSON: ${params}`);
    return [];
  }
}
