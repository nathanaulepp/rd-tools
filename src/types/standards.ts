// src/types/standards.ts
//
// All types related to the Comparative Standards (S) domain.

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
  | "hsct";

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

// ─── Persisted UI State ───────────────────────────────────────────────────────

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