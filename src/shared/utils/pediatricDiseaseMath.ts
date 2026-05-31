// Pediatric Disease Clinical Engine
// src/shared/utils/pediatricDiseaseMath.ts

import { calcPediatricInsensibleLoss } from "./clinicalMath";

// ─── Re-exports ───────────────────────────────────────────────────────────────

/**
 * Pediatric BSA-scaled insensible fluid loss.
 * Canonical implementation in clinicalMath.ts.
 * Re-exported here for backwards compatibility with existing imports.
 */
export { calcPediatricInsensibleLoss as calculatePediatricInsensibleLoss };

// ─── BMR ─────────────────────────────────────────────────────────────────────

/**
 * Schofield Height-Weight (WH) BMR — Pediatric.
 * Used as the base REE for all disease-state pediatric energy calculations.
 *
 * Distinct from the adult Schofield BMR in clinicalMath.ts (calcSchofieldBMR),
 * which uses different coefficients and height in metres vs cm here.
 */
export function calculateSchofieldWH(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  const { ageDays, weightKg, heightCm, sex } = opts;
  const isMale = sex === "M";

  // 0–2.99 years (< 1095.75 days)
  if (ageDays < 1095.75) {
    if (isMale) return 0.167 * weightKg + 15.174 * heightCm - 617.6;
    return 16.252 * weightKg + 10.232 * heightCm - 413.5;
  }

  // 3.00–9.99 years (< 3652.5 days)
  if (ageDays < 3652.5) {
    if (isMale) return 19.59 * weightKg + 1.303 * heightCm + 414.9;
    return 16.969 * weightKg + 1.618 * heightCm + 371.2;
  }

  // 10.00–17.99 years
  if (isMale) return 16.25 * weightKg + 1.372 * heightCm + 515.5;
  return 8.365 * weightKg + 4.65 * heightCm + 200.0;
}

// ─── Stress Factor ────────────────────────────────────────────────────────────

/**
 * Pediatric Stress Factor — maps PAL + clinical condition to a TEE multiplier.
 *
 * 1.3 — Well-nourished, bedrest, mild-moderate stress
 * 1.5 — Normally active mild-mod stress; OR inactive severe/oncology;
 *        OR inactive + malnutrition catch-up
 * 1.7 — Active child with severe stress OR malnutrition catch-up growth
 */
export function getPediatricStressFactor(pal: number, condition: string): number {
  const isInactive    = pal < 1.4;
  const isActive      = pal >= 1.9;
  const isSevereStress = ["critical_illness", "burns", "trauma"].includes(condition);
  const isMalnourished = condition === "severe_malnutrition";

  // 1.7: Active + (catch-up or severe stress)
  if (isActive && (isMalnourished || isSevereStress)) return 1.7;

  // 1.5: Normally active mild-mod (no severe, no malnutrition)
  if (!isInactive && !isActive && !isSevereStress && !isMalnourished) return 1.5;
  // 1.5: Inactive + severe or oncology
  if (isInactive && (isSevereStress || condition === "oncology")) return 1.5;
  // 1.5: Inactive + malnutrition catch-up
  if (isInactive && isMalnourished) return 1.5;

  // 1.3: Inactive, well-nourished, mild-moderate stress
  if (isInactive && !isSevereStress && !isMalnourished) return 1.3;

  // Fallbacks
  if (isActive) return 1.5;
  if (isSevereStress || isMalnourished) return 1.7;

  return 1.5;
}

// ─── Energy ───────────────────────────────────────────────────────────────────

/**
 * Pediatric AKI Energy Override.
 * Schofield WH BMR × 1.3 (strict bedrest stress factor).
 */
export function calculatePediatricAKIEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  return calculateSchofieldWH(opts) * 1.3;
}

// ─── Protein ──────────────────────────────────────────────────────────────────

/**
 * Targeted Surgical Protein Goals — ASPEN Critical Care Pediatric.
 *
 * Condition-specific overrides in priority order:
 *   1. Burns:                         1.5–2.5 g/kg
 *   2. AKI on dialysis / CRRT:        up to 2.5 g/kg
 *   3. AKI without CRRT:              0.8–1.2 g/kg
 *   4. Open Abdomen / Surgical Trauma:
 *        Base by age (< 2y: 2.5 g/kg, < 13y: 1.75 g/kg, ≥ 13y: 1.5 g/kg)
 *        + dynamic exudate adjustment (+15–30 g per litre of wound drainage)
 *   5. Default Critical Illness:
 *        < 2y:  2.0–3.0 g/kg
 *        < 13y: 1.5–2.0 g/kg
 *        ≥ 13y: 1.5 g/kg
 */
export function calculatePediatricDiseaseProtein(opts: {
  ageDays: number;
  weightKg: number;
  condition: string;
  variant: string;
  extraInputs: Record<string, any>;
}): { min: number; max: number } {
  const { ageDays, weightKg, condition, variant, extraInputs } = opts;
  const ageYears = ageDays / 365.25;

  // 1. Burns
  if (condition === "burns") {
    return { min: 1.5 * weightKg, max: 2.5 * weightKg };
  }

  // 2. AKI on dialysis / CRRT
  if (condition === "aki" && (variant === "dialysis" || variant === "crrt")) {
    return { min: 0, max: 2.5 * weightKg };
  }

  // 3. AKI without CRRT
  if (condition === "aki" && variant === "no_dialysis") {
    return { min: 0.8 * weightKg, max: 1.2 * weightKg };
  }

  // 4. Open Abdomen / Surgical Trauma
  if (condition === "trauma" && variant === "open_abdomen") {
    let baseGPerKg = 1.5;
    if (ageYears < 2)  baseGPerKg = 2.5;
    else if (ageYears < 13) baseGPerKg = 1.75;

    const baseProtein = baseGPerKg * weightKg;
    const exudateL    = parseFloat(extraInputs.exudateVolumeL) || 0;

    return {
      min: baseProtein + exudateL * 15,
      max: baseProtein + exudateL * 30,
    };
  }

  // 5. Default Critical Illness
  if (ageYears < 2)  return { min: 2.0 * weightKg, max: 3.0 * weightKg };
  if (ageYears < 13) return { min: 1.5 * weightKg, max: 2.0 * weightKg };
  return { min: 1.5 * weightKg, max: 1.5 * weightKg };
}