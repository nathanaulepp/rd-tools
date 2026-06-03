// Pediatric Disease Clinical Engine
// src/shared/utils/pediatricDiseaseMath.ts

import { calcPediatricInsensibleLoss, calcHolidaySegar } from "./clinicalMath";

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
 * Matrix row 2: set energy to 100% of chronological age EER.
 */
export function calculatePediatricAKIEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  return calculateSchofieldWH(opts) * 1.3;
}

/**
 * Pediatric Acute Pancreatitis Energy.
 * Matrix row 3: Schofield REE × 1.1–1.2 stress factor.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricPancreatitisEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  return { min: bmr * 1.1, max: bmr * 1.2 };
}

/**
 * Pediatric Kidney Transplant Energy.
 * Matrix row 9:
 *   Acute post-op:  Schofield REE × 1.3–1.5
 *   Chronic stable: Standard EER (Schofield × 1.0 for TEE approximation)
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricKidneyTransplantEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
  isAcute: boolean;
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  if (opts.isAcute) return { min: bmr * 1.3, max: bmr * 1.5 };
  // Chronic: taper to standard EER — use Schofield as proxy
  return { min: bmr * 1.0, max: bmr * 1.2 };
}

/**
 * Pediatric COPD Energy.
 * Matrix row 10: Schofield WH × 1.3 AF.
 */
export function calculatePediatricCOPDEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  return calculateSchofieldWH(opts) * 1.3;
}

/**
 * Pediatric Cirrhosis Energy.
 * Matrix row 11: Schofield REE × 1.3–1.5, targeting 120–140% of EAR.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricCirrhosisEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  return { min: bmr * 1.3, max: bmr * 1.5 };
}

/**
 * Pediatric Liver Transplant Energy.
 * Matrix row 12: Schofield REE × 1.4–1.5 acute post-op,
 * targeting minimum 120% of pediatric EAR for catch-up growth.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricLiverTransplantEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
  isAcute: boolean;
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  if (opts.isAcute) return { min: bmr * 1.4, max: bmr * 1.5 };
  // Chronic: reduced but still above EAR
  return { min: bmr * 1.2, max: bmr * 1.3 };
}

/**
 * Pediatric Critical Illness Energy.
 * Matrix row 13: Schofield or WHO BMR *without* added injury factors.
 * (Indirect Calorimetry is gold standard; this is the IC-unavailable fallback.)
 * Returns the BMR only — no multiplier — to prevent overfeeding in acute phase.
 */
export function calculatePediatricCriticalIllnessEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  return calculateSchofieldWH(opts);
}

/**
 * Pediatric Trauma Energy.
 * Matrix row 16: Schofield BMR × 1.3–1.5 trauma stress factor.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricTraumaEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  return { min: bmr * 1.3, max: bmr * 1.5 };
}

/**
 * Pediatric MASLD / MASH Energy.
 * Matrix row 17: EER based on desirable body weight for height (Schofield WH proxy).
 */
export function calculatePediatricMASLDEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  return calculateSchofieldWH(opts);
}

/**
 * Pediatric CF Energy.
 * Matrix row 19: Pediatric Schofield BMR × (AC + DC).
 *   AC: Sedentary 1.3, Active 1.7
 *   DC: FEV1 40-80% +0.2, FEV1 <40% +0.4
 * Returns [min, max] based on 5% variance.
 */
export function calculatePediatricCFEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
  ac: number;
  dc: number;
  isPancreaticSufficient: boolean;
  cfa: number;
  intakeKcal?: number;
  intakeFatG?: number;
}): { min: number; max: number; flags?: string[] } {
  const bmr = calculatePediatricCFBMR(opts.weightKg, opts.heightCm, opts.ageDays, opts.sex);
  const tee = bmr * (opts.ac + opts.dc);
  const flags: string[] = [];

  if (opts.isPancreaticSufficient) {
    return { min: tee * 0.95, max: tee * 1.05 };
  }

  // Weighted absorption model
  const intakeKcal = opts.intakeKcal || tee;
  const intakeFatG = opts.intakeFatG || (intakeKcal * 0.35 / 9);
  const fatKcal = intakeFatG * 9;
  const fatFraction = Math.min(1, fatKcal / Math.max(1, intakeKcal));
  const nonFatFraction = 1 - fatFraction;
  const efficiency = (nonFatFraction * 1.0) + (fatFraction * opts.cfa);

  const corrected = tee / efficiency;
  
  flags.push(`Weighted absorption: ${Math.round(fatFraction * 100)}% fat (${Math.round(intakeFatG)}g) @ ${Math.round(opts.cfa * 100)}% CFA = ${Math.round(efficiency * 100)}% efficiency.`);

  return { 
    min: corrected * 0.95, 
    max: corrected * 1.1,
    flags 
  };
}

/**
 * Pediatric Stroke Energy.
 * Matrix row 20: Schofield REE × 1.2.
 */
export function calculatePediatricStrokeEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): number {
  return calculateSchofieldWH(opts) * 1.2;
}

/**
 * Pediatric Heart Failure Energy.
 * Matrix row 21: Schofield REE × 1.2–1.4 hypermetabolic factor.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricHeartFailureEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  return { min: bmr * 1.2, max: bmr * 1.4 };
}

/**
 * Pediatric SCD Energy.
 * Matrix row 24: Hemoglobin-adjusted sex-specific REE equation × PAL.
 */
export function calculatePediatricSCDEnergy(opts: {
  weightKg: number;
  hgbGdL: number;
  sex: "M" | "F";
  pal: number;
}): number {
  let ree: number;
  if (opts.sex === "M") {
    ree = 1305 + 18.6 * opts.weightKg - 55.7 * opts.hgbGdL;
  } else {
    ree = 1100 + 13.3 * opts.weightKg - 30.2 * opts.hgbGdL;
  }
  return ree * opts.pal;
}

/**
 * Pediatric HSCT Energy.
 * Matrix row 25: Schofield or WHO baseline × 1.6–1.8 (infants) or × 1.4–1.6 (children).
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricHSCTEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  const ageYears = opts.ageDays / 365.25;
  // Infants (<2y): × 1.6–1.8; children (2–18y): × 1.4–1.6
  if (ageYears < 2) return { min: bmr * 1.6, max: bmr * 1.8 };
  return { min: bmr * 1.4, max: bmr * 1.6 };
}

/**
 * Pediatric Burns Energy (Galveston).
 * Matrix row 5:
 *   Galveston Revised (1–11y): 1800×BSA + 1300×(BSA×TBSA/100)
 *   Galveston Adolescent (12–16y): 1500×BSA + 1500×(BSA×TBSA/100)
 * Galveston Infant (<1y) currently flagged for follow-up.
 * Returns [min, max] with 10% variance.
 */
export function calculatePediatricBurnsEnergy(opts: {
  ageDays: number;
  bsa: number;
  tbsaPct: number;
}): { min: number; max: number } {
  const ageYears = opts.ageDays / 365.25;
  const isAdol = ageYears >= 12;
  const baseKcal = isAdol ? 1500 : 1800;
  const burnKcal = isAdol ? 1500 : 1300;

  const galvestonKcal = baseKcal * opts.bsa + burnKcal * (opts.bsa * opts.tbsaPct / 100);
  return { min: galvestonKcal * 0.9, max: galvestonKcal * 1.1 };
}

/**
 * Pediatric Oncology Energy.
 * Matrix row 6: Schofield BMR × pediatric oncology activity/stress factors.
 * Undernourished pediatric oncology patients require 130–150% of predicted REE
 * to support somatic catch-up growth.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricOncologyEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
  isUndernourished: boolean;
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  if (opts.isUndernourished) return { min: bmr * 1.3, max: bmr * 1.5 };
  // Standard oncology: activity factors 1.2–1.4
  return { min: bmr * 1.2, max: bmr * 1.4 };
}

/**
 * Pediatric Pressure Injuries Energy.
 * Matrix row 15: Schofield BMR × pediatric injury stress factor (1.2–1.4).
 * Static adult 35 kcal/kg causes rapid obesity in immobile pediatric patients.
 * Returns [min, max] in kcal/day.
 */
export function calculatePediatricPressureInjuryEnergy(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
}): { min: number; max: number } {
  const bmr = calculateSchofieldWH(opts);
  return { min: bmr * 1.2, max: bmr * 1.4 };
}

// ─── Adolescent-Specific Schofield BMR (for pregnancy/breastfeeding) ─────────

/**
 * Adolescent Schofield BMR (ages 10–17.99y).
 * Used for adolescent pregnancy (14–17y) and breastfeeding safety gates.
 * Distinct from the adult Schofield BMR — uses age-specific coefficients.
 * Weight only (no height term) per the standard Schofield table for this bracket.
 *
 * Ages 10–17.99y:
 *   Male:   17.686 × W + 658.2
 *   Female: 13.384 × W + 692.6
 */
export function calculateAdolescentSchofieldBMR(
  weightKg: number,
  sex: "M" | "F"
): number {
  if (sex === "M") return 17.686 * weightKg + 658.2;
  return 13.384 * weightKg + 692.6;
}

// ─── CF Pediatric BMR (Schofield-based, 0–3 and 3–10 brackets) ──────────────

/**
 * Cystic Fibrosis Pediatric BMR — extends calcCFBMR to include the
 * 0–3y and 3–10y brackets that the adult CF table truncates.
 *
 * Matrix row 19: CF systems frequently truncate age at 10; this adds the
 * missing pediatric brackets from the WHO/Schofield 0–3 and 3–10y tables.
 */
export function calculatePediatricCFBMR(
  weightKg: number,
  heightCm: number,
  ageDays: number,
  sex: "M" | "F"
): number {
  const ageYears = ageDays / 365.25;
  const isMale = sex === "M";

  // 0–2.99y: use Schofield WH infant bracket
  if (ageYears < 3) {
    if (isMale) return 0.167 * weightKg + 15.174 * heightCm - 617.6;
    return 16.252 * weightKg + 10.232 * heightCm - 413.5;
  }

  // 3–9.99y: use Schofield WH 3–10y bracket
  if (ageYears < 10) {
    if (isMale) return 19.59 * weightKg + 1.303 * heightCm + 414.9;
    return 16.969 * weightKg + 1.618 * heightCm + 371.2;
  }

  // 10–17.99y: use standard CF Schofield brackets (Ramsey tables)
  if (ageYears < 18) {
    if (isMale) return 17.5 * weightKg + 651;
    return 12.2 * weightKg + 746;
  }

  // 18–29y (adults — fallback to calcCFBMR logic)
  if (ageYears < 30) {
    if (isMale) return 15.3 * weightKg + 679;
    return 14.7 * weightKg + 496;
  }

  // 30+y
  if (isMale) return 11.6 * weightKg + 879;
  return 8.7 * weightKg + 829;
}

// ─── Protein ──────────────────────────────────────────────────────────────────

/**
 * Pediatric Safe Daily Intake (SDI) protein by age.
 * Used as the baseline for conditions requiring "upper end of SDI" targets
 * (AKI, CKD 3–5, CKD 5D, kidney transplant).
 *
 * SDI values (WHO/FAO/UNU 2007):
 *   0–6 mo:    1.31 g/kg  (upper end of safe range)
 *   6–12 mo:   1.14 g/kg
 *   1–2y:      1.03 g/kg
 *   2–3y:      0.97 g/kg
 *   3–10y:     0.91 g/kg
 *   10–14y:    0.91 g/kg
 *   14–18y:    0.88 g/kg
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