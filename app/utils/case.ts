function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function snakeToCamel<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => snakeToCamel(item)) as T;
  }

  if (isPlainObject(value)) {
    const transformed: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      transformed[snakeToCamelKey(key)] = snakeToCamel(nestedValue);
    }
    return transformed as T;
  }

  return value as T;
}
