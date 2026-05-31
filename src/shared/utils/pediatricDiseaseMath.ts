/**
 * Pediatric Disease Clinical Engine
 * 
 * This utility provides mathematical logic for 'Unhealthy' pediatric paths (condition !== 'healthy').
 * Includes Schofield WH BMR formulas, Stress Factor TEE, and ASPEN Protein overrides.
 */

/**
 * Schofield Height-Weight (WH) BMR Engine
 */
export function calculateSchofieldWH(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  const { ageDays, weightKg, heightCm, sex } = opts;
  const isMale = sex === "M";

  // 0 to 2.99 years (0 to 1095 days)
  if (ageDays < 1095.75) {
    if (isMale) {
      return 0.167 * weightKg + 15.174 * heightCm - 617.6;
    } else {
      return 16.252 * weightKg + 10.232 * heightCm - 413.5;
    }
  }
  // 3.00 to 9.99 years (1096 to 3652 days)
  if (ageDays < 3652.5) {
    if (isMale) {
      return 19.59 * weightKg + 1.303 * heightCm + 414.9;
    } else {
      return 16.969 * weightKg + 1.618 * heightCm + 371.2;
    }
  }
  // 10.00 to 17.99 years
  if (isMale) {
    return 16.25 * weightKg + 1.372 * heightCm + 515.5;
  } else {
    return 8.365 * weightKg + 4.65 * heightCm + 200.0;
  }
}

/**
 * Pediatric Stress Factor Mapping
 */
export function getPediatricStressFactor(pal: number, condition: string): number {
  const isInactive = pal < 1.4;
  const isActive = pal >= 1.9;
  const isSevereStress = ["critical_illness", "burns", "trauma"].includes(condition);
  const isMalnourished = condition === "severe_malnutrition";

  // 1.7: Active child requiring catch-up; OR active child with severe stress.
  if (isActive && (isMalnourished || isSevereStress)) return 1.7;

  // 1.5: Normally active child with mild to moderate stress; 
  // OR an inactive child with severe stress (e.g., cancer); 
  // OR a child with minimal activity and malnutrition requiring catch-up growth.
  if (!isInactive && !isActive && !isSevereStress && !isMalnourished) return 1.5; // Normally active, mild-mod
  if (isInactive && (isSevereStress || condition === "oncology")) return 1.5; // Inactive, severe
  if (isInactive && isMalnourished) return 1.5; // Minimal activity + malnutrition

  // 1.3: Well-nourished child on bedrest with mild to moderate stress.
  if (isInactive && !isSevereStress && !isMalnourished) return 1.3;

  // Fallbacks
  if (isActive) return 1.5; // Active mild-mod
  if (isSevereStress || isMalnourished) return 1.7; // Catch-all for high stress/catch-up
  
  return 1.5; // Default
}

/**
 * Targeted Surgical Protein Goals (ASPEN Critical Care)
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

  // 1. Burns & Hypermetabolic Trauma
  if (condition === "burns") {
    return { min: 1.5 * weightKg, max: 2.5 * weightKg };
  }

  // 2. CRRT / Dialysis
  if (condition === "aki" && (variant === "dialysis" || variant === "crrt")) {
    return { min: 0, max: 2.5 * weightKg }; // Up to 2.5 g/kg
  }

  // 3. AKI without CRRT
  if (condition === "aki" && variant === "no_dialysis") {
    return { min: 0.8 * weightKg, max: 1.2 * weightKg };
  }

  // 4. Open Abdomen / Surgical Trauma
  if (condition === "trauma" && variant === "open_abdomen") {
    // Base Requirement (ASPEN Critical Illness)
    let baseGPerKg = 1.5;
    if (ageYears < 2) baseGPerKg = 2.5; // 2-3 g/kg range, use midpoint 2.5
    else if (ageYears < 13) baseGPerKg = 1.75; // 1.5-2 g/kg range, use midpoint 1.75

    let baseProtein = baseGPerKg * weightKg;

    // Dynamic Adjustment (+15 to 30 g per Liter of exudate)
    const exudateL = parseFloat(extraInputs.exudateVolumeL) || 0;
    const minAdj = exudateL * 15;
    const maxAdj = exudateL * 30;

    return { min: baseProtein + minAdj, max: baseProtein + maxAdj };
  }

  // Default Fallback (Critical Illness Base)
  if (ageYears < 2) return { min: 2 * weightKg, max: 3 * weightKg };
  if (ageYears < 13) return { min: 1.5 * weightKg, max: 2 * weightKg };
  return { min: 1.5 * weightKg, max: 1.5 * weightKg };
}
