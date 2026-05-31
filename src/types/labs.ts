// src/types/labs.ts

export interface LabEntry {
  current: string;
  historical: string;
}

/**
 * Labs are keyed by the test name string (e.g. "HbA1c", "BUN").
 * This matches the LAB_CATEGORIES field names in labCategories.ts.
 */
export type Labs = Record<string, LabEntry>;