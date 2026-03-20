/** Returns true if value is null or undefined */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Returns true for null, undefined, empty string, empty array, or empty object */
export function isEmpty(value: unknown): boolean {
  if (value == null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  if (typeof value === 'string') {
    return value.length === 0;
  }
  return false;
}
