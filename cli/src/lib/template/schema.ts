import type { TemplateObject, TemplateValue } from './generator.js';

interface AvroField {
  name: string;
  type: string | AvroRecord;
  logicalType?: string;
}

interface AvroRecord {
  type: 'record';
  name: string;
  fields: AvroField[];
}

interface AvroSchema extends AvroRecord {
  namespace: string;
}

function inferAvroType(value: string): Pick<AvroField, 'type' | 'logicalType'> {
  if (["random_name", "random_city", "random_product", "random_status"].includes(value)) {
    return { type: "string" };
  } else if (value === "current_timestamp") {
    return { type: "string", logicalType: "iso-datetime" };
  } else if (value.startsWith("random_int(")) {
    return { type: "int" };
  }
  return { type: "string" };
}

function processField(value: TemplateValue, fieldName: string): AvroField {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return {
      name: fieldName,
      type: {
        type: "record",
        name: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
        fields: Object.entries(value).map(([k, v]) => processField(v, k))
      }
    };
  } else if (typeof value === 'string') {
    const fieldSchema = inferAvroType(value);
    return { name: fieldName, ...fieldSchema };
  }
  return { name: fieldName, type: "string" };
}

export function generateAvroSchema(
  template: TemplateObject,
  name: string = "Message"
): string {
  const schema: AvroSchema = {
    type: "record",
    name: name,
    namespace: "com.example",
    fields: Object.entries(template).map(([key, value]) => processField(value, key))
  };

  return JSON.stringify(schema, null, 2);
}
