/**
 * Pediatric Weight Status Classification
 * src/shared/utils/pediatricWeightStatus.ts
 *
 * Classifies a pediatric patient's BMI-for-age into a clinical weight
 * category using WHO (0–730 days) or CDC (24–240 months) LMS tables,
 * then returns a flag for EER equation branching in the healthy path.
 *
 * Age handling:
 *   < 24 months (≤ 730 days):
 *     WHO does not publish a BMI-for-age table for infants. Weight-for-length
 *     is the correct index but requires a separate workflow. Returns
 *     INDETERMINATE → useOverweightEER: false, so the infant EER equations
 *     in pediatricHealthyMath.ts are undisturbed.
 *   24 months – 18 years (731–6569 days):
 *     CDC bmiagerev — LMS method, sex-filtered via cdcBySex().
 *   ≥ 18 years: adult path; returns INDETERMINATE.
 *
 * Percentile thresholds (CDC clinical standard):
 *   < 5th   → UNDERWEIGHT
 *   5–84th  → NORMAL_WEIGHT
 *   85–94th → OVERWEIGHT
 *   ≥ 95th  → OBESE
 *
 * EER branching (DRI):
 *   UNDERWEIGHT / NORMAL_WEIGHT / INDETERMINATE → useOverweightEER: false
 *   OVERWEIGHT / OBESE                          → useOverweightEER: true
 */

import {
  getClosestRow,
  calcLMSZScore,
  stdNormCDF,
} from "./growthStandardsMath";
import { cdcBmiage, cdcBySex } from "../data/growthStandards";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PediatricWeightCategory =
  | "UNDERWEIGHT"
  | "NORMAL_WEIGHT"
  | "OVERWEIGHT"
  | "OBESE"
  | "INDETERMINATE";

export interface PediatricWeightStatus {
  /** CDC percentile-based weight category */
  category: PediatricWeightCategory;
  /** BMI-for-age z-score; null when indeterminate */
  zScore: number | null;
  /** Percentile 0–100; null when indeterminate */
  percentile: number | null;
  /**
   * Consumed by calculatePediatricHealthyEER().
   * True → use overweight DRI equations (no growth energy bonus).
   * False → use normal-weight DRI equations (includes growth energy).
   */
  useOverweightEER: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const INDETERMINATE: PediatricWeightStatus = {
  category: "INDETERMINATE",
  zScore: null,
  percentile: null,
  useOverweightEER: false,
};

function categorise(pct: number): PediatricWeightCategory {
  if (pct < 5) return "UNDERWEIGHT";
  if (pct < 85) return "NORMAL_WEIGHT";
  if (pct < 95) return "OVERWEIGHT";
  return "OBESE";
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Classify a pediatric patient's weight status from BMI-for-age.
 *
 * @param ageDays  Age in days (from useCalculatedMetrics)
 * @param bmi      BMI kg/m² (already computed by useCalculatedMetrics)
 * @param sex      "M" | "F"
 */
export function classifyPediatricWeightStatus(opts: {
  ageDays: number;
  bmi: number;
  sex: "M" | "F";
}): PediatricWeightStatus {
  const { ageDays, bmi, sex } = opts;

  // Guard: valid inputs
  if (!ageDays || ageDays <= 0 || !bmi || bmi <= 0 || isNaN(bmi)) {
    return INDETERMINATE;
  }

  // Guard: adult
  if (ageDays >= 6570) return INDETERMINATE;

  // Age < 24 months: no BMI-for-age table available
  if (ageDays <= 730) return INDETERMINATE;

  // CDC path: 24 months to 18 years
  const sexFiltered = cdcBySex(cdcBmiage, sex);
  const ageMos = ageDays / 30.4375;
  const row = getClosestRow(sexFiltered, "Agemos", ageMos);

  if (
    !row ||
    row["L"] === undefined ||
    row["M"] === undefined ||
    row["S"] === undefined ||
    isNaN(row["L"]) ||
    isNaN(row["M"]) ||
    isNaN(row["S"]) ||
    row["M"] <= 0
  ) {
    return INDETERMINATE;
  }

  const z = calcLMSZScore(bmi, row["L"], row["M"], row["S"], true); // isCDC = true

  if (isNaN(z) || !isFinite(z)) return INDETERMINATE;

  const pct = stdNormCDF(z) * 100;
  const category = categorise(pct);

  return {
    category,
    zScore: Math.round(z * 100) / 100,
    percentile: Math.round(pct * 10) / 10,
    useOverweightEER: category === "OVERWEIGHT" || category === "OBESE",
  };
}