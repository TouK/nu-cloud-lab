import { faker } from '@faker-js/faker';
import { logger } from '../../utils/logger.js';

export const SAMPLE_DATA = {
  names: ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah"],
  cities: ["New York", "London", "Tokyo", "Paris", "Berlin", "Sydney"],
  products: ["Laptop", "Phone", "Tablet", "Watch", "Headphones"],
  statuses: ["pending", "completed", "failed", "in_progress"]
} as const;

export function getRandomValue(fieldType: string): any {
  // Faker.js syntax support
  if (fieldType.startsWith('faker:')) {
    return parseFakerExpression(fieldType);
  }
  
  // Legacy syntax (backward compatibility)
  if (fieldType === "random_name") {
    return SAMPLE_DATA.names[Math.floor(Math.random() * SAMPLE_DATA.names.length)];
  } else if (fieldType === "random_city") {
    return SAMPLE_DATA.cities[Math.floor(Math.random() * SAMPLE_DATA.cities.length)];
  } else if (fieldType === "random_product") {
    return SAMPLE_DATA.products[Math.floor(Math.random() * SAMPLE_DATA.products.length)];
  } else if (fieldType === "random_status") {
    return SAMPLE_DATA.statuses[Math.floor(Math.random() * SAMPLE_DATA.statuses.length)];
  } else if (fieldType === "current_timestamp") {
    return new Date().toISOString();
  } else if (fieldType.startsWith("random_int(")) {
    const [min, max] = fieldType.slice(11, -1).split(',').map(Number);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return fieldType;
}

/**
 * Parse and execute faker.js expressions
 * 
 * Examples:
 *   "faker:person.fullName" -> faker.person.fullName()
 *   "faker:number.int(18,65)" -> faker.number.int({min: 18, max: 65})
 *   "faker:internet.email" -> faker.internet.email()
 */
function parseFakerExpression(expr: string): any {
  // Pattern: faker:category.method or faker:category.method(params)
  const match = expr.match(/^faker:([a-zA-Z.]+)(?:\(([^)]*)\))?$/);
  
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
  if (params && params.trim()) {
    const args = parseFakerParams(params, path);
    return fn(args);
  }
  
  // Call without params
  return fn();
}

/**
 * Parse faker parameters
 * 
 * Examples:
 *   "18,65" (for number.int) -> {min: 18, max: 65}
 *   "5" (for string methods) -> {length: 5}
 */
function parseFakerParams(params: string, fakerPath: string): any {
  const values = params.split(',').map(v => v.trim());
  
  // Special handling for number.int/float (min,max)
  if (fakerPath.startsWith('number.')) {
    if (values.length === 2) {
      return {
        min: parseFloat(values[0]),
        max: parseFloat(values[1])
      };
    }
    if (values.length === 1) {
      return { max: parseFloat(values[0]) };
    }
  }
  
  // Default: single numeric param as length/count
  if (values.length === 1 && !isNaN(parseFloat(values[0]))) {
    return { length: parseInt(values[0], 10) };
  }
  
  // Fallback: return as object
  logger.warn(`Unsure how to parse params for ${fakerPath}: ${params}`);
  return {};
}
