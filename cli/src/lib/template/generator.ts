import { getRandomValue } from './random.js';

export type TemplateValue = string | number | boolean | null | TemplateObject | TemplateArray;
export type TemplateObject = { [key: string]: TemplateValue };
export type TemplateArray = TemplateValue[];

export const MESSAGE_TEMPLATE: TemplateObject = {
  "name": "random_name",
};

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
