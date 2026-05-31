// src/features/assessment/assess-standards/nutritionStandards.ts
// Phase 8: Added MASLD/MASH, Short Bowel, Cystic Fibrosis, Stroke, Heart Failure,
//          Obesity Stable, Severe Malnutrition, Sickle Cell, HSCT, updated Oncology,
//          updated Burns (Curreri), updated Critical Illness (PSU 2003b),
//          updated COPD (Schofield), updated Pregnancy (split T2/T3),
//          updated Pressure Injuries targets.

export type EvalStatus = "LOW" | "WNL" | "HIGH" | "N/A";

export interface PatientInputs {
  wtKg: number;
  htCm: number;
  ageYears: number;
  sex: "M" | "F";
  bmi: number;
  weightLabel?: string;
  icMeasuredKcal?: number;
  icCaf?: number;
}

export interface CurrentRx {
  kcalPerDay: number;
  proteinGPerDay: number;
  fluidMlPerDay?: number;
}

export interface EvalResult {
  label: string;
  target: string;
  current: number;
  unit: string;
  status: EvalStatus;
  note?: string;
}

export interface NutritionEvaluation {
  ibwKg: number;
  reeKcal: number;
  eeKcal: number;
  eeSource: "IC" | "MSJ×AF" | "MSJ×CAF" | "PSU 2003b" | "Schofield×AF" | "CF Formula" | "Curreri" | "Milner" | "Galveston" | "SCD REE" | "BEE×AF" | "HSCT";
  afUsed?: number;
  cafUsed?: number;
  weightUsed: number;
  weightLabel: string;
  results: EvalResult[];
  flags: string[];
}

// ─── Condition Keys ───────────────────────────────────────────────────────────

export type ConditionKey =
  | "aki"
  | "acute_pancreatitis"
  | "breastfeeding"
  | "burns"
  | "oncology"
  | "cancer"           // legacy alias — resolves to oncology logic
  | "ckd_3_5"
  | "ckd_5d"
  | "kidney_transplant"
  | "copd"
  | "cirrhosis_updated"
  | "liver_transplant"
  | "critical_illness"
  | "pregnancy"
  | "pressure_injuries"
  | "trauma"
  | "healthy"
  | "masld_mash"
  | "short_bowel"
  | "cystic_fibrosis"
  | "stroke"
  | "heart_failure"
  | "obesity_stable"
  | "severe_malnutrition"
  | "sickle_cell"
  | "hsct";

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
  // Using linear approximation for adults over 20, and table-based or polynomial for younger
  if (ageYears >= 20) {
    if (sex === "M") return Math.max(30, 38 - 0.073 * (ageYears - 20));
    return Math.max(28, 35 - 0.064 * (ageYears - 20));
  }
  // Simplified polynomial/linear interpolation for ages 1-19
  if (sex === "M") {
    if (ageYears < 5) return 53 - (ageYears - 1) * 0.925; // 1 to 5: 53.0 to 49.3
    if (ageYears < 10) return 49.3 - (ageYears - 5) * 0.98; // 5 to 10: 49.3 to 44.4
    if (ageYears < 15) return 44.4 - (ageYears - 10) * 0.52; // 10 to 15: 44.4 to 41.8
    return 41.8 - (ageYears - 15) * 0.64; // 15 to 20: 41.8 to 38.6
  } else {
    if (ageYears < 5) return 53 - (ageYears - 1) * 1.15; // 1 to 5: 53.0 to 48.4
    if (ageYears < 10) return 48.4 - (ageYears - 5) * 0.92; // 5 to 10: 48.4 to 43.8
    if (ageYears < 15) return 43.8 - (ageYears - 10) * 0.8; // 10 to 15: 43.8 to 39.8
    return 39.8 - (ageYears - 15) * 0.9; // 15 to 20: 39.8 to 35.3
  }
}

// ─── MSJ REE ─────────────────────────────────────────────────────────────────

export function calcMSJ(wtKg: number, htCm: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "M") return 10 * wtKg + 6.25 * htCm - 5 * ageYears + 5;
  return 10 * wtKg + 6.25 * htCm - 5 * ageYears - 161;
}

// ─── PSU 2003b ───────────────────────────────────────────────────────────────
// PSU = MSJ × 0.96 + Tmax_C × 167 + Ve × 31 − 6212
// Tmax in Celsius, Ve in L/min

export function calcPSU2003b(
  msjRee: number,
  tmaxF: number,
  veLPerMin: number
): number {
  const tmaxC = (tmaxF - 32) * (5 / 9);
  return msjRee * 0.96 + tmaxC * 167 + veLPerMin * 31 - 6212;
}

// ─── Schofield BMR (for COPD, CF) ────────────────────────────────────────────

export function calcSchofieldBMR(wtKg: number, htM: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "F") {
    if (ageYears < 60) return 8.7 * wtKg - 25 * htM + 865;
    return 9.2 * wtKg + 637 * htM - 302;
  } else {
    if (ageYears < 60) return 11.3 * wtKg + 16 * htM + 901;
    return 8.8 * wtKg + 1128 * htM - 1071;
  }
}

// ─── CF BMR table (Schofield-based, age/sex brackets) ────────────────────────

export function calcCFBMR(wtKg: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "F") {
    if (ageYears >= 10 && ageYears < 18) return 12.2 * wtKg + 746;
    if (ageYears >= 18 && ageYears < 30) return 14.7 * wtKg + 496;
    return 8.7 * wtKg + 829; // 30-60
  } else {
    if (ageYears >= 10 && ageYears < 18) return 17.5 * wtKg + 651;
    if (ageYears >= 18 && ageYears < 30) return 15.3 * wtKg + 679;
    return 11.6 * wtKg + 879; // 30-60
  }
}

// ─── SCD REE (Pediatric) ──────────────────────────────────────────────────────

export function calcSCDREEPeds(wtKg: number, hgbGdL: number, sex: "M" | "F"): number {
  if (sex === "M") return 1305 + 18.6 * wtKg - 55.7 * hgbGdL;
  return 1100 + 13.3 * wtKg - 30.2 * hgbGdL;
}

// ─── HSCT fluid (Holliday-Segar) ──────────────────────────────────────────────

export function calcHolidaySegar(wtKg: number): number {
  if (wtKg <= 10) return wtKg * 100;
  if (wtKg <= 20) return 1000 + (wtKg - 10) * 50;
  if (wtKg <= 40) return 1500 + (wtKg - 20) * 20;
  return 1700; // >40 kg: use 1500–1800 mL/m² approximation — 1700 is midpoint
}

// ─── Eval helper ──────────────────────────────────────────────────────────────

function evalStatus(current: number, low: number, high: number): EvalStatus {
  if (current < low) return "LOW";
  if (current > high) return "HIGH";
  return "WNL";
}

function fmtRange(low: number, high: number, unit: string): string {
  if (Math.abs(low - high) < 0.5) return `${Math.round(low)} ${unit}`;
  return `${Math.round(low)}–${Math.round(high)} ${unit}`;
}

// ─── Condition Labels ─────────────────────────────────────────────────────────

export const CONDITION_LABELS: Record<ConditionKey, string> = {
  aki: "AKI (Acute Kidney Injury)",
  acute_pancreatitis: "Acute Pancreatitis",
  breastfeeding: "Breastfeeding",
  burns: "Burns",
  oncology: "Oncology (Cancer)",
  cancer: "Oncology (Cancer)",  // legacy alias
  ckd_3_5: "CKD Stages 3–5 (Pre-dialysis)",
  ckd_5d: "CKD Stage 5D (HD / PD)",
  kidney_transplant: "Kidney Transplant",
  copd: "COPD",
  cirrhosis_updated: "Cirrhosis",
  liver_transplant: "Liver Transplant",
  critical_illness: "Critical Illness",
  pregnancy: "Pregnancy",
  pressure_injuries: "Pressure Injuries / Wounds",
  trauma: "Trauma",
  healthy: "Healthy / Preventive",
  masld_mash: "MASLD / MASH (Hepatic Steatosis)",
  short_bowel: "Short Bowel Syndrome",
  cystic_fibrosis: "Cystic Fibrosis",
  stroke: "Stroke (CVA)",
  heart_failure: "Heart Failure / Cardiovascular",
  obesity_stable: "Obesity / Metabolic Syndrome (Stable)",
  severe_malnutrition: "Severe Malnutrition / Refeeding Risk",
  sickle_cell: "Sickle Cell Disease",
  hsct: "Hematopoietic Stem Cell Transplant (HSCT)",
};

// ─── Condition Variants ───────────────────────────────────────────────────────

export const CONDITION_VARIANTS: Partial<Record<ConditionKey, { key: string; label: string; minAge?: number; maxAge?: number; sex?: "M" | "F" }[]>> = {
  aki: [
    { key: "no_dialysis", label: "No Dialysis / Non-catabolic" },
    { key: "dialysis", label: "Hemodialysis / Catabolic" },
    { key: "crrt", label: "CRRT / Critical" },
  ],
  acute_pancreatitis: [
    { key: "mild_moderate", label: "Mild–Moderate" },
    { key: "severe_critical", label: "Severe / Critical / ICU" },
  ],
  breastfeeding: [
    { key: "early", label: "0–6 months postpartum", sex: "F", minAge: 12 },
    { key: "late", label: "7–12 months postpartum", sex: "F", minAge: 12 },
  ],
  burns: [
    { key: "adult", label: "Adult (Milner)", minAge: 18 },
    { key: "child_1_11", label: "Child 1–11y (Galveston)", minAge: 1, maxAge: 11.9 },
    { key: "adolescent_12_16", label: "Adolescent 12–16y (Galveston)", minAge: 12, maxAge: 16.9 },
  ],
  oncology: [
    { key: "non_ambulatory", label: "Non-ambulatory / Sedentary" },
    { key: "hypermetabolic", label: "Hypermetabolic / Treatment" },
    { key: "severely_stressed", label: "Severely Stressed / HCT first month" },
    { key: "high_protein", label: "High Protein Needs (wasting/enteropathy)" },
  ],
  cancer: [  // legacy alias variants
    { key: "non_ambulatory", label: "Non-ambulatory / Sedentary" },
    { key: "hypermetabolic", label: "Hypermetabolic / Treatment" },
    { key: "severely_stressed", label: "Severely Stressed / HCT first month" },
    { key: "high_protein", label: "High Protein Needs (wasting/enteropathy)" },
  ],
  ckd_3_5: [
    { key: "vlcd", label: "VLCD + Keto Analogs" },
    { key: "lcd", label: "Low-Protein Diet" },
    { key: "lcd_dm", label: "Low-Protein + Diabetes" },
  ],
  ckd_5d: [
    { key: "hd", label: "Hemodialysis (HD)" },
    { key: "pd", label: "Peritoneal Dialysis (PD)" },
  ],
  kidney_transplant: [
    { key: "acute", label: "Acute (Post-op)" },
    { key: "chronic", label: "Chronic (Stable, no DM)" },
    { key: "chronic_dm", label: "Chronic + Diabetes" },
  ],
  cirrhosis_updated: [
    { key: "standard", label: "Standard / Compensated" },
    { key: "critical", label: "Critical / Decompensated" },
  ],
  liver_transplant: [
    { key: "acute", label: "Acute (Post-op)" },
    { key: "chronic", label: "Chronic (Stable)" },
  ],
  critical_illness: [
    { key: "bmi_lt30", label: "BMI < 30" },
    { key: "bmi_30_50", label: "BMI 30–50 (Obese)" },
    { key: "bmi_gt50", label: "BMI > 50 (Severely Obese)" },
  ],
  pregnancy: [
    { key: "t1", label: "Trimester 1 (+0 kcal)", sex: "F", minAge: 12 },
    { key: "t2", label: "Trimester 2 (+340 kcal)", sex: "F", minAge: 12 },
    { key: "t3", label: "Trimester 3 (+452 kcal)", sex: "F", minAge: 12 },
  ],
  pressure_injuries: [
    { key: "stage_1_2", label: "Stage 1–2" },
    { key: "stage_3_4", label: "Stage 3–4" },
  ],
  masld_mash: [
    { key: "bmi_lt30", label: "BMI < 30 (Standard)" },
    { key: "bmi_30_40", label: "BMI 30–40" },
    { key: "bmi_gt40", label: "BMI ≥ 40" },
    { key: "malnourished", label: "Underweight / Malnourished / Sarcopenic" },
  ],
  cystic_fibrosis: [
    { key: "bed", label: "Bed-bound" },
    { key: "sedentary", label: "Sedentary" },
    { key: "active", label: "Active" },
  ],
  stroke: [
    { key: "standard", label: "Ischemic / Standard" },
    { key: "hemorrhagic", label: "Hemorrhagic / High Protein" },
  ],
  sickle_cell: [
    { key: "peds_stable", label: "Pediatric — Stable", maxAge: 17.9 },
    { key: "peds_crisis", label: "Pediatric — VOC / Crisis", maxAge: 17.9 },
    { key: "adult_stable", label: "Adult — Stable", minAge: 18 },
    { key: "adult_underweight", label: "Adult — Underweight", minAge: 18 },
  ],
  hsct: [
    { key: "infant_child", label: "Infants & Young Children (BMR × 1.6–1.8)", maxAge: 5.9 },
    { key: "child_16", label: "Children ≤ 16 yr / ≤ 75 kg (BMR × 1.6)", maxAge: 16 },
    { key: "older_adol", label: "Older Adolescent > 16 yr or > 75 kg (BEE × 1.5–1.6)", minAge: 16.1, maxAge: 17.9 },
    { key: "adult", label: "Adult (BEE × 1.5 or 30–35 kcal/kg)", minAge: 18 },
    { key: "post_engraft", label: "Post-engraftment / Recovery" },
  ],
};

// ─── Extra inputs ─────────────────────────────────────────────────────────────

export const CONDITION_EXTRA_INPUTS: Partial<Record<ConditionKey, {
  key: string;
  label: string;
  type: "number" | "select" | "checkbox";
  options?: string[];
  hint?: string;
  autoPullFrom?: string; // clinical or labs key
}[]>> = {
  critical_illness: [
    { key: "isMechVent", label: "Mechanically Ventilated", type: "checkbox" },
    { key: "tempMax", label: "Max Temp past 24h (°F)", type: "number", hint: "Required for PSU 2003b", autoPullFrom: "clinical.tempMax" },
    { key: "ve", label: "Minute Ventilation Ve (L/min)", type: "number", hint: "Required for PSU 2003b", autoPullFrom: "clinical.ve" },
  ],
  cystic_fibrosis: [
    { key: "fev1Pct", label: "FEV₁ % Predicted", type: "number", autoPullFrom: "clinical.fev1" },
    { key: "isPancreaticSufficient", label: "Pancreatic Sufficient", type: "checkbox" },
    { key: "cfa", label: "Coefficient of Fat Absorption (CFA)", type: "number", hint: "Default 0.85 if no stool collection" },
  ],
  burns: [
    { key: "tbsaPct", label: "TBSA Burned (%)", type: "number", autoPullFrom: "clinical.tbsa" },
    { key: "pbd", label: "Post-Burn Day (PBD)", type: "number", hint: "Required for Milner" },
  ],
  trauma: [
    { key: "exudateVolumeL", label: "Exudate Volume (L)", type: "number", hint: "Required for open abdomen adjustment" },
  ],
  sickle_cell: [
    { key: "hgb", label: "Hemoglobin (g/dL)", type: "number", autoPullFrom: "labs.Hgb" },
  ],
  heart_failure: [
    { key: "pal", label: "Physical Activity Level (PAL)", type: "number", hint: "1.2 = sedentary, 1.5 = lightly active" },
  ],
  ckd_5d: [
    { key: "urineOutputMlDay", label: "Urine Output (mL/day)", type: "number" },
  ],
  pressure_injuries: [
    { key: "targetKcal", label: "Prescribed kcal/day (for fluid calc)", type: "number" },
  ],
};

// ─── Main Evaluation Engine ───────────────────────────────────────────────────

export interface EvalOptions {
  condition: ConditionKey;
  variant?: string;
  patient: PatientInputs;
  currentRx: CurrentRx;
  extraInputs?: Record<string, number | string>;
}

export function evaluateNutritionRx(opts: EvalOptions): NutritionEvaluation {
  const { variant, patient, currentRx, extraInputs = {} } = opts;
  // Resolve legacy "cancer" alias
  const condition: ConditionKey = opts.condition === "cancer" ? "oncology" : opts.condition;

  const { wtKg, htCm, ageYears, sex, bmi, icMeasuredKcal, icCaf, weightLabel } = patient;

  const ibwKg = calcIBW(htCm, sex);
  const ree = calcMSJ(wtKg, htCm, ageYears, sex);

  const results: EvalResult[] = [];
  const flags: string[] = [];

  let kcalLow = 0, kcalHigh = 0;
  let protLow = 0, protHigh = 0;
  let fluidLow: number | null = null, fluidHigh: number | null = null;
  let fluidNote = "";
  let wtForKcal = wtKg;
  let wtLabel = weightLabel || "Actual Wt";
  let wtForProt = wtKg;
  let eeKcal = ree;
  let eeSource: NutritionEvaluation["eeSource"] = "MSJ×AF";
  let afUsed: number | undefined;
  let cafUsed: number | undefined;
  let protFixed: number | null = null;

  // ── IC Override Logic ──
  const useIC = !!icMeasuredKcal && icMeasuredKcal > 0;
  const activeIcCaf = icCaf || 1.0;
  const icFloor = useIC ? icMeasuredKcal * activeIcCaf : 0;
  const icCeiling = useIC ? icMeasuredKcal * (activeIcCaf + 0.1) : 0;

  switch (condition) {

    // ── HEALTHY ──────────────────────────────────────────────────────────────
    case "healthy": {
      afUsed = Number(extraInputs.pal) || 2.0;
      eeKcal = ree * afUsed;
      eeSource = "MSJ×AF";
      kcalLow = eeKcal * 0.925;
      kcalHigh = eeKcal * 1.075;
      if (afUsed >= 2.15) {
        protLow = wtKg * 1.8; protHigh = wtKg * 2.2;
      } else if (afUsed >= 1.9) {
        protLow = wtKg * 1.5; protHigh = wtKg * 1.8;
      } else if (afUsed >= 1.6) {
        protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
      } else {
        protLow = wtKg * 0.8; protHigh = wtKg * 1.2;
      }
      fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
      break;
    }

    // ── AKI ──────────────────────────────────────────────────────────────────
    case "aki": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 20; kcalHigh = wtKg * 30;
      flags.push("⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.");
      if (variant === "no_dialysis") { protLow = wtKg * 0.8; protHigh = wtKg * 1.0; fluidNote = "24h urine output + 500 mL (insensible losses)"; }
      else if (variant === "dialysis") { protLow = wtKg * 1.0; protHigh = wtKg * 1.5; }
      else if (variant === "crrt") {
        protLow = wtKg * 1.7; protHigh = wtKg * 2.5;
        fluidNote = "Fluid unrestricted during CRRT — prevent dehydration during diuresis";
      } else { protLow = wtKg * 0.8; protHigh = wtKg * 1.5; }
      break;
    }

    // ── ACUTE PANCREATITIS ────────────────────────────────────────────────────
    case "acute_pancreatitis": {
      afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      if (useIC) flags.push("IC preferred for pancreatitis — recalculate regularly.");
      if (variant === "severe_critical") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else { protLow = wtKg * 1.2; protHigh = wtKg * 1.5; }
      fluidNote = "DRI (individualize for GI losses)";
      break;
    }

    // ── BREASTFEEDING ─────────────────────────────────────────────────────────
    case "breastfeeding": {
      if (ageYears < 14) {
        flags.push("⚠ MANUAL ASSESSMENT REQUIRED: Patient is an extreme pediatric outlier (age < 14). Standard automated equations and postpartum dates are clinically unvalidated for this case. Calculate manually.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
        fluidLow = null; fluidHigh = null;
        break;
      }
      afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      const addOn = variant === "late" ? 380 : 400; // 0-6 mo ~400, 7-12 mo ~380
      kcalLow = eeKcal + addOn - 20; kcalHigh = eeKcal + addOn + 20;
      protFixed = 71; protLow = 71; protHigh = 71;
      fluidLow = 3800; fluidHigh = 3800;
      fluidNote = "AI target 3.8 L/day for breastfeeding";
      break;
    }

    // ── BURNS ─────────────────────────────────────────────────────────────────
    case "burns": {
      const tbsa = Number(extraInputs.tbsaPct) || 0;
      const bsa = calcBSA(htCm, wtKg);

      if (ageYears >= 18) {
        // Adult: Milner formula
        const pbd = Number(extraInputs.pbd) || 0;
        const bmrHr = calcFleischBMR(ageYears, sex);
        afUsed = 1.4; // Standard Milner maintenance
        
        // Energy = [BMR × (0.274 + 0.0079 × TBSA − 0.004 × PBD) + BMR] × 24 × BSA × AF
        const milnerKcal = (bmrHr * (0.274 + 0.0079 * tbsa - 0.004 * pbd) + bmrHr) * 24 * bsa * afUsed;
        
        eeKcal = milnerKcal; eeSource = "Milner";
        kcalLow = milnerKcal * 0.9; kcalHigh = milnerKcal * 1.1;
        
        flags.push(`Milner Formula: [${bmrHr.toFixed(1)} × (0.274 + 0.0079×${tbsa} − 0.004×${pbd}) + ${bmrHr.toFixed(1)}] × 24 × ${bsa.toFixed(2)}m² × AF ${afUsed} = ${Math.round(milnerKcal)} kcal.`);
        if (tbsa === 0) flags.push("Enter TBSA% and Post-Burn Day (PBD) for Milner formula.");

        // Adult Protein: use higher targets for large burns
        if (tbsa > 40) { protLow = wtKg * 2.0; protHigh = wtKg * 2.5; }
        else { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      } else if (ageYears >= 1 && ageYears < 17) {
        // Child/Adolescent: Galveston formulas
        const isAdol = ageYears >= 12;
        const baseKcal = isAdol ? 1500 : 1800;
        const burnKcal = isAdol ? 1500 : 1300;
        const galvestonKcal = baseKcal * bsa + burnKcal * (bsa * tbsa / 100);
        
        eeKcal = galvestonKcal; eeSource = "Galveston";
        kcalLow = galvestonKcal * 0.9; kcalHigh = galvestonKcal * 1.1;
        
        const formulaName = isAdol ? "Galveston Adolescent" : "Galveston Revised";
        flags.push(`${formulaName}: ${baseKcal}×${bsa.toFixed(2)} + ${burnKcal}×(${bsa.toFixed(2)}×${tbsa}/100) = ${Math.round(galvestonKcal)} kcal.`);
        if (tbsa === 0 && !useIC) flags.push(`Enter TBSA% for ${formulaName} formula.`);

        // Pediatric Protein: 20–25% of energy needs (IC or Galveston)
        const energyForProt = useIC ? icFloor : galvestonKcal;
        protLow = (energyForProt * 0.20) / 4;
        protHigh = (energyForProt * 0.25) / 4;
        
        if (useIC) {
          flags.push(`Pediatric Burn Protein: 20–25% of measured energy (${Math.round(energyForProt)} kcal via IC).`);
        } else {
          flags.push(`Pediatric Burn Protein: 20–25% of estimated energy (${Math.round(energyForProt)} kcal via Galveston).`);
        }
      } else {
        // Fallback or infant
        afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        flags.push("Burns: IC strongly preferred. Milner (adult) or Galveston (child) used for >20% TBSA.");
        protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
      }

      if (useIC) flags.push("IC strongly recommended for burns — recalculate frequently as needs change rapidly.");
      
      fluidNote = "Parkland formula / physiological endpoints — strict I/O monitoring required.";
      break;
    }

    // ── ONCOLOGY (also handles legacy "cancer" alias) ─────────────────────────
    case "oncology": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      if (useIC) {
        flags.push("IC preferred — use HBE only when IC not available.");
      } else {
        flags.push("IC preferred. HBE may underestimate REE by 12–13% in some cancer types.");
      }
      if (variant === "non_ambulatory") { kcalLow = wtKg * 25; kcalHigh = wtKg * 30; }
      else if (variant === "hypermetabolic") { kcalLow = wtKg * 30; kcalHigh = wtKg * 35; }
      else if (variant === "severely_stressed") { kcalLow = wtKg * 35; kcalHigh = wtKg * 35; flags.push("Avoid >35 kcal/kg prior to start of cancer treatment."); }
      else if (variant === "high_protein") { kcalLow = wtKg * 30; kcalHigh = wtKg * 35; }
      else { kcalLow = wtKg * 25; kcalHigh = wtKg * 35; }

      if (variant === "non_ambulatory") { protLow = wtKg * 1.0; protHigh = wtKg * 1.2; }
      else if (variant === "hypermetabolic") { protLow = wtKg * 1.2; protHigh = wtKg * 1.5; }
      else if (variant === "severely_stressed") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else if (variant === "high_protein") { protLow = wtKg * 1.5; protHigh = wtKg * 2.5; }
      else { protLow = wtKg * 1.0; protHigh = wtKg * 1.5; }
      fluidNote = "DRI; adjust for nephrotoxic agents and GI losses.";
      break;
    }

    // ── CKD 3–5 ──────────────────────────────────────────────────────────────
    case "ckd_3_5": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      if (variant === "vlcd") { protLow = wtKg * 0.28; protHigh = wtKg * 0.43; }
      else if (variant === "lcd_dm") { protLow = wtKg * 0.60; protHigh = wtKg * 0.80; }
      else { protLow = wtKg * 0.55; protHigh = wtKg * 0.60; }
      fluidNote = "Fluid individualized — monitor edema, urine output, and electrolytes.";
      break;
    }

    // ── CKD 5D ───────────────────────────────────────────────────────────────
    case "ckd_5d": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      protLow = wtKg * 1.0; protHigh = wtKg * 1.2;
      const urineOut = Number(extraInputs.urineOutputMlDay || 0);
      if (variant === "pd") {
        fluidLow = 1000; fluidHigh = 3000; fluidNote = "PD: 1000–3000 mL/day individualized.";
      } else {
        if (urineOut >= 1000) { fluidLow = 2000; fluidHigh = 2000; fluidNote = "Urine ≥1L → 2000 mL/day"; }
        else if (urineOut > 0) { fluidLow = 1000; fluidHigh = 1500; fluidNote = "Urine <1L → 1000–1500 mL/day"; }
        else { fluidNote = "Oliguria: restrict to 24h urine + 750 mL. Enter urine output above."; }
      }
      break;
    }

    // ── KIDNEY TRANSPLANT ─────────────────────────────────────────────────────
    case "kidney_transplant": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      if (variant === "acute") {
        kcalLow = Math.min(wtKg * 30, ree * 1.3); kcalHigh = Math.max(wtKg * 35, ree * 1.5);
        protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
      } else {
        kcalLow = wtKg * 25; kcalHigh = wtKg * 30;
        if (variant === "chronic_dm") { protLow = wtKg * 0.8; protHigh = wtKg * 0.9; }
        else { protLow = wtKg * 0.6; protHigh = wtKg * 0.8; }
      }
      fluidNote = "Fluid unrestricted post-transplant unless clinical indication.";
      break;
    }

    // ── COPD ─────────────────────────────────────────────────────────────────
    case "copd": {
      const htM = htCm / 100;
      const schofieldBMR = calcSchofieldBMR(wtKg, htM, ageYears, sex);
      afUsed = 1.3;
      eeKcal = schofieldBMR * afUsed;
      eeSource = "Schofield×AF";
      kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.5; // DRI + individualize upward
      fluidNote = "DRI; restrict if cor pulmonale or pulmonary edema present.";
      if (bmi >= 30) flags.push("⚠ COPD with obesity: adjust targets; consider impact on respiratory quotient.");
      flags.push(`Schofield BMR: ${Math.round(schofieldBMR)} kcal × AF ${afUsed} = ${Math.round(eeKcal)} kcal/day.`);
      break;
    }

    // ── CIRRHOSIS ─────────────────────────────────────────────────────────────
    case "cirrhosis_updated": {
      wtForKcal = wtKg;
      if (useIC) {
        eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
        kcalLow = icFloor; kcalHigh = icCeiling;
      } else {
        afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      }
      if (variant === "critical") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else { protLow = wtKg * 1.2; protHigh = wtKg * 1.5; }
      fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
      fluidNote = "Restrict if hypervolemic hyponatremia or ascites present.";
      flags.push("ℹ Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.");
      break;
    }

    // ── LIVER TRANSPLANT ──────────────────────────────────────────────────────
    case "liver_transplant": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      if (variant === "acute") {
        kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
        protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
      } else {
        if (useIC) {
          eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
          kcalLow = icFloor; kcalHigh = icCeiling;
        } else {
          kcalLow = ree; kcalHigh = ree * 1.3;
          flags.push("Chronic liver transplant: target REE×1.0–1.3.");
        }
        protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
      }
      fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
      break;
    }

    // ── CRITICAL ILLNESS (with PSU 2003b) ─────────────────────────────────────
    case "critical_illness": {
      const isMechVent = extraInputs.isMechVent === true || extraInputs.isMechVent === "true" || extraInputs.isMechVent === 1;
      const tmaxF = Number(extraInputs.tempMax) || 0;
      const ve = Number(extraInputs.ve) || 0;

      let bmiGroup = bmi < 30 ? "bmi_lt30" : bmi <= 50 ? "bmi_30_50" : "bmi_gt50";
      const activeVariant = variant || bmiGroup;

      if (useIC) {
        eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
        kcalLow = icFloor; kcalHigh = icCeiling;
        flags.push("IC preferred. Full feeds typically initiated after day 2–3.");
      } else if (isMechVent && tmaxF > 0 && ve > 0 && activeVariant === "bmi_lt30") {
        // PSU 2003b — only validated for non-obese vented patients
        const psuKcal = calcPSU2003b(ree, tmaxF, ve);
        eeKcal = Math.max(psuKcal, 0); eeSource = "PSU 2003b";
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        const tmaxC = ((tmaxF - 32) * 5 / 9).toFixed(1);
        flags.push(`PSU 2003b: MSJ(${Math.round(ree)}) × 0.96 + ${tmaxC}°C × 167 + ${ve}L/min × 31 − 6212 = ${Math.round(eeKcal)} kcal.`);
      } else {
        eeSource = "MSJ×AF"; afUsed = 1.2; eeKcal = ree * afUsed;
        if (!isMechVent) flags.push("Enter Tmax and Ve + check 'Mechanically Ventilated' to use PSU 2003b.");
        if (activeVariant === "bmi_lt30") {
          kcalLow = wtKg * 12; kcalHigh = wtKg * 25;
          flags.push("BMI <30: 12–25 kcal/kg early (hypocaloric). Advance to 25–30 after day 7–10.");
        } else if (activeVariant === "bmi_30_50") {
          kcalLow = wtKg * 11; kcalHigh = wtKg * 14;
          flags.push("Obese CI (BMI 30–50): permissive underfeeding 11–14 kcal/kg actual wt.");
        } else {
          wtForKcal = ibwKg; wtLabel = "IBW (Hamwi)";
          kcalLow = ibwKg * 22; kcalHigh = ibwKg * 25;
          flags.push("Severely obese CI (BMI >50): 22–25 kcal/kg IBW.");
        }
      }
      // Protein by BMI group
      if (bmi < 30) { protLow = wtKg * 1.2; protHigh = wtKg * 2.0; }
      else if (bmi < 40) { wtForProt = ibwKg; protLow = ibwKg * 2.0; protHigh = ibwKg * 2.0; flags.push("Protein: 2.0 g/kg IBW for BMI 30–39.9"); }
      else { wtForProt = ibwKg; protLow = ibwKg * 2.5; protHigh = ibwKg * 2.5; flags.push("Protein: 2.5 g/kg IBW for BMI ≥40"); }
      fluidNote = "Physiologically titrated to resuscitation/MAP goals.";
      break;
    }

    // ── PREGNANCY ─────────────────────────────────────────────────────────────
    case "pregnancy": {
      if (ageYears < 14) {
        flags.push("⚠ MANUAL ASSESSMENT REQUIRED: Patient is an extreme pediatric outlier (age < 14). Standard automated equations and gestational weight targets are clinically unvalidated for this case. Calculate manually.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
        fluidLow = null; fluidHigh = null;
        break;
      }
      afUsed = 1.4; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      let addOn = 0;
      if (variant === "t2") addOn = 340;
      else if (variant === "t3") addOn = 452;
      else flags.push("Trimester 1: no additional calories above non-pregnant EER.");
      kcalLow = eeKcal + addOn; kcalHigh = eeKcal + addOn + 50;
      protFixed = 71; protLow = 71; protHigh = 71;
      fluidLow = 3000; fluidHigh = 3000;
      fluidNote = "3 L/day total (beverages + food moisture)";
      break;
    }

    // ── PRESSURE INJURIES ─────────────────────────────────────────────────────
    case "pressure_injuries": {
      afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
      if (variant === "stage_3_4") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else { protLow = wtKg * 1.25; protHigh = wtKg * 1.5; }
      const prescribedKcal = Number(extraInputs.targetKcal || 0);
      fluidLow = wtKg * 30;
      fluidHigh = prescribedKcal > 0 ? prescribedKcal * 1.5 : wtKg * 35;
      fluidNote = "30 mL/kg/day OR 1.0–1.5 mL/kcal prescribed.";
      break;
    }

    // ── TRAUMA ───────────────────────────────────────────────────────────────
    case "trauma": {
      afUsed = 1.4; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 20; kcalHigh = wtKg * 35;
      protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
      flags.push("Severe/polytrauma: protein may exceed 2.0 g/kg — individualize.");
      break;
    }

    // ── MASLD / MASH ──────────────────────────────────────────────────────────
    case "masld_mash": {
      if (useIC) {
        eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
        kcalLow = icFloor; kcalHigh = icCeiling;
        flags.push("IC preferred for MASLD/MASH — normal REE when adjusted for fat-free mass.");
      } else {
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        if (variant === "malnourished") {
          kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
          flags.push("Underweight/malnourished/sarcopenic MASLD: 30–35 kcal/kg to improve nutritional status.");
        } else if (variant === "bmi_gt40") {
          kcalLow = wtKg * 20; kcalHigh = wtKg * 25;
          flags.push("BMI ≥40 with MASH cirrhosis: 20–25 kcal/kg (Lai, 2021).");
        } else {
          // bmi_lt30 and bmi_30_40 both use 25–35
          kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
        }
        if (bmi >= 18.5 && bmi < 35) {
          flags.push("3–10% total body weight loss may improve hepatic outcomes (EASL-EASD-EASO, 2024).");
        }
      }
      protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
      fluidNote = "Individualized; restrict if ascites or edema present.";
      break;
    }

    // ── SHORT BOWEL SYNDROME ──────────────────────────────────────────────────
    case "short_bowel": {
      afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      // Base EER + ≥20% buffer for malabsorption
      const eerBase = eeKcal;
      kcalLow = eerBase * 1.2; kcalHigh = eerBase * 1.5;
      // Protein: 20% of total energy (using midpoint)
      const midKcal = (kcalLow + kcalHigh) / 2;
      const protFromEnergy = (midKcal * 0.20) / 4; // 20% kcal as protein, 4 kcal/g
      protLow = Math.max(protFromEnergy, wtKg * 1.5);
      protHigh = Math.max(protFromEnergy * 1.1, wtKg * 2.0);
      fluidNote = "Titrate to ostomy/stool loss; goal urine output >1200 mL/day.";
      flags.push("SBS: 20% of total energy from high biological value protein.");
      flags.push("Compensate for ~50% malabsorption with at least +20% energy buffer.");
      break;
    }

    // ── CYSTIC FIBROSIS ───────────────────────────────────────────────────────
    case "cystic_fibrosis": {
      const cfBMR = calcCFBMR(wtKg, ageYears, sex);
      const fev1 = Number(extraInputs.fev1Pct) || 100;
      const isPancSuf = extraInputs.isPancreaticSufficient === true || extraInputs.isPancreaticSufficient === "true" || extraInputs.isPancreaticSufficient === 1;
      const cfa = Number(extraInputs.cfa) || 0.85;

      // Activity coefficient (AC)
      let ac = 1.5; // sedentary default
      if (variant === "bed") ac = 1.3;
      else if (variant === "active") ac = 1.7;

      // Disease coefficient (DC) from FEV₁
      let dc = 0;
      if (fev1 >= 40 && fev1 < 80) dc = 0.2; // moderate
      else if (fev1 < 40) dc = 0.4;           // severe (midpoint of 0.3–0.5)

      const eer = cfBMR * (ac + dc);
      eeKcal = eer; eeSource = "CF Formula";

      if (isPancSuf) {
        kcalLow = eer * 0.95; kcalHigh = eer * 1.05;
      } else {
        // Pancreatic insufficient: EER × (0.93 / CFA)
        const cfaCorrected = eer * (0.93 / cfa);
        kcalLow = cfaCorrected * 0.95; kcalHigh = cfaCorrected * 1.1;
        flags.push(`Pancreatic insufficient CFA correction: EER(${Math.round(eer)}) × (0.93 / ${cfa}) = ${Math.round(cfaCorrected)} kcal.`);
      }

      // Protein: 1.2–2.0 × DRI for age
      protLow = wtKg * 0.8 * 1.2; protHigh = wtKg * 0.8 * 2.0;
      fluidNote = "DRI";
      flags.push(`CF BMR: ${Math.round(cfBMR)} kcal × (AC ${ac} + DC ${dc}) = ${Math.round(eer)} kcal EER. FEV₁: ${fev1}%.`);
      break;
    }

    // ── STROKE ────────────────────────────────────────────────────────────────
    case "stroke": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      if (variant === "hemorrhagic") { protLow = wtKg * 1.5; protHigh = wtKg * 2.5; }
      else { protLow = wtKg * 1.0; protHigh = wtKg * 1.5; }
      fluidLow = wtKg * 30; fluidHigh = wtKg * 40;
      fluidNote = "30–40 mL/kg; monitor for cerebral edema.";
      break;
    }

    // ── HEART FAILURE ─────────────────────────────────────────────────────────
    case "heart_failure": {
      const palHF = Number(extraInputs.pal) || 1.3;
      afUsed = palHF; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
      fluidNote = "Strictly individualized — often fluid restricted. Consult cardiology.";
      flags.push("Heart failure: fluid restriction individualized to clinical status and ejection fraction.");
      break;
    }

    // ── OBESITY STABLE ────────────────────────────────────────────────────────
    case "obesity_stable": {
      eeSource = "MSJ×AF"; afUsed = 1.2; eeKcal = ree * afUsed;
      kcalLow = wtKg * 20; kcalHigh = wtKg * 20;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
      fluidNote = "DRI (~30 mL/kg)";
      flags.push("20 kcal/kg (≈ 10–12 kcal/lb). Consider adjusted body weight if BMI ≥40.");
      break;
    }

    // ── SEVERE MALNUTRITION ───────────────────────────────────────────────────
    case "severe_malnutrition": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
      protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
      fluidNote = "DRI; monitor electrolytes closely during refeeding.";
      flags.push("⚠ REFEEDING RISK: advance calories slowly. Monitor Mg, Phos, K, thiamine.");
      flags.push("Start at 50–75% of goal and advance over 3–5 days based on electrolyte tolerance.");
      break;
    }

    // ── SICKLE CELL DISEASE ───────────────────────────────────────────────────
    case "sickle_cell": {
      const hgb = Number(extraInputs.hgb) || 8.0;
      const ageDays = ageYears * 365.25;
      const isPeds = ageDays < 18 * 365.25;

      if (isPeds) {
        const scdRee = calcSCDREEPeds(wtKg, hgb, sex);
        afUsed = Number(extraInputs.pal) || 1.5;
        eeKcal = scdRee * afUsed; eeSource = "SCD REE";
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        flags.push(`SCD REE (peds): ${Math.round(scdRee)} kcal (Hgb: ${hgb} g/dL, wt: ${wtKg} kg) × AF ${afUsed}.`);
        if (variant === "peds_crisis") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
        else { protLow = wtKg * 1.2; protHigh = wtKg * 1.5; }
      } else {
        afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        if (variant === "adult_underweight") { kcalLow = wtKg * 35; kcalHigh = wtKg * 40; }
        else { kcalLow = wtKg * 30; kcalHigh = wtKg * 35; }
        protLow = wtKg * 1.0; protHigh = wtKg * 1.3;
      }
      fluidNote = "High fluid intake to prevent vaso-occlusive crisis.";
      break;
    }

    // ── HSCT ─────────────────────────────────────────────────────────────────
    case "hsct": {
      const ageDays = ageYears * 365.25;
      eeSource = "HSCT";

      if (variant === "infant_child" || ageDays < 6 * 365.25) {
        // Infants/young children: BMR × 1.6–1.8
        afUsed = 1.7;
        eeKcal = ree * afUsed;
        kcalLow = ree * 1.6; kcalHigh = ree * 1.8;
        protLow = wtKg * 2.5; protHigh = wtKg * 3.0; // ages 1–6: 2.5–3 g/kg
        flags.push("Infants/young children (HSCT): BMR × 1.6–1.8.");
      } else if (variant === "child_16" || (ageDays < 16 * 365.25 && wtKg <= 75)) {
        // Children ≤16 yr / ≤75 kg: BMR × 1.6
        afUsed = 1.6; eeKcal = ree * afUsed;
        kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
        // Age-appropriate protein
        if (ageYears >= 7 && ageYears <= 10) { protLow = wtKg * 2.4; protHigh = wtKg * 2.4; }
        else if (ageYears >= 11 && ageYears <= 14) { protLow = wtKg * 2.0; protHigh = wtKg * 2.0; }
        else { protLow = wtKg * 1.8; protHigh = wtKg * 1.8; }
        flags.push("Children ≤16 yr / ≤75 kg (HSCT): BMR × 1.6.");
      } else if (variant === "older_adol") {
        // Older adolescent >16 yr or >75 kg: BEE × 1.5–1.6
        kcalLow = ree * 1.5; kcalHigh = ree * 1.6; eeKcal = ree * 1.55;
        protLow = wtKg * 1.8; protHigh = wtKg * 1.8;
        flags.push("Older adolescents >16yr or >75kg (HSCT): BEE × 1.5–1.6.");
      } else if (variant === "post_engraft") {
        // Post-engraftment: BEE × 1.3 adults, BMR × 1.4–1.6 peds
        if (ageYears >= 18) {
          kcalLow = ree * 1.3; kcalHigh = ree * 1.3; eeKcal = ree * 1.3;
          protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        } else {
          kcalLow = ree * 1.4; kcalHigh = ree * 1.6; eeKcal = ree * 1.5;
          protLow = wtKg * 1.5; protHigh = wtKg * 1.8;
        }
        flags.push("Post-engraftment: energy needs decrease — reassess regularly.");
      } else {
        // Adult default: BEE × 1.5 or 30–35 kcal/kg
        kcalLow = Math.min(ree * 1.5, wtKg * 30);
        kcalHigh = Math.max(ree * 1.5, wtKg * 35);
        eeKcal = ree * 1.5;
        protLow = wtKg * 1.5; protHigh = wtKg * 1.5;
        flags.push("Adults (HSCT): BEE × 1.5 or 30–35 kcal/kg during first month post-transplant.");
      }

      // Holliday-Segar fluid
      const holidayFluid = calcHolidaySegar(wtKg);
      fluidLow = holidayFluid * 0.9; fluidHigh = holidayFluid * 1.1;
      fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Increase with fever, GI losses, conditioning.`;
      flags.push("HSCT fluid: increase with fever, excessive GI losses, hypermetabolism, nephrotoxic meds.");
      break;
    }

    default: {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.2;
      break;
    }
  }

  // ── IC GLOBAL OVERRIDE ───────────────────────────────────────────────────
  // This ensures IC always takes precedence regardless of condition logic
  if (useIC) {
    eeKcal = icFloor;
    eeSource = "IC";
    cafUsed = activeIcCaf;
    kcalLow = icFloor;
    kcalHigh = icCeiling;
  }

  // ── Build result rows ─────────────────────────────────────────────────────

  if (kcalLow > 0 && kcalHigh > 0) {
    results.push({
      label: "Energy",
      target: fmtRange(kcalLow, kcalHigh, "kcal/day"),
      current: currentRx.kcalPerDay,
      unit: "kcal/day",
      status: evalStatus(currentRx.kcalPerDay, kcalLow, kcalHigh),
      note: eeSource === "IC"
        ? `Based on Indirect Calorimetry (${icMeasuredKcal} kcal) × CAF ${activeIcCaf}`
        : `Based on ${wtLabel} (${Math.round(wtForKcal)} kg) via ${eeSource}`,
    });
  }

  if (protLow > 0 || protFixed !== null) {
    const pLow = protFixed ?? protLow;
    const pHigh = protFixed ?? protHigh;
    results.push({
      label: "Protein",
      target: fmtRange(pLow, pHigh, "g/day"),
      current: currentRx.proteinGPerDay,
      unit: "g/day",
      status: evalStatus(currentRx.proteinGPerDay, pLow, pHigh),
      note: protFixed
        ? `Fixed RDA target (${protFixed} g/day)`
        : `Based on ${wtForProt === ibwKg ? "IBW (Hamwi)" : wtLabel} (${Math.round(wtForProt)} kg)`,
    });
  }

  if (fluidLow !== null && fluidHigh !== null && currentRx.fluidMlPerDay !== undefined) {
    results.push({
      label: "Fluid",
      target: fmtRange(fluidLow, fluidHigh, "mL/day"),
      current: currentRx.fluidMlPerDay,
      unit: "mL/day",
      status: evalStatus(currentRx.fluidMlPerDay, fluidLow, fluidHigh),
      note: fluidNote,
    });
  } else if (fluidNote) {
    flags.push(`Fluid: ${fluidNote}`);
  }

  return {
    ibwKg,
    reeKcal: Math.round(ree),
    eeKcal: Math.round(eeKcal),
    eeSource,
    afUsed,
    cafUsed,
    weightUsed: Math.round(wtForKcal * 10) / 10,
    weightLabel: wtLabel,
    results,
    flags,
  };
}

// ─── Reference Tables ─────────────────────────────────────────────────────────

export const IC_ACTIVITY_FACTORS: { condition: string; cafLow: number; cafHigh: number; note: string }[] = [
  { condition: "Uncomplicated post-op / sedated ventilated", cafLow: 1.0, cafHigh: 1.1, note: "Minimal stress" },
  { condition: "Mild infection / medical floor", cafLow: 1.1, cafHigh: 1.2, note: "Low-moderate physiologic stress" },
  { condition: "Major surgery / moderate sepsis", cafLow: 1.2, cafHigh: 1.3, note: "Moderate hypermetabolism" },
  { condition: "Polytrauma / severe sepsis / burns", cafLow: 1.3, cafHigh: 1.5, note: "High hypermetabolism" },
  { condition: "Severe burns / major head injury", cafLow: 1.5, cafHigh: 1.8, note: "Very high catabolism" },
];

export const MSJ_ACTIVITY_FACTORS: { label: string; af: number; description: string }[] = [
  { label: "Sedentary", af: 1.2, description: "Little or no activity; bed rest" },
  { label: "Lightly active", af: 1.375, description: "Light exercise 1–3 days/week" },
  { label: "Moderately active", af: 1.55, description: "Moderate exercise 3–5 days/week" },
  { label: "Very active", af: 1.725, description: "Hard exercise 6–7 days/week" },
  { label: "Extra active", af: 1.9, description: "Very hard exercise / physical job" },
];" },
];