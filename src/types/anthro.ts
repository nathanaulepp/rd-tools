// src/types/anthro.ts
// All anthropometric measurement fields.

export type WeightUnit = "kg" | "lbs" | "g" | "oz";
export type LengthUnit = "cm" | "in";
export type SkinfoldUnit = "mm" | "cm";

export interface Anthro {
  // Height / Weight
  ht: string;
  htUnit: LengthUnit;
  wt: string;
  wtUnit: WeightUnit;

  // Usual Body Weight
  ubw: string;
  ubwDate: string;

  // Fluid shift / Dry weight
  isFluidShift: boolean;
  edw: string;
  edwUnit: WeightUnit;

  // Amputations
  amputations: string[];

  // Circumferences
  waist: string;
  mac: string;
  calf: string;
  head: string;
  circUnit: LengthUnit;

  // Skinfolds
  triceps: string;
  subscapular: string;
  suprailiac: string;
  thigh: string;
  skinfoldUnit: SkinfoldUnit;

  // Past measurements (pediatric growth velocity)
  past_ht: string;
  past_htUnit: LengthUnit;
  past_wt: string;
  past_wtUnit: WeightUnit;
  past_head: string;
  past_headUnit: LengthUnit;
  past_htDate: string;
  past_wtDate: string;
  past_headDate: string;
}

export interface DexaScan {
  id: number;
  date: string;
  bmd: string;
  fatMass: string;
  leanMass: string;
  bodyFatPct: string;
}

/** Derived values calculated from Anthro + PatientData. Read-only — never persisted directly. */
export interface CalculatedMetrics {
  bmi: string;
  ibw: number;
  adjIbw: number | null;
  ageDays: number | null;
  ageInMonths: number | null;
  ubwTimeframeDays: number | null;
}