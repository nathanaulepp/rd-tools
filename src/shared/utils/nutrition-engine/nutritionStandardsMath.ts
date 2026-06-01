// src/shared/utils/nutrition-engine/nutritionStandardsMath.ts
//
// Pure math functions and formatting helpers for the nutrition engine.
// Extracted to break circular dependencies between the main barrel and sub-engines.

import type { EvalStatus } from "../../../types/standards";

// ─── IBW (Hamwi) ──────────────────────────────────────────────────────────────

export function calcIBW(htCm: number, sex: "M" | "F"): number {
  const htIn = htCm / 2.54;
  const inchesOver5Ft = Math.max(0, htIn - 60);
  const base = sex === "M" ? 48.1 : 45.4;
  const perInch = sex === "M" ? 2.72 : 2.27;
  return Math.round((base + perInch * inchesOver5Ft) * 10) / 10;
}

// ─── BSA (Mosteller) ──────────────────────────────────────────────────────────

export function calcBSA(htCm: number, wtKg: number): number {
  if (htCm <= 0 || wtKg <= 0) return 0;
  return Math.sqrt((htCm * wtKg) / 3600);
}

// ─── Fleisch BMR (kcal/m²/hr) ────────────────────────────────────────────────

export function calcFleischBMR(ageYears: number, sex: "M" | "F"): number {
  if (ageYears >= 20) {
    if (sex === "M") return Math.max(30, 38 - 0.073 * (ageYears - 20));
    return Math.max(28, 35 - 0.064 * (ageYears - 20));
  }
  if (sex === "M") {
    if (ageYears < 5)  return 53 - (ageYears - 1) * 0.925;
    if (ageYears < 10) return 49.3 - (ageYears - 5) * 0.98;
    if (ageYears < 15) return 44.4 - (ageYears - 10) * 0.52;
    return 41.8 - (ageYears - 15) * 0.64;
  } else {
    if (ageYears < 5)  return 53 - (ageYears - 1) * 1.15;
    if (ageYears < 10) return 48.4 - (ageYears - 5) * 0.92;
    if (ageYears < 15) return 43.8 - (ageYears - 10) * 0.8;
    return 39.8 - (ageYears - 15) * 0.9;
  }
}

// ─── Harris-Benedict BMR ──────────────────────────────────────────────────────

export function calcHarrisBenedict(
  wtKg: number,
  htCm: number,
  ageYears: number,
  sex: "M" | "F"
): number {
  if (sex === "M") return 88.362 + 13.397 * wtKg + 4.799 * htCm - 5.677 * ageYears;
  return 447.593 + 9.247 * wtKg + 3.098 * htCm - 4.330 * ageYears;
}

// ─── MSJ REE ─────────────────────────────────────────────────────────────────

export function calcMSJ(wtKg: number, htCm: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "M") return 10 * wtKg + 6.25 * htCm - 5 * ageYears + 5;
  return 10 * wtKg + 6.25 * htCm - 5 * ageYears - 161;
}

// ─── PSU 2003b ───────────────────────────────────────────────────────────────

export function calcPSU2003b(msjRee: number, tmaxF: number, veLPerMin: number): number {
  const tmaxC = (tmaxF - 32) * (5 / 9);
  return msjRee * 0.96 + tmaxC * 167 + veLPerMin * 31 - 6212;
}

// ─── PSU 2010 (obese adults ≥ 60) ────────────────────────────────────────────

export function calcPSU2010(msjRee: number, tmaxF: number, veLPerMin: number): number {
  const tmaxC = (tmaxF - 32) * (5 / 9);
  return msjRee * 0.71 + veLPerMin * 64 + tmaxC * 85 - 3085;
}

// ─── Toronto Burns Equation ───────────────────────────────────────────────────

export function calcToronto(
  tbsaPct: number,
  caloricIntakeKcal: number,
  hbeKcal: number,
  coreTempC: number,
  pbd: number
): number {
  return -4343 + 10.5 * tbsaPct + 0.23 * caloricIntakeKcal + 0.84 * hbeKcal + 114 * coreTempC - 4.5 * pbd;
}

// ─── Schofield BMR (adult) ────────────────────────────────────────────────────

export function calcSchofieldBMR(wtKg: number, htM: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "F") {
    if (ageYears < 60) return 8.7 * wtKg - 25 * htM + 865;
    return 9.2 * wtKg + 637 * htM - 302;
  } else {
    if (ageYears < 60) return 11.3 * wtKg + 16 * htM + 901;
    return 8.8 * wtKg + 1128 * htM - 1071;
  }
}

// ─── CF BMR table (adult Schofield-based brackets) ───────────────────────────

export function calcCFBMR(wtKg: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "F") {
    if (ageYears >= 10 && ageYears < 18) return 12.2 * wtKg + 746;
    if (ageYears >= 18 && ageYears < 30) return 14.7 * wtKg + 496;
    return 8.7 * wtKg + 829;
  } else {
    if (ageYears >= 10 && ageYears < 18) return 17.5 * wtKg + 651;
    if (ageYears >= 18 && ageYears < 30) return 15.3 * wtKg + 679;
    return 11.6 * wtKg + 879;
  }
}

// ─── SCD REE (Pediatric) ──────────────────────────────────────────────────────

export function calcSCDREEPeds(wtKg: number, hgbGdL: number, sex: "M" | "F"): number {
  if (sex === "M") return 1305 + 18.6 * wtKg - 55.7 * hgbGdL;
  return 1100 + 13.3 * wtKg - 30.2 * hgbGdL;
}

// ─── Holliday-Segar ───────────────────────────────────────────────────────────

export function calcHolidaySegar(wtKg: number): number {
  if (wtKg <= 10) return wtKg * 100;
  if (wtKg <= 20) return 1000 + (wtKg - 10) * 50;
  if (wtKg <= 40) return 1500 + (wtKg - 20) * 20;
  return 1700;
}

// ─── Eval helpers ─────────────────────────────────────────────────────────────

export function evalStatus(current: number, low: number, high: number): EvalStatus {
  if (current < low) return "LOW";
  if (current > high) return "HIGH";
  return "WNL";
}

export function fmtRange(low: number, high: number, unit: string): string {
  if (Math.abs(low - high) < 0.5) return `${Math.round(low)} ${unit}`;
  return `${Math.round(low)}–${Math.round(high)} ${unit}`;
}

// ─── Pediatric gate helper ────────────────────────────────────────────────────

export function isPedsAge(ageYears: number): boolean {
  return ageYears > 0 && ageYears < 18;
}
