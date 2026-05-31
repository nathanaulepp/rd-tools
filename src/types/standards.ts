// src/types/standards.ts
//
// All types related to the Comparative Standards (S) domain.
// Covers both the persisted UI state (Standards interface) and the
// evaluation engine's input/output contracts.
//
// ConditionKey and evaluation types were previously co-located with the
// evaluateNutritionRx engine in the feature folder. They live here so that
// any domain — stores, utils, UI — can import types without touching
// business logic.

import type { EvalStatus } from "../shared/utils/clinicalMath";
export type { EvalStatus };

// ─── Condition Registry ───────────────────────────────────────────────────────

export type ConditionKey =
  | "aki"
  | "acute_pancreatitis"
  | "breastfeeding"
  | "burns"
  | "oncology"
  | "cancer"           // legacy alias — resolves to oncology logic in engine
  | "ckd_3_5"
  | "ckd_5d"
  | "kidney_transplant"
  | "copd"
  | "cirrhosis"
  | "liver_transplant"
  | "critical_illness"
  | "pregnancy"
  | "pressure_injuries"
  | "trauma"
  | "healthy"
  | "masld_mash"
  | "short_bowel"
  | "cystic_fibrosis"
  | "stroke"
  | "heart_failure"
  | "obesity_stable"
  | "severe_malnutrition"
  | "sickle_cell"
  | "diabetes"
  | "hsct";

// ─── Evaluation Engine — Input Contracts ─────────────────────────────────────

/** Patient biometrics passed into the evaluation engine. */
export interface PatientInputs {
  wtKg: number;
  htCm: number;
  ageYears: number;
  ageDays?: number;      // Required for pediatric branching
  sex: "M" | "F";
  bmi: number;
  weightLabel?: string;
  icMeasuredKcal?: number;
  icCaf?: number;
}

/** Current nutrition prescription being evaluated. */
export interface CurrentRx {
  kcalPerDay: number;
  proteinGPerDay: number;
  fluidMlPerDay?: number;
}

/** Full options object passed to evaluateNutritionRx. */
export interface EvalOptions {
  condition: ConditionKey;
  variant?: string;
  patient: PatientInputs;
  currentRx: CurrentRx;
  extraInputs?: Record<string, number | string>;
}

// ─── Evaluation Engine — Output Contracts ─────────────────────────────────────

/** A single nutrient comparison row in the evaluation output. */
export interface EvalResult {
  label: string;
  target: string;
  current: number;
  unit: string;
  status: EvalStatus;
  note?: string;
}

/** Energy source label for the evaluation output header. */
export type EESource =
  | "IC"
  | "MSJ×AF"
  | "MSJ×CAF"
  | "PSU 2003b"
  | "PSU 2010"
  | "Schofield×AF"
  | "Schofield WH×SF"   // Pediatric disease path
  | "DRI/EER"           // Pediatric healthy path
  | "CF Formula"
  | "Curreri"
  | "Milner"
  | "Galveston"
  | "Galveston Infant"  // <1y burns — previously missing
  | "SCD REE"
  | "BEE×AF"
  | "HSCT";

/** Full output of a single evaluateNutritionRx call. */
export interface NutritionEvaluation {
  ibwKg: number;
  reeKcal: number;
  eeKcal: number;
  eeSource: EESource;
  afUsed?: number;
  cafUsed?: number;
  weightUsed: number;
  weightLabel: string;
  isPediatric: boolean;
  results: EvalResult[];
  flags: string[];
}

// ─── Persisted UI State ───────────────────────────────────────────────────────

/**
 * The subset of standards state that gets persisted to the note DB.
 * This is what useStandardsStore saves and loads.
 */
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