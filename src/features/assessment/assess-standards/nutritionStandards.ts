// src/features/assessment/assess-standards/nutritionStandards.ts

import type { 
  EvalStatus, 
  PatientInputs, 
  CurrentRx, 
  EvalResult, 
  NutritionEvaluation, 
  ConditionKey,
  EvalOptions
} from "../../../types/standards";

import {
  calculateSchofieldWH,
  calculatePediatricAKIEnergy,
  calculatePediatricInsensibleLoss,
  calculatePediatricPancreatitisEnergy,
  calculatePediatricKidneyTransplantEnergy,
  calculatePediatricCOPDEnergy,
  calculatePediatricCirrhosisEnergy,
  calculatePediatricLiverTransplantEnergy,
  calculatePediatricCriticalIllnessEnergy,
  calculatePediatricTraumaEnergy,
  calculatePediatricMASLDEnergy,
  calculatePediatricCFEnergy,
  calculatePediatricStrokeEnergy,
  calculatePediatricHSCTEnergy,
  calculatePediatricSCDEnergy,
  calculatePediatricBurnsEnergy,
  calculatePediatricOncologyEnergy,
  calculatePediatricHeartFailureEnergy,
  calculatePediatricPressureInjuryEnergy,
  calculatePediatricCFBMR,
  calculateAdolescentSchofieldBMR,
  getPediatricSDI,
  calculatePediatricDiseaseProtein,
} from "../../../shared/utils/pediatricDiseaseMath";

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
    if (ageYears < 5) return 53 - (ageYears - 1) * 0.925;
    if (ageYears < 10) return 49.3 - (ageYears - 5) * 0.98;
    if (ageYears < 15) return 44.4 - (ageYears - 10) * 0.52;
    return 41.8 - (ageYears - 15) * 0.64;
  } else {
    if (ageYears < 5) return 53 - (ageYears - 1) * 1.15;
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

// ─── Schofield BMR (adult, kept for legacy/reference) ────────────────────────

export function calcSchofieldBMR(wtKg: number, htM: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "F") {
    if (ageYears < 60) return 8.7 * wtKg - 25 * htM + 865;
    return 9.2 * wtKg + 637 * htM - 302;
  } else {
    if (ageYears < 60) return 11.3 * wtKg + 16 * htM + 901;
    return 8.8 * wtKg + 1128 * htM - 1071;
  }
}

// ─── CF BMR table (Schofield-based, adult age/sex brackets) ──────────────────

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

// ─── Pediatric gate helper ────────────────────────────────────────────────────

function isPedsAge(ageYears: number): boolean {
  return ageYears > 0 && ageYears < 18;
}

// ─── Condition Labels ─────────────────────────────────────────────────────────

export const CONDITION_LABELS: Record<ConditionKey, string> = {
  aki: "AKI (Acute Kidney Injury)",
  acute_pancreatitis: "Acute Pancreatitis",
  breastfeeding: "Breastfeeding",
  burns: "Burns",
  oncology: "Oncology (Cancer)",
  cancer: "Oncology (Cancer)",
  ckd_3_5: "CKD Stages 3–5 (Pre-dialysis)",
  ckd_5d: "CKD Stage 5D (HD / PD)",
  kidney_transplant: "Kidney Transplant",
  copd: "COPD",
  cirrhosis: "Cirrhosis",
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
  diabetes: "Diabetes Mellitus",
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
    { key: "adult_milner", label: "Adult — Milner", minAge: 18 },
    { key: "adult_toronto", label: "Adult — Toronto (preferred)", minAge: 18 },
    { key: "child_1_11", label: "Child 1–11y (Galveston)", minAge: 1, maxAge: 11.9 },
    { key: "adolescent_12_16", label: "Adolescent 12–16y (Galveston)", minAge: 12, maxAge: 16.9 },
  ],
  oncology: [
    { key: "non_ambulatory", label: "Non-ambulatory / Sedentary" },
    { key: "hypermetabolic", label: "Hypermetabolic / Treatment" },
    { key: "severely_stressed", label: "Severely Stressed / HCT first month" },
    { key: "high_protein", label: "High Protein Needs (wasting/enteropathy)" },
  ],
  cancer: [
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
  cirrhosis: [
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
    { key: "standard", label: "Standard (BMI 18.5–39.9)" },
    { key: "malnourished", label: "Underweight / Malnourished / Sarcopenic" },
  ],
  cystic_fibrosis: [
    { key: "bed", label: "Bed-bound (PAL 1.3)" },
    { key: "sedentary", label: "Sedentary (PAL 1.5)" },
    { key: "active", label: "Active (PAL 1.7)" },
  ],
  stroke: [
    { key: "standard", label: "Ischemic / Standard" },
    { key: "hemorrhagic", label: "Hemorrhagic / High Protein" },
  ],
  sickle_cell: [
    { key: "peds_stable", label: "Pediatric — Stable", maxAge: 17.9 },
    { key: "peds_crisis", label: "Pediatric — VOC / Crisis", maxAge: 17.9 },
    { key: "adult_stable", label: "Adult — Stable", minAge: 18 },
    { key: "adult_crisis", label: "Adult — VOC / Crisis", minAge: 18 },
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
  autoPullFrom?: string;
}[]>> = {
  critical_illness: [
    { key: "isMechVent", label: "Mechanically Ventilated", type: "checkbox" },
    { key: "tempMax", label: "Max Temp past 24h (°F)", type: "number", hint: "Required for PSU 2003b / PSU 2010", autoPullFrom: "clinical.tempMax" },
    { key: "ve", label: "Minute Ventilation Ve (L/min)", type: "number", hint: "Required for PSU 2003b / PSU 2010", autoPullFrom: "clinical.ve" },
  ],
  cystic_fibrosis: [
    { key: "fev1Pct", label: "FEV₁ % Predicted", type: "number", autoPullFrom: "clinical.fev1" },
    { key: "isPancreaticSufficient", label: "Pancreatic Sufficient", type: "checkbox" },
    { key: "cfa", label: "Coefficient of Fat Absorption (CFA)", type: "number", hint: "Default 0.85 if no stool collection" },
  ],
  burns: [
    { key: "tbsaPct", label: "TBSA Burned (%)", type: "number", autoPullFrom: "clinical.tbsa" },
    { key: "pbd", label: "Post-Burn Day (PBD)", type: "number", hint: "Required for Milner and Toronto" },
    { key: "caloricIntake", label: "Current Caloric Intake (kcal/day)", type: "number", hint: "Required for Toronto equation" },
    { key: "coreTemp", label: "Core Temperature (°C)", type: "number", hint: "Required for Toronto equation" },
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
  aki: [
    { key: "urineOutputMlDay", label: "Urine Output (mL/day)", type: "number", hint: "Required for pediatric fluid calculation" },
  ],
  oncology: [
    { key: "isUndernourished", label: "Undernourished / Catch-up Growth Needed", type: "checkbox" },
  ],
  diabetes: [
    { key: "pal", label: "Physical Activity Level (PAL)", type: "number", hint: "1.2 = sedentary, 1.5 = lightly active" },
  ],
};

// ─── Main Evaluation Engine ───────────────────────────────────────────────────

export function evaluateNutritionRx(opts: EvalOptions): NutritionEvaluation {
  const { variant, patient, currentRx, extraInputs = {} } = opts;
  const condition: ConditionKey = opts.condition === "cancer" ? "oncology" : opts.condition;

  const { wtKg, htCm, ageYears, sex, bmi, icMeasuredKcal, icCaf, weightLabel } = patient;
  const ageDays: number = (patient as any).ageDays ?? ageYears * 365.25;
  const isPeds = isPedsAge(ageYears);

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
      if (isPeds) {
        flags.push("ℹ Pediatric healthy targets calculated via DRI/EER Pipeline. Review Anthropometric section for age-specific EER.");
      }
      break;
    }

    // ── AKI ──────────────────────────────────────────────────────────────────
    case "aki": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = calculatePediatricAKIEnergy(schofieldOpts);
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal * 0.95;
        kcalHigh = eeKcal * 1.05;
        const sdi = getPediatricSDI(ageDays, wtKg);
        if (variant === "no_dialysis") {
          protLow = 0.8 * wtKg; protHigh = 1.2 * wtKg;
        } else if (variant === "dialysis" || variant === "crrt") {
          protLow = sdi; protHigh = 2.5 * wtKg;
          flags.push("⚠ Pediatric AKI on dialysis/CRRT: protein up to 2.5 g/kg to compensate for clearance losses.");
        } else {
          protLow = sdi * 0.9; protHigh = sdi;
        }
        const bsa = calcBSA(htCm, wtKg);
        const insensible = calculatePediatricInsensibleLoss(bsa);
        const urineOut = Number(extraInputs.urineOutputMlDay || 0);
        fluidLow = urineOut + insensible;
        fluidHigh = urineOut + insensible;
        fluidNote = `Urine output (${Math.round(urineOut)} mL) + insensible loss 400 mL/m² BSA (${Math.round(insensible)} mL). Enter urine output for accurate target.`;
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.3 stress factor = ${Math.round(eeKcal)} kcal. BSA: ${bsa.toFixed(2)} m².`);
      } else {
        // Adult AKI — MSJ × 1.0–1.1 conservative; 20–25 kcal/kg bracket
        afUsed = 1.05; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 20; kcalHigh = wtKg * 30;
        flags.push("⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.");
        if (variant === "no_dialysis") {
          protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
          fluidNote = "24h urine output + 500 mL insensible losses. Add +10% per 1°C fever above 37°C.";
        } else if (variant === "dialysis") {
          protLow = wtKg * 1.0; protHigh = wtKg * 1.5;
          fluidNote = "24h urine output + 500 mL insensible losses. Add +10% per 1°C fever above 37°C.";
        } else if (variant === "crrt") {
          protLow = wtKg * 1.7; protHigh = wtKg * 2.5;
          fluidNote = "Fluid unrestricted during CRRT — prevent dehydration during diuresis";
          flags.push("CRRT: increase protein to 1.7–2.5 g/kg/day to compensate for amino acid dialysate losses.");
        } else {
          protLow = wtKg * 0.8; protHigh = wtKg * 1.5;
          fluidNote = "24h urine output + 500 mL insensible losses.";
        }
      }
      break;
    }

    // ── ACUTE PANCREATITIS ────────────────────────────────────────────────────
    case "acute_pancreatitis": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pRange = calculatePediatricPancreatitisEnergy(schofieldOpts);
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        if (variant === "severe_critical") {
          protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
        } else {
          protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        }
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid;
        fluidHigh = holidayFluid * 1.2;
        fluidNote = `Holliday-Segar (~${Math.round(holidayFluid)} mL) + deficit replacement. Adjust for GI losses.`;
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.1–1.2 = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Initiate standard enteral nutrition within 72 hours of admission if hemodynamically stable.");
      } else {
        // Adult: MSJ × 1.1–1.2 stress factor (not 1.3 blanket AF)
        eeSource = "MSJ×AF";
        if (variant === "severe_critical") {
          afUsed = 1.2; eeKcal = ree * afUsed;
          kcalLow = ree * 1.2; kcalHigh = ree * 1.2;
          protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
        } else {
          afUsed = 1.15; eeKcal = ree * afUsed;
          kcalLow = ree * 1.1; kcalHigh = ree * 1.2;
          protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
          flags.push("Mild–moderate pancreatitis: MSJ × 1.1–1.2. Reserve higher factors for severe/necrotizing cases.");
        }
        if (useIC) flags.push("IC preferred for pancreatitis — recalculate regularly.");
        flags.push("Initiate EN within 72 hours of admission.");
        fluidNote = "DRI (individualize for GI losses)";
      }
      break;
    }

    // ── BREASTFEEDING ─────────────────────────────────────────────────────────
    case "breastfeeding": {
      if (ageYears < 14) {
        flags.push("⚠ MANUAL ASSESSMENT REQUIRED: Patient is an extreme pediatric outlier (age < 14). Standard automated equations are clinically unvalidated for this case.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
        break;
      }
      if (ageYears >= 14 && ageYears < 18) {
        const adolBMR = calculateAdolescentSchofieldBMR(wtKg, sex);
        const addOn = variant === "late" ? 330 : 400;
        eeKcal = adolBMR + addOn;
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal - 20; kcalHigh = eeKcal + 20;
        const pedsProtein = getPediatricSDI(ageDays, wtKg);
        protFixed = pedsProtein + 25;
        protLow = protFixed; protHigh = protFixed;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid + 800; fluidHigh = holidayFluid + 800;
        fluidNote = `Holliday-Segar (${Math.round(holidayFluid)} mL) + 800 mL for lactation = ${Math.round(fluidLow)} mL/day.`;
        flags.push(`ℹ Adolescent breastfeeding: Schofield BMR (${Math.round(adolBMR)} kcal) + ${addOn} kcal lactation addition.`);
        flags.push("Protein: Pediatric DRI for age + 25 g/day for milk production.");
      } else {
        // Adult breastfeeding: MSJ × 1.5 + lactation additive
        afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        const addOn = variant === "late" ? 330 : 400;
        kcalLow = ree + addOn - 20; kcalHigh = ree + addOn + 20;
        flags.push(`Lactation energy addition: +${addOn} kcal/day above non-pregnant EER (${variant === "late" ? "7–12 months" : "0–6 months"}).`);
        protFixed = 71; protLow = 71; protHigh = 71;
        fluidLow = 3800; fluidHigh = 3800;
        fluidNote = "AI target 3.8 L/day for breastfeeding";
      }
      break;
    }

    // ── BURNS ─────────────────────────────────────────────────────────────────
    case "burns": {
      const tbsa = Number(extraInputs.tbsaPct) || 0;
      const bsa = calcBSA(htCm, wtKg);

      if (ageYears >= 18) {
        const pbd = Number(extraInputs.pbd) || 0;
        const useToronto = variant === "adult_toronto";

        if (useToronto) {
          // Toronto equation: preferred to prevent overfeeding
          const caloricIntake = Number(extraInputs.caloricIntake) || currentRx.kcalPerDay || 0;
          const coreTempC = Number(extraInputs.coreTemp) || 37.0;
          const hbe = calcHarrisBenedict(wtKg, htCm, ageYears, sex);
          const torontoKcal = calcToronto(tbsa, caloricIntake, hbe, coreTempC, pbd);
          eeKcal = Math.max(torontoKcal, wtKg * 20); // floor at 20 kcal/kg
          eeSource = "Milner"; // reuse slot; displayed as Toronto in flags
          kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
          flags.push(`Toronto Formula: −4343 + 10.5×${tbsa} + 0.23×${Math.round(caloricIntake)} + 0.84×HBE(${Math.round(hbe)}) + 114×${coreTempC}°C − 4.5×${pbd} = ${Math.round(eeKcal)} kcal.`);
          flags.push("Toronto equation preferred: limits glucose to ≤5 mg/kg/min, preventing hepatic steatosis and hypercapnia.");
          if (!tbsa) flags.push("Enter TBSA%, core temperature, and current caloric intake for Toronto equation.");
        } else {
          // Milner formula
          const bmrHr = calcFleischBMR(ageYears, sex);
          afUsed = 1.4;
          const milnerKcal = (bmrHr * (0.274 + 0.0079 * tbsa - 0.004 * pbd) + bmrHr) * 24 * bsa * afUsed;
          eeKcal = milnerKcal; eeSource = "Milner";
          kcalLow = milnerKcal * 0.9; kcalHigh = milnerKcal * 1.1;
          flags.push(`Milner Formula: [${bmrHr.toFixed(1)} × (0.274 + 0.0079×${tbsa} − 0.004×${pbd}) + ${bmrHr.toFixed(1)}] × 24 × ${bsa.toFixed(2)}m² × AF ${afUsed} = ${Math.round(milnerKcal)} kcal.`);
          flags.push("ℹ Toronto equation is available and often preferred to prevent overfeeding — select 'Adult — Toronto' variant.");
          if (tbsa === 0) flags.push("Enter TBSA% and Post-Burn Day (PBD) for Milner formula.");
        }

        if (tbsa > 40) { protLow = wtKg * 2.0; protHigh = wtKg * 2.0; }
        else { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
        flags.push(`Protein target scaled to TBSA: ${tbsa > 40 ? "2.0" : "1.5–2.0"} g/kg/day. Limit glucose to ≤5 mg/kg/min.`);
      } else if (ageYears >= 1) {
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
        const energyForProt = useIC ? icFloor : galvestonKcal;
        protLow = (energyForProt * 0.20) / 4;
        protHigh = (energyForProt * 0.25) / 4;
        flags.push(`Pediatric Burn Protein: 20–25% of energy (${Math.round(energyForProt)} kcal).`);
      } else {
        flags.push("⚠ FOLLOW-UP REQUIRED: Galveston Infant equation for <1y burns (2100 kcal/m² BSA + 1000 kcal/m² TBSA) and Cincinnati fluid protocol require BSA-for-infants validation. Use IC and consult pediatric burn specialist.");
        afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
      }

      if (useIC) flags.push("IC strongly recommended for burns — recalculate frequently.");
      fluidNote = "Parkland formula / physiological endpoints — strict I/O monitoring required.";
      break;
    }

    // ── ONCOLOGY ─────────────────────────────────────────────────────────────
    case "oncology": {
      if (isPeds) {
        const isUndernourished = extraInputs.isUndernourished === "true" || extraInputs.isUndernourished === 1;
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const pRange = calculatePediatricOncologyEnergy({ ...schofieldOpts, isUndernourished });
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "oncology", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        if (isUndernourished) {
          flags.push("Undernourished pediatric oncology: 130–150% of predicted REE to support somatic catch-up growth.");
        }
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × oncology factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("IC preferred. Reassess energy needs with each treatment phase change.");
      } else {
        // Adult oncology: 25–30 kcal/kg; avoid >35 kcal/kg pre-treatment
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        if (useIC) {
          flags.push("IC preferred — use HBE only when IC not available.");
        } else {
          flags.push("IC preferred. HBE may underestimate REE by 12–13% in some cancer types.");
        }
        if (variant === "non_ambulatory") {
          kcalLow = wtKg * 25; kcalHigh = wtKg * 30;
          protLow = wtKg * 1.0; protHigh = wtKg * 1.2;
        } else if (variant === "hypermetabolic") {
          kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
          protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        } else if (variant === "severely_stressed") {
          kcalLow = wtKg * 35; kcalHigh = wtKg * 35;
          protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
          flags.push("Avoid >35 kcal/kg prior to start of cancer treatment.");
        } else if (variant === "high_protein") {
          kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
          protLow = wtKg * 1.5; protHigh = wtKg * 2.5;
        } else {
          kcalLow = wtKg * 25; kcalHigh = wtKg * 30;
          protLow = wtKg * 1.0; protHigh = wtKg * 1.5;
        }
      }
      fluidNote = "DRI; adjust for nephrotoxic agents and GI losses.";
      break;
    }

    // ── CKD 3–5 ──────────────────────────────────────────────────────────────
    case "ckd_3_5": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = pedsBMR;
        eeSource = "Schofield WH×SF";
        kcalLow = pedsBMR * 0.95;
        kcalHigh = pedsBMR * 1.05;
        const sdi = getPediatricSDI(ageDays, wtKg);
        protLow = sdi * 0.9;
        protHigh = sdi;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid * 0.8;
        fluidHigh = holidayFluid;
        fluidNote = "Fluid individualized — monitor edema, urine output, and electrolytes.";
        flags.push(`ℹ Pediatric CKD 3–5: energy at 100% EER (${Math.round(eeKcal)} kcal). Protein maintained at SDI upper end (${sdi.toFixed(1)} g/day) — do NOT restrict below pediatric safe minimum.`);
        flags.push("⚠ Restricting protein below SDI in growing children halts linear growth and induces muscle wasting.");
      } else {
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
        if (variant === "vlcd") {
          protLow = wtKg * 0.28; protHigh = wtKg * 0.43;
          flags.push("VLCD + keto-analog supplementation: 0.28–0.43 g/kg/day protein.");
        } else if (variant === "lcd_dm") {
          protLow = wtKg * 0.60; protHigh = wtKg * 0.80;
          flags.push("Low-protein diet + diabetes: 0.60–0.80 g/kg/day.");
        } else {
          protLow = wtKg * 0.55; protHigh = wtKg * 0.60;
          flags.push("Pre-dialysis protein restriction: 0.55–0.60 g/kg/day to balance uremic control with protein-energy wasting risk.");
        }
        fluidNote = "Fluid individualized — monitor edema, urine output, and electrolytes.";
      }
      break;
    }

    // ── CKD 5D ───────────────────────────────────────────────────────────────
    case "ckd_5d": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = pedsBMR;
        eeSource = "Schofield WH×SF";
        kcalLow = pedsBMR * 0.95;
        kcalHigh = pedsBMR * 1.05;
        const sdi = getPediatricSDI(ageDays, wtKg);
        protLow = sdi;
        protHigh = sdi + (0.3 * wtKg);
        const urineOut = Number(extraInputs.urineOutputMlDay || 0);
        if (variant === "pd") {
          fluidLow = 1000; fluidHigh = 3000; fluidNote = "PD: 1000–3000 mL/day individualized.";
        } else {
          if (urineOut >= 1000) {
            fluidLow = 2000; fluidHigh = 2000; fluidNote = "Urine ≥1L → 2000 mL/day";
          } else if (urineOut > 0) {
            fluidLow = 1000; fluidHigh = 1500; fluidNote = "Urine <1L → 1000–1500 mL/day";
          } else {
            fluidNote = "Oliguria: restrict to 24h urine + 750 mL. Enter urine output above.";
          }
        }
        flags.push(`ℹ Pediatric CKD 5D: SDI (${sdi.toFixed(1)} g) + dialysate loss allowance (0.1–0.3 g/kg) = ${sdi.toFixed(1)}–${(sdi + 0.3 * wtKg).toFixed(1)} g/day.`);
        flags.push("Adult protein targets (1.0–1.2 g/kg) are insufficient to cover dialytic losses in pediatric patients.");
      } else {
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
        if (variant === "hd") {
          protLow = wtKg * 1.2; protHigh = wtKg * 1.2;
          flags.push("Hemodialysis: 1.2 g/kg/day protein to offset dialytic losses.");
        } else if (variant === "pd") {
          protLow = wtKg * 1.2; protHigh = wtKg * 1.3;
          flags.push("Peritoneal dialysis: 1.2–1.3 g/kg/day protein to offset peritoneal amino acid losses.");
        } else {
          protLow = wtKg * 1.0; protHigh = wtKg * 1.2;
        }
        const urineOut = Number(extraInputs.urineOutputMlDay || 0);
        if (variant === "pd") {
          fluidLow = 1000; fluidHigh = 3000; fluidNote = "PD: 1000–3000 mL/day individualized.";
        } else {
          if (urineOut >= 1000) { fluidLow = 2000; fluidHigh = 2000; fluidNote = "Urine ≥1L → 2000 mL/day"; }
          else if (urineOut > 0) { fluidLow = 1000; fluidHigh = 1500; fluidNote = "Urine <1L → 1000–1500 mL/day"; }
          else { fluidNote = "Oliguria: restrict to 24h urine + 750 mL. Enter urine output above."; }
        }
      }
      break;
    }

    // ── KIDNEY TRANSPLANT ─────────────────────────────────────────────────────
    case "kidney_transplant": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const isAcute = variant === "acute";
        const pRange = calculatePediatricKidneyTransplantEnergy({ ...schofieldOpts, isAcute });
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "kidney_transplant", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        fluidNote = "Fluid unrestricted post-transplant unless clinical indication.";
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × ${isAcute ? "1.3–1.5 (acute post-op)" : "1.0–1.2 (chronic phase)"} = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Mifflin-St Jeor is inaccurate across pediatric weight groups — Schofield WH used.");
      } else {
        // Adult: MSJ × 1.2–1.3 acute; taper to maintenance. Avoid post-op overfeeding.
        eeSource = "MSJ×AF";
        if (variant === "acute") {
          afUsed = 1.25; eeKcal = ree * afUsed;
          kcalLow = ree * 1.2; kcalHigh = ree * 1.3;
          protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
          flags.push("Acute post-op: MSJ × 1.2–1.3. Taper rapidly to maintenance EER to prevent obesity in allograft recipients.");
        } else {
          afUsed = 1.2; eeKcal = ree * afUsed;
          kcalLow = wtKg * 25; kcalHigh = wtKg * 30;
          if (variant === "chronic_dm") {
            protLow = wtKg * 0.8; protHigh = wtKg * 0.9;
          } else {
            protLow = wtKg * 0.6; protHigh = wtKg * 0.8;
          }
        }
        fluidNote = "Fluid unrestricted post-transplant unless clinical indication.";
      }
      break;
    }

    // ── COPD ─────────────────────────────────────────────────────────────────
    case "copd": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = calculatePediatricCOPDEnergy(schofieldOpts);
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        protLow = wtKg * 0.8; protHigh = wtKg * 1.5;
        const ageGroup = ageYears < 10 ? "3–10y" : "10–18y";
        flags.push(`ℹ Pediatric COPD: Schofield WH ${ageGroup} bracket (${Math.round(pedsBMR)} kcal) × AF 1.3 = ${Math.round(eeKcal)} kcal/day.`);
        flags.push("Adult Schofield weight brackets are inappropriate for pediatric COPD — using age-specific WH table.");
      } else {
        // Adult COPD: MSJ × 1.15–1.20 hypermetabolic factor (matrix row 10)
        afUsed = 1.175; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = ree * 1.15; kcalHigh = ree * 1.20;
        protLow = wtKg * 0.8; protHigh = wtKg * 1.5;
        fluidNote = "DRI; restrict if cor pulmonale or pulmonary edema present.";
        flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.15–1.20 hypermetabolic factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Monitor respiratory quotient (RQ): avoid overfeeding-induced hypercapnic respiratory failure (RQ target ≤1.0).");
        if (bmi >= 30) flags.push("⚠ COPD with obesity: adjust targets; consider impact on respiratory quotient.");
      }
      fluidNote = "DRI; restrict if cor pulmonale or pulmonary edema present.";
      break;
    }

    // ── CIRRHOSIS ─────────────────────────────────────────────────────────────
    case "cirrhosis": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const pRange = calculatePediatricCirrhosisEnergy(schofieldOpts);
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        protLow = 2.5 * wtKg; protHigh = 3.0 * wtKg;
        fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
        fluidNote = "Restrict if hypervolemic hyponatremia or ascites present.";
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.3–1.5 = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day (targeting 120–140% of EAR).`);
        flags.push("Protein 2.5–3.0 g/kg/day to prevent sarcopenia and preserve lean mass.");
        flags.push("ℹ Mifflin-St Jeor and 25–35 kcal/kg severely underestimate pediatric ESLD needs.");
        flags.push("ℹ Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.");
      } else {
        // Adult cirrhosis: use dry/ideal weight; minimum 35 kcal/kg; provide late-evening snack
        wtForKcal = wtKg;
        if (useIC) {
          eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
          kcalLow = icFloor; kcalHigh = icCeiling;
        } else {
          afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
          // Matrix: minimum 35 kcal/kg
          kcalLow = wtKg * 35; kcalHigh = wtKg * 40;
        }
        if (variant === "critical") {
          protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
        } else {
          protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        }
        fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
        fluidNote = "Use dry body weight for calculations. Restrict fluid if hypervolemic hyponatremia or ascites present.";
        flags.push("ℹ Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.");
        flags.push("Provide a late-evening carbohydrate snack (200–400 kcal) to minimize overnight fasting catabolism.");
        flags.push("Use dry body weight or ideal weight-for-height; actual weight overestimates needs in ascites/fluid retention.");
      }
      break;
    }

    // ── LIVER TRANSPLANT ──────────────────────────────────────────────────────
    case "liver_transplant": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const isAcute = variant === "acute";
        const pRange = calculatePediatricLiverTransplantEnergy({ ...schofieldOpts, isAcute });
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "liver_transplant", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × ${isAcute ? "1.4–1.5 (acute)" : "1.2–1.3 (chronic)"} = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day. Targeting minimum 120% EAR.`);
        flags.push("Static 30–35 kcal/kg represents a starvation diet for infants and young children.");
      } else {
        // Adult: MSJ × 1.3 acute; taper to normal maintenance within 6–12 months
        eeSource = "MSJ×AF";
        if (variant === "acute") {
          afUsed = 1.3; eeKcal = ree * afUsed;
          kcalLow = ree * 1.3; kcalHigh = ree * 1.3;
          protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
          flags.push("Acute post-op: MSJ × 1.3. Taper to normal maintenance within 6–12 months.");
        } else {
          afUsed = 1.2; eeKcal = ree * afUsed;
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
      }
      break;
    }

    // ── CRITICAL ILLNESS ──────────────────────────────────────────────────────
    case "critical_illness": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        if (useIC) {
          eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
          kcalLow = icFloor; kcalHigh = icCeiling;
          flags.push("IC is the clinical gold standard for pediatric critical illness.");
        } else {
          eeKcal = calculatePediatricCriticalIllnessEnergy(schofieldOpts);
          eeSource = "Schofield WH×SF";
          kcalLow = eeKcal * 0.95;
          kcalHigh = eeKcal * 1.05;
          flags.push(`ℹ Schofield WH BMR without injury factor: ${Math.round(pedsBMR)} kcal/day (IC unavailable fallback — prevents overfeeding in acute metabolic phase).`);
          flags.push("⚠ Permissive underfeeding (11–25 kcal/kg) halts linear growth and causes long-term cognitive/metabolic deficits in children. IC is strongly preferred.");
        }
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "critical_illness", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid * 0.9; fluidHigh = holidayFluid * 1.1;
        fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Titrate to resuscitation goals.`;
        flags.push("Penn State 2003b is an adult equation — not validated for pediatric patients.");
      } else {
        // Adult critical illness
        const isMechVent = extraInputs.isMechVent === "true" || extraInputs.isMechVent === 1;
        const tmaxF = Number(extraInputs.tempMax) || 0;
        const ve = Number(extraInputs.ve) || 0;
        let bmiGroup = bmi < 30 ? "bmi_lt30" : bmi <= 50 ? "bmi_30_50" : "bmi_gt50";
        const activeVariant = variant || bmiGroup;

        // Determine which PSU equation applies:
        // PSU 2003b: non-obese OR obese < 60y
        // PSU 2010: obese (BMI ≥ 30) AND age ≥ 60
        const isObeseOver60 = bmi >= 30 && ageYears >= 60;

        if (useIC) {
          eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
          kcalLow = icFloor; kcalHigh = icCeiling;
          flags.push("IC is the clinical gold standard. Full feeds typically initiated after day 2–3.");
        } else if (isMechVent && tmaxF > 0 && ve > 0) {
          if (isObeseOver60) {
            // PSU 2010 for obese adults ≥ 60
            const psuKcal = calcPSU2010(ree, tmaxF, ve);
            eeKcal = Math.max(psuKcal, 0); eeSource = "PSU 2010";
            kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
            const tmaxC = ((tmaxF - 32) * 5 / 9).toFixed(1);
            flags.push(`PSU 2010 (obese ≥60): MSJ(${Math.round(ree)}) × 0.71 + Ve(${ve}) × 64 + ${tmaxC}°C × 85 − 3085 = ${Math.round(eeKcal)} kcal.`);
            flags.push("PSU 2010 selected: patient is obese (BMI ≥30) and ≥60 years old.");
          } else if (activeVariant === "bmi_lt30") {
            // PSU 2003b for non-obese
            const psuKcal = calcPSU2003b(ree, tmaxF, ve);
            eeKcal = Math.max(psuKcal, 0); eeSource = "PSU 2003b";
            kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
            const tmaxC = ((tmaxF - 32) * 5 / 9).toFixed(1);
            flags.push(`PSU 2003b: MSJ(${Math.round(ree)}) × 0.96 + ${tmaxC}°C × 167 + ${ve}L/min × 31 − 6212 = ${Math.round(eeKcal)} kcal.`);
          } else {
            // Obese < 60: hypocaloric feeding per ASPEN
            eeSource = "MSJ×AF"; afUsed = 1.2; eeKcal = ree * afUsed;
            if (activeVariant === "bmi_30_50") {
              kcalLow = wtKg * 11; kcalHigh = wtKg * 14;
              flags.push("Obese CI BMI 30–50: PSU 2003b not validated. Use permissive underfeeding 11–14 kcal/kg actual wt.");
            } else {
              wtForKcal = ibwKg; wtLabel = "IBW (Hamwi)";
              kcalLow = ibwKg * 22; kcalHigh = ibwKg * 25;
              flags.push("Severely obese CI (BMI >50): 22–25 kcal/kg IBW.");
            }
          }
        } else {
          eeSource = "MSJ×AF"; afUsed = 1.2; eeKcal = ree * afUsed;
          if (!isMechVent) {
            if (isObeseOver60) {
              flags.push("ℹ Check 'Mechanically Ventilated' and enter Tmax + Ve to activate PSU 2010 (obese ≥60).");
            } else {
              flags.push("ℹ Check 'Mechanically Ventilated' and enter Tmax + Ve to activate PSU 2003b or PSU 2010.");
            }
          }
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
        if (bmi < 30) { protLow = wtKg * 1.2; protHigh = wtKg * 2.0; }
        else if (bmi < 40) { wtForProt = ibwKg; protLow = ibwKg * 2.0; protHigh = ibwKg * 2.0; flags.push("Protein: 2.0 g/kg IBW for BMI 30–39.9"); }
        else { wtForProt = ibwKg; protLow = ibwKg * 2.5; protHigh = ibwKg * 2.5; flags.push("Protein: 2.5 g/kg IBW for BMI ≥40"); }
        fluidNote = "Physiologically titrated to resuscitation/MAP goals.";
      }
      break;
    }

    // ── PREGNANCY ─────────────────────────────────────────────────────────────
    case "pregnancy": {
      if (ageYears < 14) {
        flags.push("⚠ MANUAL ASSESSMENT REQUIRED: Patient is an extreme pediatric outlier (age < 14). Calculate manually.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
        break;
      }
      if (ageYears >= 14 && ageYears < 18) {
        const adolBMR = calculateAdolescentSchofieldBMR(wtKg, sex);
        let addOn = 0;
        if (variant === "t2") addOn = 340;
        else if (variant === "t3") addOn = 452;
        else flags.push("Trimester 1: no additional calories above non-pregnant EER.");
        eeKcal = adolBMR + addOn;
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal; kcalHigh = eeKcal + 50;
        protFixed = 71; protLow = 71; protHigh = 71;
        fluidLow = 3000; fluidHigh = 3000;
        fluidNote = "3 L/day total (beverages + food moisture)";
        flags.push(`ℹ Adolescent pregnancy: Schofield BMR (${Math.round(adolBMR)} kcal) + ${addOn} kcal gestational addition = ${Math.round(eeKcal)} kcal/day.`);
        flags.push("Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield BMR used here instead.");
      } else {
        // Adult: MSJ × 1.4 + trimester-specific additive
        afUsed = 1.4; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        let addOn = 0;
        if (variant === "t2") addOn = 340;
        else if (variant === "t3") addOn = 452;
        else flags.push("Trimester 1: no additional calories above non-pregnant EER.");
        kcalLow = ree * afUsed + addOn; kcalHigh = ree * afUsed + addOn + 50;
        protFixed = 71; protLow = 71; protHigh = 71;
        fluidLow = 3000; fluidHigh = 3000;
        fluidNote = "3 L/day total (beverages + food moisture)";
      }
      break;
    }

    // ── PRESSURE INJURIES ─────────────────────────────────────────────────────
    case "pressure_injuries": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const pRange = calculatePediatricPressureInjuryEnergy(schofieldOpts);
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        if (variant === "stage_3_4") { protLow = 1.5 * wtKg; protHigh = 2.5 * wtKg; }
        else { protLow = 1.25 * wtKg; protHigh = 2.0 * wtKg; }
        const prescribedKcal = Number(extraInputs.targetKcal || 0);
        fluidLow = wtKg * 30;
        fluidHigh = prescribedKcal > 0 ? prescribedKcal * 1.5 : wtKg * 35;
        fluidNote = "30 mL/kg/day OR 1.0–1.5 mL/kcal prescribed.";
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.2–1.4 injury factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Applying adult target (35 kcal/kg) to immobile neurologically impaired pediatric patients causes rapid obesity.");
        flags.push("Protein target: replace measured exudate loss per unit of child's body mass.");
      } else {
        // Adult: MSJ × 1.2–1.3
        afUsed = 1.25; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = ree * 1.2; kcalHigh = ree * 1.3;
        if (variant === "stage_3_4") {
          protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
        } else {
          protLow = wtKg * 1.25; protHigh = wtKg * 1.5;
        }
        const prescribedKcal = Number(extraInputs.targetKcal || 0);
        fluidLow = wtKg * 30;
        fluidHigh = prescribedKcal > 0 ? prescribedKcal * 1.5 : wtKg * 35;
        fluidNote = "30 mL/kg/day OR 1.0–1.5 mL/kcal prescribed.";
        flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.2–1.3 stress factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
      }
      break;
    }

    // ── TRAUMA ───────────────────────────────────────────────────────────────
    case "trauma": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const pRange = calculatePediatricTraumaEnergy(schofieldOpts);
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "trauma", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid; fluidHigh = holidayFluid * 1.2;
        fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Adjust for losses.`;
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.3–1.5 trauma factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Protein may significantly exceed 2.0 g/kg based on age-specific growth and recovery demands.");
      } else {
        // Adult trauma: MSJ × 1.3–1.4
        afUsed = 1.35; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = ree * 1.3; kcalHigh = ree * 1.4;
        protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
        flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.3–1.4 acute phase factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Severe/polytrauma: protein may exceed 2.0 g/kg — individualize. Use IC to track energy expenditure changes.");
      }
      break;
    }

    // ── MASLD / MASH ──────────────────────────────────────────────────────────
    case "masld_mash": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = calculatePediatricMASLDEnergy(schofieldOpts);
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal * 0.95;
        kcalHigh = eeKcal * 1.05;
        protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        fluidNote = "Individualized; restrict if ascites or edema present.";
        flags.push("ℹ Pediatric MASLD/MASH: EER based on desirable body weight for height, not adult kcal/kg targets.");
        flags.push("Adult BMI classifications (>40 kg/m²) are invalid for pediatric staging — use >95th percentile BMI-for-age.");
        flags.push("Implement gradual, growth-preserving weight management guidelines; avoid aggressive restriction.");
      } else {
        // Adult MASLD: hypocaloric deficit −500 to −800 kcal/day; protein >1.5 g/kg
        if (useIC) {
          eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
          kcalLow = icFloor - 800; kcalHigh = icFloor - 500;
          flags.push("IC preferred for MASLD/MASH. Apply −500 to −800 kcal/day hypocaloric deficit from measured REE.");
        } else {
          afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
          if (variant === "malnourished") {
            // Underweight/sarcopenic: no deficit — meet full EER
            kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
            flags.push("Underweight/malnourished/sarcopenic MASLD: 30–35 kcal/kg. Do NOT apply caloric deficit.");
          } else {
            // Standard: apply −500 to −800 kcal/day deficit to MSJ×AF
            kcalLow = Math.max(eeKcal - 800, wtKg * 20);
            kcalHigh = Math.max(eeKcal - 500, wtKg * 22);
            flags.push(`Hypocaloric deficit: MSJ×AF(${Math.round(eeKcal)}) − 500–800 kcal = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
          }
          if (bmi >= 18.5 && bmi < 35) {
            flags.push("Target 5–10% total body weight loss to improve hepatic outcomes (EASL-EASD-EASO, 2024).");
          }
        }
        // Protein preserved above 1.5 g/kg to protect lean mass
        protLow = wtKg * 1.5; protHigh = wtKg * 1.8;
        flags.push("Maintain protein ≥1.5 g/kg/day to preserve lean body mass during caloric restriction.");
        fluidNote = "Individualized; restrict if ascites or edema present.";
      }
      break;
    }

    // ── SHORT BOWEL SYNDROME ──────────────────────────────────────────────────
    case "short_bowel": {
      if (isPeds) {
        flags.push("⚠ FOLLOW-UP REQUIRED: Pediatric SBS energy targets (preterm: 90–120 kcal/kg; term infants: 75–85 kcal/kg) and ostomy/stool output-scaled fluid require additional input fields not yet implemented.");
        flags.push("Consult pediatric gastroenterology. IC strongly recommended.");
      }
      afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      const eerBase = eeKcal;
      kcalLow = eerBase * 1.2; kcalHigh = eerBase * 1.5;
      const midKcal = (kcalLow + kcalHigh) / 2;
      const protFromEnergy = (midKcal * 0.20) / 4;
      protLow = Math.max(protFromEnergy, wtKg * 1.5);
      protHigh = Math.max(protFromEnergy * 1.1, wtKg * 2.0);
      fluidNote = "Titrate to ostomy/stool loss; goal urine output >1200 mL/day.";
      flags.push("SBS: 20% of total energy from high biological value protein.");
      flags.push("Compensate for ~50% malabsorption with at least +20% energy buffer.");
      break;
    }

    // ── CYSTIC FIBROSIS ───────────────────────────────────────────────────────
    case "cystic_fibrosis": {
      const fev1 = Number(extraInputs.fev1Pct) || 100;
      const isPancSuf = extraInputs.isPancreaticSufficient === "true" || extraInputs.isPancreaticSufficient === 1;
      const cfa = Number(extraInputs.cfa) || 0.85;

      // PAL from variant (adult) or from extraInputs (peds)
      let palForCF = 1.5; // default sedentary
      if (variant === "bed") palForCF = 1.3;
      else if (variant === "active") palForCF = 1.7;

      if (isPeds) {
        // Pediatric: use age-specific Schofield WH brackets with CF-adjusted factors
        const pRange = calculatePediatricCFEnergy({
          ageDays,
          weightKg: wtKg,
          heightCm: htCm,
          sex,
          ac: palForCF,
          dc: fev1 >= 80 ? 0 : fev1 >= 40 ? 0.2 : 0.4,
          isPancreaticSufficient: isPancSuf,
          cfa
        });
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "CF Formula";
        kcalLow = pRange.min;
        kcalHigh = pRange.max;
        flags.push(`ℹ Pediatric CF Formula: PAL ${palForCF} + DC ${fev1 >= 80 ? 0 : fev1 >= 40 ? 0.2 : 0.4} with Schofield WH ${ageYears < 3 ? "0–3y" : ageYears < 10 ? "3–10y" : "10–18y"} bracket.`);
        flags.push("CF systems frequently truncate age at 10 — correct pediatric brackets used.");
      } else {
        // Adult CF: MSJ × disease factor (FEV1-based) × PAL / CFA
        // Disease factor based on FEV1%:
        //   FEV1 ≥ 80%:        1.0–1.1
        //   FEV1 40–79%:       1.1–1.4
        //   FEV1 < 40%:        1.5–2.0
        let dfLow: number, dfHigh: number;
        if (fev1 >= 80) {
          dfLow = 1.0; dfHigh = 1.1;
        } else if (fev1 >= 40) {
          dfLow = 1.1; dfHigh = 1.4;
        } else {
          dfLow = 1.5; dfHigh = 2.0;
        }

        const msjAdjLow = ree * dfLow;
        const msjAdjHigh = ree * dfHigh;
        const teeLow = msjAdjLow * palForCF;
        const teeHigh = msjAdjHigh * palForCF;

        if (isPancSuf) {
          eeKcal = (teeLow + teeHigh) / 2;
          kcalLow = teeLow;
          kcalHigh = teeHigh;
        } else {
          // Divide by CFA to correct for malabsorption
          eeKcal = ((teeLow + teeHigh) / 2) / cfa;
          kcalLow = teeLow / cfa;
          kcalHigh = teeHigh / cfa;
          flags.push(`Malabsorption correction: TEE(${Math.round((teeLow + teeHigh) / 2)}) ÷ CFA(${cfa}) = ${Math.round(eeKcal)} kcal/day.`);
        }
        eeSource = "CF Formula";
        flags.push(`Adult CF: MSJ(${Math.round(ree)}) × DF(${dfLow}–${dfHigh}) × PAL(${palForCF}) = TEE ${Math.round(teeLow)}–${Math.round(teeHigh)} kcal/day.`);
        flags.push(`FEV₁ ${fev1}% → Disease Factor ${dfLow}–${dfHigh}. ${fev1 < 40 ? "Severe airflow obstruction: significant hypermetabolism." : fev1 < 80 ? "Moderate obstruction: increased energy demands." : "Mild/normal lung function."}`);
      }

      protLow = wtKg * 0.8 * 1.2; protHigh = wtKg * 0.8 * 2.0;
      fluidNote = "DRI";
      break;
    }

    // ── STROKE ────────────────────────────────────────────────────────────────
    case "stroke": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        eeKcal = calculatePediatricStrokeEnergy(schofieldOpts);
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
        if (variant === "hemorrhagic") { protLow = wtKg * 1.5; protHigh = wtKg * 2.5; }
        else { protLow = wtKg * 1.0; protHigh = wtKg * 1.5; }
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid; fluidHigh = holidayFluid * 1.1;
        fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Monitor closely to avoid contributing to cerebral edema.`;
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.2 = ${Math.round(eeKcal)} kcal/day.`);
        flags.push("Adult fluid targets (30–40 mL/kg) induce severe dehydration in pediatric patients — Holliday-Segar used.");
      } else {
        // Adult stroke: MSJ × 1.1–1.2
        afUsed = 1.15; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = ree * 1.1; kcalHigh = ree * 1.2;
        if (variant === "hemorrhagic") {
          protLow = wtKg * 1.5; protHigh = wtKg * 2.5;
          flags.push("Hemorrhagic stroke: increase protein up to 2.5 g/kg/day to counter severe neuro-catabolism.");
        } else {
          protLow = wtKg * 1.0; protHigh = wtKg * 1.5;
        }
        fluidLow = wtKg * 30; fluidHigh = wtKg * 40;
        fluidNote = "30–40 mL/kg; manage carefully in patients at risk for cerebral edema.";
        flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.1–1.2 stress factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
      }
      break;
    }

    // ── HEART FAILURE ─────────────────────────────────────────────────────────
    case "heart_failure": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const pRange = calculatePediatricHeartFailureEnergy(schofieldOpts);
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min; kcalHigh = pRange.max;
        protLow = 1.5 * wtKg; protHigh = 2.0 * wtKg;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid * 0.7; fluidHigh = holidayFluid * 0.9;
        fluidNote = `Restrict fluid: target 70–90% of Holliday-Segar (~${Math.round(holidayFluid * 0.8)} mL/day). Use calorically dense enteral formulas to meet energy in restricted volume.`;
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × 1.2–1.4 hypermetabolic factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Pediatric congenital heart disease: account for hypermetabolism from increased cardiac workload.");
      } else {
        // Adult heart failure: MSJ × custom AF/CAF
        const palHF = Number(extraInputs.pal) || 1.3;
        afUsed = palHF; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
        protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
        fluidNote = "Strictly individualized — often fluid restricted. Individualize sodium and fluid restrictions based on volume status and ejection fraction.";
        flags.push("Cardiac cachexia increases REE, but total energy needs may be lower due to decreased physical activity.");
        flags.push("Heart failure: fluid restriction individualized to clinical status and ejection fraction.");
      }
      break;
    }

    // ── OBESITY STABLE ────────────────────────────────────────────────────────
    case "obesity_stable": {
      if (isPeds) {
        flags.push("ℹ Pediatric obesity energy targets are calculated via the DRI/EER Overweight equations in Pipeline A. Select 'Healthy / Preventive' to access age-specific overweight EER calculations.");
        flags.push("Gradual, growth-preserving weight management: target weight stabilization, not active loss, during linear growth phases.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
      } else {
        // Adult obesity: 20–25 kcal/kg IBW, or use IC
        eeSource = "MSJ×AF"; afUsed = 1.2; eeKcal = ree * afUsed;
        wtForKcal = ibwKg; wtLabel = "IBW (Hamwi)";
        kcalLow = ibwKg * 20; kcalHigh = ibwKg * 25;
        protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
        fluidNote = "DRI (~30 mL/kg)";
        flags.push(`20–25 kcal/kg IBW (${Math.round(ibwKg)} kg). Use IC for more precise target. Consider adjusted body weight if BMI ≥40.`);
      }
      break;
    }

    // ── SEVERE MALNUTRITION ───────────────────────────────────────────────────
    case "severe_malnutrition": {
      if (isPeds) {
        flags.push("⚠ FOLLOW-UP REQUIRED: Pediatric catch-up growth formula [RDA × Ideal Weight / Actual Weight] requires an 'Ideal Weight for Height' input field not yet implemented.");
        flags.push("Start at 50% of energy target and advance over 3–5 days. Monitor phosphorus, magnesium, potassium, and thiamine closely.");
        flags.push("⚠ REFEEDING RISK: Pediatric refeeding syndrome risks are overlooked when applying standard adult energy calculations.");
      }
      // Adult severe malnutrition: not in matrix — provide safe fallback with refeeding warning
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
      const pal = Number(extraInputs.pal) || 1.5;

      if (isPeds) {
        eeKcal = calculatePediatricSCDEnergy({ weightKg: wtKg, hgbGdL: hgb, sex, pal });
        eeSource = "SCD REE";
        kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "sickle_cell", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        flags.push(`ℹ Pediatric SCD REE: Hemoglobin-adjusted sex-specific equation (Hgb: ${hgb} g/dL) × AF ${pal}.`);
        flags.push("Adult MSJ with activity factors is architecturally invalid for pediatric SCD — sex-specific hemoglobin-adjusted REE used.");
      } else {
        // Adult SCD: MSJ × 1.3–1.5 during VOC; 1.3 stable
        eeSource = "MSJ×AF";
        if (variant === "adult_crisis") {
          afUsed = 1.4; eeKcal = ree * afUsed;
          kcalLow = ree * 1.3; kcalHigh = ree * 1.5;
          flags.push("Vaso-occlusive crisis (VOC): MSJ × 1.3–1.5. REE increases significantly during sickling episodes.");
        } else {
          afUsed = 1.3; eeKcal = ree * afUsed;
          kcalLow = ree * 1.3; kcalHigh = ree * 1.3;
        }
        protLow = wtKg * 1.0; protHigh = wtKg * 1.3;
        fluidNote = "High fluid intake recommended to prevent vaso-occlusive crisis.";
        flags.push("Maintain high baseline fluid intake to prevent sickling events.");
      }
      break;
    }

    // ── DIABETES MELLITUS ────────────────────────────────────────────────────
    case "diabetes": {
      if (isPeds) {
        flags.push("ℹ Pediatric Diabetes: baseline energy set to age-specific EER. Review 'Healthy' domain for overweight EER calculations if needed.");
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        eeKcal = calculateSchofieldWH(schofieldOpts);
        eeSource = "Schofield WH×SF";
        kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
        const healthyProt = getPediatricSDI(ageDays, wtKg);
        protLow = healthyProt; protHigh = healthyProt * 1.2;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid; fluidHigh = holidayFluid;
        fluidNote = "Holliday-Segar; adjust for glycosuria if present.";
        flags.push("Restructure macronutrients to favor high-fiber, low-glycemic-index carbohydrates to improve insulin sensitivity.");
      } else {
        // Adult diabetes: MSJ × 1.2; 20–25 kcal/kg
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 20; kcalHigh = wtKg * 25;
        protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
        fluidNote = "DRI (~30 mL/kg)";
        flags.push("Carbohydrate quality over quantity: favor high-fiber, low-GI sources.");
      }
      break;
    }

    // ── HSCT ─────────────────────────────────────────────────────────────────
    case "hsct": {
      if (isPeds) {
        const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };
        const pedsBMR = calculateSchofieldWH(schofieldOpts);
        const pRange = calculatePediatricHSCTEnergy(schofieldOpts);
        eeKcal = (pRange.min + pRange.max) / 2;
        eeSource = "Schofield WH×SF";
        kcalLow = pRange.min; kcalHigh = pRange.max;
        const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "hsct", variant: variant || "", extraInputs });
        protLow = protRange.min; protHigh = protRange.max;
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid * 0.9; fluidHigh = holidayFluid * 1.1;
        fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Increase with fever, GI losses, conditioning.`;
        const ageGroup = ageYears < 2 ? "infant (× 1.6–1.8)" : "child (× 1.4–1.6)";
        flags.push(`ℹ Schofield WH BMR: ${Math.round(pedsBMR)} kcal × ${ageGroup} = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        flags.push("Adult Mifflin-St Jeor with pediatric multipliers (1.4–1.8) is architecturally invalid — Schofield WH baseline used.");
      } else {
        // Adult HSCT: MSJ × 1.3–1.5 acute post-engraftment
        eeSource = "HSCT";
        if (variant === "post_engraft") {
          afUsed = 1.3; eeKcal = ree * afUsed;
          kcalLow = ree * 1.3; kcalHigh = ree * 1.3;
          protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
          flags.push("Post-engraftment: energy needs decrease — reassess regularly.");
        } else {
          // Acute: MSJ × 1.3–1.5
          afUsed = 1.4; eeKcal = ree * afUsed;
          kcalLow = Math.min(ree * 1.3, wtKg * 30);
          kcalHigh = Math.max(ree * 1.5, wtKg * 35);
          protLow = wtKg * 1.5; protHigh = wtKg * 1.5;
          flags.push("Adults (HSCT): MSJ × 1.3–1.5 or 30–35 kcal/kg during first month post-transplant.");
        }
        const holidayFluid = calcHolidaySegar(wtKg);
        fluidLow = holidayFluid * 0.9; fluidHigh = holidayFluid * 1.1;
        fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Increase with fever, GI losses, conditioning.`;
        flags.push("HSCT fluid: increase with fever, excessive GI losses, hypermetabolism, nephrotoxic meds.");
        flags.push("Post-transplant complications (GvHD) can significantly increase energy and protein requirements — reassess frequently.");
      }
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
    isPediatric: isPeds,
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
];