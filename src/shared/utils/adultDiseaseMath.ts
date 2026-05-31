/**
 * Adult Disease Clinical Engine
 * src/shared/utils/adultDiseaseMath.ts
 *
 * Mathematical logic for adult disease paths (condition !== 'healthy').
 * Imports all base math from clinicalMath.ts — never from feature folders.
 */

import { calcMSJ, calcAdultInsensibleLoss } from "./clinicalMath";

// ─── Energy ───────────────────────────────────────────────────────────────────

/**
 * Adult AKI Energy Target — Conservative Stabilization.
 *
 * Standard:      MSJ × 1.0–1.1  OR  20–25 kcal/kg (whichever is tighter)
 * Hypermetabolic / CRRT: MSJ × 1.2–1.3
 */
export function calculateAdultAKIEnergy(opts: {
  wtKg: number;
  htCm: number;
  ageYears: number;
  sex: "M" | "F";
  isHypermetabolic?: boolean;
  isOnCRRT?: boolean;
}): { min: number; max: number } {
  const { wtKg, htCm, ageYears, sex, isHypermetabolic, isOnCRRT } = opts;

  const msj = calcMSJ(wtKg, htCm, ageYears, sex);

  if (isHypermetabolic || isOnCRRT) {
    return { min: msj * 1.2, max: msj * 1.3 };
  }

  // Tight baseline — prevent uremic overfeeding
  const msjMin = msj * 1.0;
  const msjMax = msj * 1.1;
  const kgMin  = wtKg * 20;
  const kgMax  = wtKg * 25;

  return {
    min: Math.min(msjMin, kgMin),
    max: Math.max(msjMax, kgMax),
  };
}

// ─── Fluid ────────────────────────────────────────────────────────────────────

/**
 * Adult AKI Fluid Target with Dynamic Fever Modifier.
 *
 * Base: Measured Output + 500 mL insensible loss.
 * Fever modifier: +10% of the 500 mL baseline per 1°C above 37°C.
 *
 * @param measuredOutputMl  24h urine output in mL
 * @param tmaxC             Maximum temperature in prior 24h in Celsius
 */
export function calculateAdultFluidWithFever(opts: {
  measuredOutputMl: number;
  tmaxC: number;
}): number {
  const { measuredOutputMl, tmaxC } = opts;
  return measuredOutputMl + calcAdultInsensibleLoss(tmaxC);
}