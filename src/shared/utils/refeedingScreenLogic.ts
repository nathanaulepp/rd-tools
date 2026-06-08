// src/shared/utils/refeedingScreenLogic.ts
// Pure functions for RD2B Refeeding Risk Screen.
// No store imports, no side effects. All functions: input → RiskLevel.
//
// Reference: ASPEN Refeeding Syndrome Consensus Recommendations 2020.

import type { RiskLevel, ElectrolyteCriterion } from "../../types/refeedingScreen";

// ── C1: BMI ───────────────────────────────────────────────────────────────────

/**
 * BMI criterion:
 *   16–18.5 kg/m²  → moderate
 *   < 16 kg/m²     → significant
 *   otherwise       → none
 */
export function scoreBMI(bmiNum: number): RiskLevel {
  if (bmiNum <= 0 || isNaN(bmiNum)) return "none";
  if (bmiNum < 16) return "significant";
  if (bmiNum <= 18.5) return "moderate";
  return "none";
}

// ── C2: Weight Loss ───────────────────────────────────────────────────────────

/**
 * Weight loss piecewise criterion:
 *
 *   Moderate (2 criteria needed for moderate overall risk):
 *     ≥ 5% in ≤ 30 days
 *
 *   Significant (1 criterion needed for significant overall risk):
 *     ≥ 7.5% in ≤ 90 days  (≤ 3 months)
 *     OR > 10% in ≤ 180 days (≤ 6 months)
 *     OR on the linear interpolation line: f(day) from (91, 7.5%) to (180, 10%)
 *        → slope = (10 - 7.5) / (180 - 91) = 2.5 / 89
 *        → f(d) = 7.5 + (d - 91) * (2.5 / 89)
 *        For days 91–180: ≥ f(d) → significant
 *
 * @param pct     Percent weight lost (positive number, e.g. 8.2 for 8.2%)
 * @param days    Days over which the loss occurred
 * @returns       RiskLevel
 */
export function scoreWeightLoss(pct: number, days: number): RiskLevel {
  if (pct <= 0 || days <= 0 || isNaN(pct) || isNaN(days)) return "none";

  // -- SIGNIFICANT checks --

  // ≥ 7.5% in ≤ 90 days
  if (days <= 90 && pct >= 7.5) return "significant";

  // Linear interpolation zone: days 91–180
  // f(d) = 7.5 + (d - 91) * (2.5 / 89)  
  if (days > 90 && days <= 180) {
    const threshold = 7.5 + (days - 91) * (2.5 / 89);
    if (pct >= threshold) return "significant";
  }

  // > 10% in ≤ 180 days (catches anything in or beyond the interpolation zone)
  if (days <= 180 && pct > 10) return "significant";

  // -- MODERATE check --
  // ≥ 5% in ≤ 30 days
  if (days <= 30 && pct >= 5) return "moderate";

  return "none";
}

/**
 * Derives weight loss pct from anthro store values.
 * Returns null when UBW, current weight, or UBW date is missing
 * or when the UBW date falls outside the 6-month (180-day) window.
 *
 * @param wtKg         Current weight in kg (from useCalculatedMetrics)
 * @param ubwStr       UBW as entered (raw string from anthro store)
 * @param ubwUnit      Unit of UBW ("kg" | "lbs" | "g" | "oz")
 * @param ubwDate      ISO date string of UBW measurement
 * @param noteDate     ISO date string of current note
 */
export function deriveWeightLoss(
  wtKg: number,
  ubwStr: string,
  ubwUnit: string,
  ubwDate: string,
  noteDate: string
): { pct: number; days: number } | null {
  if (!ubwStr || !ubwDate || !noteDate || wtKg <= 0) return null;

  const ubwRaw = parseFloat(ubwStr);
  if (isNaN(ubwRaw) || ubwRaw <= 0) return null;

  // Convert UBW to kg
  let ubwKg = ubwRaw;
  if (ubwUnit === "lbs") ubwKg = ubwRaw / 2.2046;
  else if (ubwUnit === "g") ubwKg = ubwRaw / 1000;
  else if (ubwUnit === "oz") ubwKg = ubwRaw / 35.274;

  // Days elapsed
  const days = Math.floor(
    (new Date(noteDate).getTime() - new Date(ubwDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Outside 6-month window → unavailable
  if (days < 0 || days > 180) return null;

  const pct = ((ubwKg - wtKg) / ubwKg) * 100;
  if (pct <= 0) return { pct: 0, days }; // no loss

  return { pct, days };
}

// ── C3: Energy Intake ─────────────────────────────────────────────────────────

/**
 * Option 1 — None/negligible oral intake:
 *   5–6 days  → moderate
 *   > 7 days  → significant
 */
export function scoreEnergyOption1(days: number): RiskLevel {
  if (days >= 7) return "significant";
  if (days >= 5) return "moderate";
  return "none";
}

/**
 * Option 2 — % of EER during acute illness/injury:
 *   < 75% for > 7 days  → moderate
 *   < 50% for > 5 days  → significant
 */
export function scoreEnergyOption2(pct: number, days: number): RiskLevel {
  if (pct < 50 && days > 5) return "significant";
  if (pct < 75 && days > 7) return "moderate";
  return "none";
}

/**
 * Option 3 — % of EER (general, >1 month context):
 *   < 75% for > 1 month (> 30 days)  → moderate
 *   < 50% for > 1 month (> 30 days)  → significant
 */
export function scoreEnergyOption3(pct: number, days: number): RiskLevel {
  if (pct < 50 && days > 30) return "significant";
  if (pct < 75 && days > 30) return "moderate";
  return "none";
}

// ── C4: Electrolytes ──────────────────────────────────────────────────────────

/**
 * Highest risk across K, P, Mg.
 * Clinician judgment — each is entered individually.
 */
export function scoreElectrolytes(elec: ElectrolyteCriterion): RiskLevel {
  const levels: RiskLevel[] = [
    elec.potassium,
    elec.phosphorus,
    elec.magnesium,
  ];
  if (levels.includes("significant")) return "significant";
  if (levels.includes("moderate")) return "moderate";
  return "none";
}

// ── C5: Fat Loss (NFPE) ───────────────────────────────────────────────────────

/**
 * Derives fat loss risk from NFPE subcutaneous fat sites.
 * Subcutaneous fat sites in Clinical store:
 *   orbital, cheek, tricepsFat, midAxillary
 *
 * Mapping (ASPEN uses "moderate" and "severe"):
 *   Any "Severe"   → significant
 *   Any "Moderate" → moderate
 *   otherwise      → none
 *
 * Note: The tool uses NFPESeverity = "Normal" | "Mild" | "Moderate" | "Severe" | ""
 */
export function scoreFatLoss(
  orbital: string,
  cheek: string,
  tricepsFat: string,
  midAxillary: string
): RiskLevel {
  const sites = [orbital, cheek, tricepsFat, midAxillary];
  if (sites.includes("Severe")) return "significant";
  if (sites.includes("Moderate")) return "moderate";
  return "none";
}

// ── C6: Muscle Loss (NFPE) ───────────────────────────────────────────────────

/**
 * Derives muscle loss risk from NFPE muscle wasting sites.
 * Muscle sites in Clinical store:
 *   temples, clavicles, shoulders, scapula, interosseous, thighs, calves
 *
 * Per ASPEN table: "Evidence of severe loss" maps to BOTH moderate AND significant risk tier.
 * So the logic here uses "Severe" → significant, "Moderate" → moderate.
 */
export function scoreMuscLoss(
  temples: string,
  clavicles: string,
  shoulders: string,
  scapula: string,
  interosseous: string,
  thighs: string,
  calves: string
): RiskLevel {
  const sites = [temples, clavicles, shoulders, scapula, interosseous, thighs, calves];
  if (sites.includes("Severe")) return "significant";
  if (sites.includes("Moderate")) return "moderate";
  return "none";
}

// ── C7: Comorbidities ────────────────────────────────────────────────────────

/**
 * Any selected comorbidity = either moderate or significant.
 * All listed comorbidities appear in BOTH columns of the ASPEN table
 * (Moderate Disease | Severe Disease), meaning each is scored as:
 *   present → "significant" (worst case; clinician may downgrade via override)
 *
 * Returning "significant" when any are present, "none" when list is empty.
 */
export function scoreComorbidities(selected: string[]): RiskLevel {
  if (selected.length === 0) return "none";
  return "significant";
}

// ── Overall Score ─────────────────────────────────────────────────────────────

export interface CriterionResult {
  label: string;
  risk: RiskLevel;
  source: "auto" | "manual" | "clinical_judgment";
}

export interface OverallRisk {
  level: RiskLevel;
  /** Moderate: total criteria met (need ≥ 2 for moderate, ≥ 1 for significant) */
  significantCount: number;
  moderateCount: number;
  criteria: CriterionResult[];
}

/**
 * Compute the overall refeeding risk.
 *
 * ASPEN logic:
 *   ≥ 1 "significant" criterion → Significant Risk
 *   ≥ 2 "moderate"   criteria  → Moderate Risk
 *   otherwise                  → Low / Not at risk
 */
export function computeOverallRisk(criteria: CriterionResult[]): OverallRisk {
  const sigCount = criteria.filter((c) => c.risk === "significant").length;
  const modCount = criteria.filter((c) => c.risk === "moderate").length;

  let level: RiskLevel = "none";
  if (sigCount >= 1) level = "significant";
  else if (modCount >= 2) level = "moderate";

  return {
    level,
    significantCount: sigCount,
    moderateCount: modCount,
    criteria,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function riskLabel(r: RiskLevel): string {
  if (r === "significant") return "Significant Risk";
  if (r === "moderate") return "Moderate Risk";
  return "Not Met";
}

export function riskColor(r: RiskLevel): string {
  if (r === "significant") return "#e74c3c";
  if (r === "moderate") return "#da7f2b";
  return "#2ecc71";
}