// src/stores/storeUtils.ts
// Shared utilities for domain stores. Import from here — do NOT copy inline.

/**
 * Safely parse a JSON string, returning the fallback on any error.
 * Used by every domain store's registerDomainReset callback.
 */
export function tryParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
