import isNil from 'lodash/isNil.js';

/**
 * Safely parses a JSON string and returns a strongly-typed value.
 * If parsing fails or result is null/undefined, it returns the fallback.
 *
 * - If value is null or undefined, fallback is returned.
 * - If value is a string and valid JSON, the parsed value is returned (unless null/undefined, then fallback).
 * - If value is a string but not valid JSON, the original string is returned (not the fallback).
 * - If value is not a string, fallback is returned.
 * - This prevents nonsense like parseJson(false, true) from returning true (should always return fallback for non-string input).
 */
export const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (isNil(value)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as T | null | undefined;

    // Only return parsed if it's not null or undefined
    if (!isNil(parsed)) {
      return parsed as T;
    }

    return fallback;
  } catch {
    // If parsing fails, return the original string
    return value as T;
  }
};
