// src/types/standards.ts
//
// All types related to the Comparative Standards (S) domain.
//
// Milestone 1 changes:
//   - Added RuntimeContext: normalized, dollar-prefixed variable map injected
//     into the calculation engine and available to future user-written equations.
//   - Added EvaluationSnapshot: the computed result that gets serialized into
//     the notes.standards JSON column alongside UI parameters.
//   - Standards interface restructured to cleanly separate UI params from snapshot.

import type { EvalStatus } from "../shared/utils/clinicalMath";
export type { EvalStatus };

// ─── Condition Registry ───────────────────────────────────────────────────────

export type ConditionKey =
  | "aki"
  | "acute_pancreatitis"
  | "breastfeeding"
  | "burns"
  | "oncology"
  | "cancer"
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
  | "hsct"
  | "bpd";

// ─── Runtime Context ──────────────────────────────────────────────────────────
//
// Normalized, dollar-prefixed variable map injected into evaluateNutritionRx()
// and passed through the entire calculation engine.
//
// Two goals:
//   1. Single source of truth for all patient variables used in equations —
//      both SI and imperial variants are always present so equations never
//      need to branch on unit selection.
//   2. In Milestone 2, user-written equation strings (e.g. "$wtKg * 1.5")
//      will reference these same keys, making custom expressions portable
//      and unit-safe without any changes to the parser.
//
// Keys follow the pattern: $<camelCaseName><Unit>
// All values are plain numbers (no strings, no nulls).

export interface RuntimeContext {
  // ── Body weight ──────────────────────────────────────────────────────────
  $wtKg: number;
  $wtLbs: number;
  $ibwKg: number;
  $ibwLbs: number;
  /** Adjusted IBW accounting for amputations; equals ibwKg when no amputations */
  $adjIbwKg: number;
  /** Estimated dry weight (fluid-shift corrected); equals wtKg when not applicable */
  $edwKg: number;

  // ── Height ───────────────────────────────────────────────────────────────
  $htCm: number;
  $htIn: number;
  $htM: number;  // metres — used in Schofield and BSA equations

  // ── Age ──────────────────────────────────────────────────────────────────
  $ageDays: number;
  $ageYears: number;
  $ageMonths: number;

  // ── Body composition ─────────────────────────────────────────────────────
  $bmi: number;
  $bsa: number;  // m², Mosteller

  // ── Pre-computed REE baselines ────────────────────────────────────────────
  /** Mifflin-St Jeor REE (kcal/day) — primary adult baseline */
  $msjKcal: number;
  /** Schofield WH REE (kcal/day) — primary pediatric baseline */
  $schofieldKcal: number;

  // ── Indirect calorimetry ──────────────────────────────────────────────────
  /** Measured REE from indirect calorimetry (0 when not available) */
  $icMeasuredKcal: number;
  /** Clinical activity factor applied on top of IC measurement */
  $icCaf: number;

  // ── Condition-specific extra inputs (dollar-prefixed, dynamically added) ──
  // These are merged in at runtime from extraInputs after normalization.
  // Declared as an index signature so TypeScript allows dynamic $-keys.
  [key: `$${string}`]: number;
}

// ─── Evaluation Engine — Input Contracts ─────────────────────────────────────

export interface PatientInputs {
  wtKg: number;
  htCm: number;
  ageYears: number;
  ageDays?: number;
  sex: "M" | "F";
  bmi: number;
  weightLabel?: string;
  icMeasuredKcal?: number;
  icCaf?: number;
}

export interface CurrentRx {
  kcalPerDay: number;
  proteinGPerDay: number;
  fluidMlPerDay?: number;
}

export interface EvalOptions {
  condition: ConditionKey;
  variant?: string;
  patient: PatientInputs;
  currentRx: CurrentRx;
  extraInputs?: Record<string, number | string>;
}

// ─── Evaluation Engine — Output Contracts ─────────────────────────────────────

export interface EvalResult {
  label: string;
  target: string;
  current: number;
  unit: string;
  status: EvalStatus;
  note?: string;
}

export type EESource =
  | "IC"
  | "MSJ×AF"
  | "MSJ×CAF"
  | "PSU 2003b"
  | "PSU 2010"
  | "Schofield×AF"
  | "Schofield WH×SF"
  | "DRI/EER"
  | "CF Formula"
  | "Curreri"
  | "Milner"
  | "Toronto"
  | "Galveston"
  | "Galveston Infant"
  | "SCD REE"
  | "BEE×AF"
  | "HSCT";

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

// ─── Evaluation Snapshot ──────────────────────────────────────────────────────
//
// The computed, persisted record of what the engine produced for this note.
// Serialized into the notes.standards JSON column alongside UI parameters.
//
// Design rules:
//   - Immutable once written per autosave cycle — downstream consumers (Dx)
//     read a stable object, not a live reactive value.
//   - contextVars captures the exact RuntimeContext values used, providing
//     a full audit trail so the calculation can be reconstructed from the
//     note alone (no dependency on current patient store state).
//   - results mirrors NutritionEvaluation.results so consumers don't need
//     to re-import the evaluation engine just to read LOW/WNL/HIGH status.

export interface EvaluationSnapshot {
  /** ISO 8601 timestamp of when this snapshot was written */
  evaluatedAt: string;
  conditionKey: ConditionKey;
  variantKey: string;
  eeSource: EESource;
  /** Weight value (kg) used in energy calculation */
  weightUsedKg: number;
  weightLabel: string;
  isPediatric: boolean;
  /** Per-nutrient results — energy, protein, fluid each with status */
  results: EvalResult[];
  flags: string[];
  /**
   * Exact RuntimeContext values used to produce this snapshot.
   * Stored so the calculation is fully reproducible from the note record alone.
   * Keys are the dollar-prefixed variable names (e.g. "$wtKg": 72.5).
   */
  contextVars: Record<string, number>;
}

// ─── Persisted Standards State ────────────────────────────────────────────────
//
// This is the shape of the notes.standards JSON column.
// Two clean sections:
//   1. UI / interactive parameters — what the RD selected and typed
//   2. snapshot — the computed result, null until the first evaluation runs

export interface Standards {
  // ── UI parameters (RD selections) ────────────────────────────────────────
  condition: ConditionKey | "";
  variant: string;
  currentKcal: string;
  currentProtein: string;
  currentFluid: string;
  icKcal: string;
  icCaf: string;
  extraInputs: Record<string, string>;

  // ── Evaluation snapshot ───────────────────────────────────────────────────
  /** Null until the first evaluation has run and been autosaved */
  snapshot: EvaluationSnapshot | null;
}