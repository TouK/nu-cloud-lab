import { getRandomValue } from './random.js';
import { parseFile } from '../../utils/parser.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type TemplateValue = string | number | boolean | null | TemplateObject | TemplateArray;
export type TemplateObject = { [key: string]: TemplateValue };
export type TemplateArray = TemplateValue[];

export const MESSAGE_TEMPLATE: TemplateObject = {
  "name": "random_name",
};

/**
 * Load template from file or use default
 *
 * Priority:
 *   1. Provided path (parameter)
 *   2. Default template from dist/ (message-template.yaml.template)
 */
export async function loadTemplate(templatePath?: string): Promise<TemplateObject> {
  if (templatePath) {
    // User-provided path (relative to CWD)
    const resolved = path.resolve(templatePath);
    return await parseFile(resolved);
  }

  // Fall back to bundled template
  const defaultPath = path.join(__dirname, 'message-template.yaml.template');
  return await parseFile(defaultPath);
}

export function generateData(template: TemplateValue = MESSAGE_TEMPLATE): any {
  if (typeof template === 'object' && template !== null && !Array.isArray(template)) {
    return Object.fromEntries(
      Object.entries(template).map(([k, v]) => [k, generateData(v)])
    );
  } else if (Array.isArray(template)) {
    return template.map(item => generateData(item));
  } else if (typeof template === 'string') {
    return getRandomValue(template);
  }
  return template;
}
