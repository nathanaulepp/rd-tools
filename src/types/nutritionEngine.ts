// src/types/nutritionEngine.ts
// Do NOT import these in UI components or domain stores

import type { EESource, RuntimeContext } from "./standards"
export type { RuntimeContext };

/**
 * Bridge shape used by the sub-engines until they are migrated 
 * to RuntimeContext in a future pass.
 */
export interface SharedEvalContext {
  wtKg: number;
  htCm: number;
  ageYears: number;
  ageDays: number;
  sex: "M" | "F";
  bmi: number;
  ibwKg: number;
  ree: number;
  useIC: boolean;
  icFloor: number;
  icCeiling: number;
  activeIcCaf: number;
}

export interface ConditionResult {
  // Energy targets (kcal/day)
  kcalLow: number;
  kcalHigh: number;

  // Protein targets (g/day)
  protLow: number;
  protHigh: number;
  /** When non-null, overrides protLow/protHigh with a fixed single value (e.g. 71g pregnancy RDA) */
  protFixed: number | null;

  // Fluid targets (mL/day); null means "not calculated / use fluidNote only"
  fluidLow: number | null;
  fluidHigh: number | null;
  fluidNote: string;

  // Weight basis used for energy calculation (may differ from actual wt)
  wtForKcal: number;
  wtLabel: string;

  // Weight basis used for protein calculation (may differ from wtForKcal)
  wtForProt: number;

  // Energy expenditure values
  eeKcal: number;
  eeSource: EESource;

  // Activity / clinical factors (optional — only set when applicable)
  afUsed?: number;
  cafUsed?: number;

  // Clinical guidance messages rendered in the flags panel
  flags: string[];
}