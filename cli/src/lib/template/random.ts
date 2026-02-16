export const SAMPLE_DATA = {
  names: ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah"],
  cities: ["New York", "London", "Tokyo", "Paris", "Berlin", "Sydney"],
  products: ["Laptop", "Phone", "Tablet", "Watch", "Headphones"],
  statuses: ["pending", "completed", "failed", "in_progress"]
} as const;

export function getRandomValue(fieldType: string): string | number {
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
