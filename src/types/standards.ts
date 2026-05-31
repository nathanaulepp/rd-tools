// src/types/standards.ts
// Persisted state for the Comparative Standards (S) domain.
// The full evaluation engine types live in nutritionStandards.ts.

import type { ConditionKey } from "../features/assessment/assess-standards/nutritionStandards";

export interface Standards {
  condition: ConditionKey | "";
  variant: string;
  currentKcal: string;
  currentProtein: string;
  currentFluid: string;
  icKcal: string;
  icCaf: string;
  extraInputs: Record<string, string>;
}