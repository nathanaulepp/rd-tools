/**
 * clinicalMath.ts
 * src/shared/utils/clinicalMath.ts
 *
 * Single source of truth for all pure clinical math functions used across
 * the nutrition evaluation engine, calculated metrics, and disease math utilities.
 *
 * Rules:
 *   - No imports from feature folders
 *   - No side effects
 *   - All functions are pure (input → output only)
 *   - Pediatric-specific BMR/EER logic lives in pediatricHealthyMath.ts and
 *     pediatricDiseaseMath.ts; this file covers shared and adult-primary equations
 *     that are also called by the pediatric disease engine.
 */

// ─── Unit Conversion ──────────────────────────────────────────────────────────

/** Convert Fahrenheit to Celsius. */
export function fToC(f: number): number {
  return (f - 32) * (5 / 9);
}

/** Convert Celsius to Fahrenheit. */
export function cToF(c: number): number {
  return c * (9 / 5) + 32;
}

// ─── Body Composition ─────────────────────────────────────────────────────────

/**
 * Ideal Body Weight — Hamwi method.
 * Used for protein targets in obese critical illness, kidney transplant, etc.
 */
export function calcIBW(htCm: number, sex: "M" | "F"): number {
  const htIn = htCm / 2.54;
  const inchesOver5Ft = Math.max(0, htIn - 60);
  const base = sex === "M" ? 48.1 : 45.4;
  const perInch = sex === "M" ? 2.72 : 2.27;
  return Math.round((base + perInch * inchesOver5Ft) * 10) / 10;
}

/**
 * Body Surface Area — Mosteller formula.
 * Used in burns (Galveston, Milner), pediatric insensible loss scaling.
 * Returns BSA in m².
 */
export function calcBSA(htCm: number, wtKg: number): number {
  if (htCm <= 0 || wtKg <= 0) return 0;
  return Math.sqrt((htCm * wtKg) / 3600);
}

// ─── Resting Energy Expenditure ───────────────────────────────────────────────

/**
 * Mifflin-St Jeor (MSJ) REE.
 * Primary adult REE equation. Used as base for most adult condition calculations.
 *
 * Male:   REE = 10W + 6.25H - 5A + 5
 * Female: REE = 10W + 6.25H - 5A - 161
 */
export function calcMSJ(
  wtKg: number,
  htCm: number,
  ageYears: number,
  sex: "M" | "F"
): number {
  if (sex === "M") return 10 * wtKg + 6.25 * htCm - 5 * ageYears + 5;
  return 10 * wtKg + 6.25 * htCm - 5 * ageYears - 161;
}

/**
 * Schofield BMR — Adult Height-Weight equations.
 * Used for COPD and as a secondary adult option.
 * Distinct from the pediatric Schofield WH equations in pediatricDiseaseMath.ts.
 *
 * Female < 60y:  8.7W  - 25H  + 865
 * Female ≥ 60y:  9.2W  + 637H - 302
 * Male   < 60y:  11.3W + 16H  + 901
 * Male   ≥ 60y:  8.8W  + 1128H - 1071
 *
 * H in metres, W in kg.
 */
export function calcSchofieldBMR(
  wtKg: number,
  htM: number,
  ageYears: number,
  sex: "M" | "F"
): number {
  if (sex === "F") {
    if (ageYears < 60) return 8.7 * wtKg - 25 * htM + 865;
    return 9.2 * wtKg + 637 * htM - 302;
  } else {
    if (ageYears < 60) return 11.3 * wtKg + 16 * htM + 901;
    return 8.8 * wtKg + 1128 * htM - 1071;
  }
}

/**
 * Penn State 2003b equation.
 * For mechanically ventilated adults (non-obese, BMI < 30).
 *
 * PSU = MSJ × 0.96 + Tmax(°C) × 167 + Ve(L/min) × 31 − 6212
 *
 * @param msjRee   Pre-calculated MSJ REE in kcal/day
 * @param tmaxF    Maximum temperature in prior 24h (°F) — converted internally
 * @param veLPerMin Minute ventilation in L/min
 */
export function calcPSU2003b(
  msjRee: number,
  tmaxF: number,
  veLPerMin: number
): number {
  const tmaxC = fToC(tmaxF);
  return msjRee * 0.96 + tmaxC * 167 + veLPerMin * 31 - 6212;
}

/**
 * Penn State 2010 equation.
 * For mechanically ventilated obese adults (BMI > 30, age > 60).
 *
 * PSU2010 = MSJ(0.71) + Ve(64) + Tmax(85) - 3085
 *
 * @param msjRee   Pre-calculated MSJ REE in kcal/day
 * @param tmaxF    Maximum temperature in prior 24h (°F) — converted internally
 * @param veLPerMin Minute ventilation in L/min
 */
export function calcPSU2010(
  msjRee: number,
  tmaxF: number,
  veLPerMin: number
): number {
  const tmaxC = fToC(tmaxF);
  return msjRee * 0.71 + veLPerMin * 64 + tmaxC * 85 - 3085;
}

/**
 * Fleisch BMR — kcal/m²/hr.
 * Used in the Milner burns formula for adults.
 * Age-stratified table approximation via linear interpolation.
 */
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

/**
 * CF (Cystic Fibrosis) BMR — Schofield-based age/sex brackets.
 * Used exclusively for cystic_fibrosis condition.
 *
 * NOTE: Current brackets cover ages 10–60 only.
 * Pediatric brackets (0–3y, 3–10y) and adult > 60y are flagged
 * as clinical gaps to be resolved during the Matrix audit.
 */
export function calcCFBMR(
  wtKg: number,
  ageYears: number,
  sex: "M" | "F"
): number {
  if (sex === "F") {
    if (ageYears >= 10 && ageYears < 18) return 12.2 * wtKg + 746;
    if (ageYears >= 18 && ageYears < 30) return 14.7 * wtKg + 496;
    return 8.7 * wtKg + 829; // 30–60 (and currently >60 — gap flagged)
  } else {
    if (ageYears >= 10 && ageYears < 18) return 17.5 * wtKg + 651;
    if (ageYears >= 18 && ageYears < 30) return 15.3 * wtKg + 679;
    return 11.6 * wtKg + 879; // 30–60 (and currently >60 — gap flagged)
  }
}

/**
 * SCD REE — Pediatric Sickle Cell Disease equation.
 *
 * Male:   REE = 1305 + 18.6(Wt) − 55.7(Hgb)
 * Female: REE = 1100 + 13.3(Wt) − 30.2(Hgb)
 */
export function calcSCDREEPeds(
  wtKg: number,
  hgbGdL: number,
  sex: "M" | "F"
): number {
  if (sex === "M") return 1305 + 18.6 * wtKg - 55.7 * hgbGdL;
  return 1100 + 13.3 * wtKg - 30.2 * hgbGdL;
}

// ─── Fluid ────────────────────────────────────────────────────────────────────

/**
 * Holliday-Segar fluid requirement.
 * Universal pediatric fluid baseline. Also used in HSCT.
 *
 * ≤ 10 kg:       100 mL/kg
 * 10–20 kg:      1000 mL + 50 mL/kg over 10
 * 20–40 kg:      1500 mL + 20 mL/kg over 20
 * > 40 kg:       1700 mL (midpoint of 1500–1800 mL/m² approximation)
 *
 * NOTE: This is the canonical version. The duplicate `calculateHollidaySegar`
 * in pediatricHealthyMath.ts should import from here going forward.
 */
export function calcHolidaySegar(wtKg: number): number {
  if (wtKg <= 10) return wtKg * 100;
  if (wtKg <= 20) return 1000 + (wtKg - 10) * 50;
  if (wtKg <= 40) return 1500 + (wtKg - 20) * 20;
  return 1700;
}

/**
 * Pediatric BSA-scaled insensible fluid loss.
 * Used in AKI fluid calculation when CRRT is not active.
 * Standard: 400 mL × BSA (m²)
 */
export function calcPediatricInsensibleLoss(bsaM2: number): number {
  return 400 * bsaM2;
}

/**
 * Adult AKI insensible loss with dynamic fever modifier.
 * Base: 500 mL. Modifier: +10% per 1°C above 37°C.
 *
 * @param tmaxC  Maximum temperature in prior 24h in Celsius
 */
export function calcAdultInsensibleLoss(tmaxC: number): number {
  const baselineInsensible = 500;
  if (tmaxC <= 37) return baselineInsensible;
  const spike = tmaxC - 37;
  return baselineInsensible * (1 + spike * 0.1);
}

// ─── Eval Helper ──────────────────────────────────────────────────────────────

/**
 * Evaluate whether a current intake value is LOW, WNL, or HIGH
 * relative to a target range.
 */
export type EvalStatus = "LOW" | "WNL" | "HIGH" | "N/A";

export function evalStatus(
  current: number,
  low: number,
  high: number
): EvalStatus {
  if (current < low) return "LOW";
  if (current > high) return "HIGH";
  return "WNL";
}

/**
 * Format a numeric range as a display string.
 * e.g. fmtRange(1800, 2200, "kcal/day") → "1800–2200 kcal/day"
 */
export function fmtRange(low: number, high: number, unit: string): string {
  if (Math.abs(low - high) < 0.5) return `${Math.round(low)} ${unit}`;
  return `${Math.round(low)}–${Math.round(high)} ${unit}`;
}

// ─── Harris-Benedict BMR ──────────────────────────────────────────────────────

/**
 * Harris-Benedict BMR.
 * Used in burns (Toronto equation) as the HBE baseline.
 *
 * Male:   88.362 + 13.397W + 4.799H - 5.677A
 * Female: 447.593 + 9.247W + 3.098H - 4.330A
 */
export function calcHarrisBenedict(
  wtKg: number,
  htCm: number,
  ageYears: number,
  sex: "M" | "F"
): number {
  if (sex === "M") return 88.362 + 13.397 * wtKg + 4.799 * htCm - 5.677 * ageYears;
  return 447.593 + 9.247 * wtKg + 3.098 * htCm - 4.330 * ageYears;
}

// ─── Toronto Burns Equation ───────────────────────────────────────────────────

/**
 * Toronto burns equation.
 * Used for adult burns (preferred over Milner for preventing overfeeding).
 *
 * TEE = -4343 + 10.5×TBSA + 0.23×caloricIntake + 0.84×HBE + 114×coreTempC - 4.5×PBD
 */
export function calcToronto(
  tbsaPct: number,
  caloricIntakeKcal: number,
  hbeKcal: number,
  coreTempC: number,
  pbd: number
): number {
  return (
    -4343 +
    10.5 * tbsaPct +
    0.23 * caloricIntakeKcal +
    0.84 * hbeKcal +
    114 * coreTempC -
    4.5 * pbd
  );
}

// ─── Pediatric age gate ───────────────────────────────────────────────────────

/**
 * Returns true when ageYears is in the pediatric range (0 < age < 18).
 * Used by the nutrition engine to route to the correct sub-engine.
 */
export function isPedsAge(ageYears: number): boolean {
  return ageYears > 0 && ageYears < 18;
}

// ─── Pediatric Math Logic (Moved from legacy files) ──────────────────────────

/**
 * Map a continuous PAL slider value (1.0–2.5) to discrete DRI PA coefficients.
 * Applies to ages >= 3 years only. Infants (< 36 months) bypass PA entirely.
 */
export function mapPediatricPA(pal: number): number {
  if (pal < 1.40) return 1.00;
  if (pal < 1.60) return 1.13;
  if (pal < 1.90) return 1.26;
  return 1.42;
}

/**
 * Calculate EER/TEE for healthy pediatric patients.
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

/**
 * Protein RDA for healthy pediatric patients.
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

/**
 * Schofield Height-Weight (WH) BMR — Pediatric.
 * Used as the base REE for all disease-state pediatric energy calculations.
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

/**
 * Pediatric Stress Factor — maps PAL + clinical condition to a TEE multiplier.
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

/**
 * Pediatric Safe Daily Intake (SDI) protein by age.
 */
export function getPediatricSDI(ageDays: number, weightKg: number): number {
  const ageYears = ageDays / 365.25;

  if (ageDays <= 182.6)  return 1.31 * weightKg;  // 0–6 mo
  if (ageDays <= 365.25) return 1.14 * weightKg;  // 6–12 mo
  if (ageYears < 2)      return 1.03 * weightKg;  // 1–2y
  if (ageYears < 3)      return 0.97 * weightKg;  // 2–3y
  if (ageYears < 10)     return 0.91 * weightKg;  // 3–10y
  if (ageYears < 14)     return 0.91 * weightKg;  // 10–14y
  return 0.88 * weightKg;                         // 14–18y
}

/**
 * Targeted Surgical Protein Goals — ASPEN Critical Care Pediatric.
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

    // Source: Hourigan et al. (2010). NPWT exudate protein loss is ~29g/L.
    const extraProtein = exudateL * 29;

    return {
      min: baseProtein + extraProtein,
      max: baseProtein + extraProtein,
    };
  }

  // CKD 3–5: upper end of SDI (matrix row 7)
  if (condition === "ckd_3_5") {
    const sdi = getPediatricSDI(ageDays, weightKg);
    return { min: sdi * 0.9, max: sdi };
  }

  // CKD 5D: SDI + dialysate loss allowance 0.1–0.3 g/kg (matrix row 8)
  if (condition === "ckd_5d") {
    const sdi = getPediatricSDI(ageDays, weightKg);
    return { min: sdi, max: sdi + (0.2 * weightKg) };
  }

  // Cirrhosis: 2.5–3.0 g/kg to prevent sarcopenia (matrix row 11)
  if (condition === "cirrhosis_updated") {
    return { min: 2.5 * weightKg, max: 3.0 * weightKg };
  }

  // Liver Transplant (matrix row 12)
  if (condition === "liver_transplant") {
    if (variant === "acute") return { min: 2.0 * weightKg, max: 2.5 * weightKg };
    return { min: 1.5 * weightKg, max: 2.0 * weightKg };
  }

  // Kidney Transplant (matrix row 9)
  if (condition === "kidney_transplant") {
    const sdi = getPediatricSDI(ageDays, weightKg);
    if (variant === "acute") return { min: 1.5 * weightKg, max: 2.0 * weightKg };
    return { min: sdi * 0.9, max: sdi };
  }

  // Oncology: standard 1.0–2.5 g/kg (varies by intensity)
  if (condition === "oncology" || condition === "cancer") {
    if (variant === "high_protein") return { min: 1.5 * weightKg, max: 2.5 * weightKg };
    return { min: 1.0 * weightKg, max: 1.5 * weightKg };
  }

  // HSCT: higher targets for pediatric engraftment
  if (condition === "hsct") {
    if (ageYears < 2) return { min: 2.5 * weightKg, max: 3.0 * weightKg };
    if (ageYears < 6) return { min: 2.0 * weightKg, max: 2.5 * weightKg };
    return { min: 1.5 * weightKg, max: 2.0 * weightKg };
  }

  // Trauma: may exceed 2.0 g/kg (matrix row 16)
  if (condition === "trauma") {
    if (ageYears < 2)  return { min: 2.0 * weightKg, max: 3.0 * weightKg };
    if (ageYears < 13) return { min: 1.5 * weightKg, max: 2.5 * weightKg };
    return { min: 1.5 * weightKg, max: 2.5 * weightKg };
  }

  // Heart failure: standard 1.5–2.0 g/kg
  if (condition === "heart_failure") {
    return { min: 1.5 * weightKg, max: 2.0 * weightKg };
  }

  // Pressure injuries: replace measured exudate loss (matrix row 15)
  // Without exudate measurement, use 1.5–2.0 g/kg
  if (condition === "pressure_injuries") {
    if (variant === "stage_3_4") return { min: 1.5 * weightKg, max: 2.5 * weightKg };
    return { min: 1.25 * weightKg, max: 2.0 * weightKg };
  }

  // Stroke: 1.0–2.5 g/kg depending on hemorrhagic vs ischemic
  if (condition === "stroke") {
    if (variant === "hemorrhagic") return { min: 1.5 * weightKg, max: 2.5 * weightKg };
    return { min: 1.0 * weightKg, max: 1.5 * weightKg };
  }

  // 5. Default Critical Illness
  if (ageYears < 2)  return { min: 2.0 * weightKg, max: 3.0 * weightKg };
  if (ageYears < 13) return { min: 1.5 * weightKg, max: 2.0 * weightKg };
  return { min: 1.5 * weightKg, max: 1.5 * weightKg };
}

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