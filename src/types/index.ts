// src/types/index.ts
// Single import point for all domain types.
// Usage: import type { Anthro, Clinical, Dietary } from '@/types';

export type { PatientData } from "./patient";
export type {
  Anthro,
  DexaScan,
  CalculatedMetrics,
  WeightUnit,
  LengthUnit,
  SkinfoldUnit,
} from "./anthro";
export type {
  Clinical,
  NFPESeverity,
  EdemaGrade,
  AscitesSeverity,
  GripStrengthStatus,
  PedalEdema,
} from "./clinical";
export type { Labs, LabEntry, LabPreset, LabColumn, LabsDomainState } from "./labs";
export type { Dietary, RecallMeal } from "./dietary";
export type { Diagnosis, PESStatement } from "./diagnosis";
export type { Intervention } from "./intervention";
export type { MonitorEval, OutcomeProgress } from "./monitorEval";
export type { Standards, EvaluationSnapshot } from "./standards";
export type { RefeedingScreen, RiskLevel, WtLossSource, EnergyIntakeOption, ElectrolyteCriterion } from "./refeedingScreen";
export type { EnteralFormula, EnteralFormulaInput } from "./enteralFormula";