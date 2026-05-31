// src/features/assessment/assess-standards/nutritionStandardsTypes.ts
//
// Internal types shared between:
//   - nutritionStandardsAdult.ts
//   - nutritionStandardsPeds.ts
//   - nutritionStandards.ts (barrel)
//
// Do NOT export from the barrel or import in UI components.
// These are implementation-detail contracts, not public API.

import type { EESource } from "../../../types/standards";

// ─── SharedEvalContext ────────────────────────────────────────────────────────
//
// Computed once in evaluateNutritionRx() and passed unchanged to whichever
// sub-engine is called. Contains all derived patient values so neither
// sub-engine needs to re-derive them.

export interface SharedEvalContext {
  // Patient measurements (always in SI: kg, cm)
  wtKg: number;
  htCm: number;
  ageYears: number;
  ageDays: number;

  // Demographics
  sex: "M" | "F";
  bmi: number;

  // Derived body composition
  ibwKg: number;

  // Resting energy expenditure via MSJ (pre-computed baseline)
  ree: number;

  // Indirect calorimetry override state
  useIC: boolean;
  icFloor: number;    // icMeasuredKcal * icCaf
  icCeiling: number;  // icMeasuredKcal * (icCaf + 0.1)
  activeIcCaf: number;
}

// ─── ConditionResult ──────────────────────────────────────────────────────────
//
// Returned by evaluateAdultCondition() and evaluatePedsCondition().
// The barrel merges this back into a NutritionEvaluation after applying
// the IC global override and building result rows.

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