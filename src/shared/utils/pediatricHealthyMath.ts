/**
 * Pediatric Healthy DRI/EER Calculations
 * src/shared/utils/pediatricHealthyMath.ts
 *
 * Mathematical logic for the healthy pediatric path (condition === 'healthy', age < 18).
 * Equations derived from DRI/EER standards.
 *
 * No imports from feature folders.
 */

import { calcHolidaySegar } from "./clinicalMath";

// ─── PA Coefficient Mapping ───────────────────────────────────────────────────

/**
 * Map a continuous PAL slider value (1.0–2.5) to discrete DRI PA coefficients.
 * Applies to ages >= 3 years only. Infants (< 36 months) bypass PA entirely.
 *
 * Sedentary   (1.00–1.39) → 1.00
 * Low Active  (1.40–1.59) → 1.13
 * Active      (1.60–1.89) → 1.26
 * Very Active (1.90–2.50) → 1.42
 */
export function mapPediatricPA(pal: number): number {
  if (pal < 1.40) return 1.00;
  if (pal < 1.60) return 1.13;
  if (pal < 1.90) return 1.26;
  return 1.42;
}

// ─── Energy ───────────────────────────────────────────────────────────────────

/**
 * Calculate EER/TEE for healthy pediatric patients.
 *
 * Infant brackets (no PA factor):
 *   0–3 mo:    TEE = (89 × wt) + 75
 *   3–6 mo:    TEE = (89 × wt) − 44
 *   6–12 mo:   TEE = (89 × wt) − 78
 *   12–36 mo:  TEE = (89 × wt) + 20
 *
 * Ages 3–17.99y — Normal Weight Boys:
 *   EER = 88.5 − (61.9 × age) + PA × (26.7 × wt + 903 × ht[m]) + growth
 *
 * Ages 3–17.99y — Normal Weight Girls:
 *   EER = 135.3 − (30.8 × age) + PA × (10 × wt + 934 × ht[m]) + growth
 *   (growth energy: +20 kcal age < 9y, +25 kcal age 9–18y)
 *
 * Ages 3–17.99y — Overweight Boys:
 *   TEE = 114 − (50.9 × age) + PA × (19.5 × wt + 1161.4 × ht[m])
 *
 * Ages 3–17.99y — Overweight Girls:
 *   TEE = 389 − (41.2 × age) + PA × (15 × wt + 701.6 × ht[m])
 */
export function calculatePediatricHealthyEER(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
  pal: number;
  isOverweight: boolean;
}): number {
  const { ageDays, weightKg, heightCm, sex, pal, isOverweight } = opts;
  const ageYears = ageDays / 365.25;
  const heightM  = heightCm / 100;

  // 0–3 months (≤ 91.3125 days)
  if (ageDays <= 91.3125) return 89 * weightKg + 75;

  // 3–6 months
  if (ageDays <= 182.625) return 89 * weightKg - 44;

  // 6–12 months
  if (ageDays <= 365.25) return 89 * weightKg - 78;

  // 12–35.99 months (< 3 years)
  if (ageDays < 1095.75) return 89 * weightKg + 20;

  // 3–17.99 years
  const pa     = mapPediatricPA(pal);
  const isMale = sex === "M";

  if (isOverweight) {
    if (isMale) {
      return 114 - (50.9 * ageYears) + pa * (19.5 * weightKg + 1161.4 * heightM);
    }
    return 389 - (41.2 * ageYears) + pa * (15 * weightKg + 701.6 * heightM);
  }

  const growthEnergy = ageYears < 9 ? 20 : 25;
  if (isMale) {
    return 88.5 - (61.9 * ageYears) + pa * (26.7 * weightKg + 903 * heightM) + growthEnergy;
  }
  return 135.3 - (30.8 * ageYears) + pa * (10 * weightKg + 934 * heightM) + growthEnergy;
}

// ─── Protein ──────────────────────────────────────────────────────────────────

/**
 * Protein RDA for healthy pediatric patients.
 *
 * 0–6 mo:       1.52 g/kg
 * 6–12 mo:      1.20 g/kg
 * 12 mo–4 y:    1.05 g/kg
 * 4–14 y:       0.95 g/kg
 * 14–18 y:      0.85 g/kg
 */
export function calculatePediatricHealthyProtein(
  ageDays: number,
  weightKg: number
): number {
  const ageYears = ageDays / 365.25;

  let gPerKg = 0.85; // 14–18y default

  if (ageDays <= 182.625)  gPerKg = 1.52; // 0–6 mo
  else if (ageDays <= 365.25)  gPerKg = 1.20; // 6–12 mo
  else if (ageDays < 1461)     gPerKg = 1.05; // 12 mo–4 y
  else if (ageYears < 14)      gPerKg = 0.95; // 4–14 y

  return weightKg * gPerKg;
}

// ─── Fluid ────────────────────────────────────────────────────────────────────

/**
 * Holliday-Segar fluid requirement.
 * Re-exported from clinicalMath.ts — canonical implementation lives there.
 * Kept here for backwards compatibility with existing imports.
 */
export { calcHolidaySegar as calculateHollidaySegar };