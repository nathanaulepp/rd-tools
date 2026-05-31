// src/features/assessment/assess-standards/nutritionStandards.ts
//
// PUBLIC API BARREL for the Comparative Standards domain.
//
// Exports:
//   - All pure math helpers (calcIBW, calcMSJ, calcPSU2003b, etc.)
//   - Condition registry data (CONDITION_LABELS, CONDITION_VARIANTS, etc.)
//   - evaluateNutritionRx() — the single entry point for the UI
//
// The giant switch that used to live here has been split into:
//   - nutritionStandardsAdult.ts  → evaluateAdultCondition()
//   - nutritionStandardsPeds.ts   → evaluatePedsCondition()
//
// UI components (NutritionStandardsDomain.tsx) import ONLY from this file.

import type {
  EvalStatus,
  PatientInputs,
  CurrentRx,
  EvalResult,
  NutritionEvaluation,
  ConditionKey,
  EvalOptions,
} from "../../../types/standards";

import type { SharedEvalContext, ConditionResult } from "./nutritionStandardsTypes";
import { evaluateAdultCondition }  from "./nutritionStandardsAdult";
import { evaluatePedsCondition }   from "./nutritionStandardsPeds";

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

// ─── Eval helpers (used in barrel result-assembly) ────────────────────────────

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
  bpd: "Bronchopulmonary Dysplasia (BPD)",
};

// ─── Condition Variants ───────────────────────────────────────────────────────

export const CONDITION_VARIANTS: Partial<Record<ConditionKey, { key: string; label: string; minAge?: number; maxAge?: number; sex?: "M" | "F" }[]>> = {
  aki: [
    { key: "no_dialysis", label: "No Dialysis / Non-catabolic" },
    { key: "dialysis",    label: "Hemodialysis / Catabolic" },
    { key: "crrt",        label: "CRRT / Critical" },
  ],
  acute_pancreatitis: [
    { key: "mild_moderate",   label: "Mild–Moderate" },
    { key: "severe_critical", label: "Severe / Critical / ICU" },
  ],
  breastfeeding: [
    { key: "early", label: "0–6 months postpartum",  sex: "F", minAge: 12 },
    { key: "late",  label: "7–12 months postpartum", sex: "F", minAge: 12 },
  ],
  burns: [
    { key: "adult_milner",      label: "Adult — Milner",              minAge: 18 },
    { key: "adult_toronto",     label: "Adult — Toronto (preferred)", minAge: 18 },
    { key: "child_1_11",        label: "Child 1–11y (Galveston)",     minAge: 1,  maxAge: 11.9 },
    { key: "adolescent_12_16",  label: "Adolescent 12–16y (Galveston)", minAge: 12, maxAge: 16.9 },
  ],
  oncology: [
    { key: "non_ambulatory",    label: "Non-ambulatory / Sedentary" },
    { key: "hypermetabolic",    label: "Hypermetabolic / Treatment" },
    { key: "severely_stressed", label: "Severely Stressed / HCT first month" },
    { key: "high_protein",      label: "High Protein Needs (wasting/enteropathy)" },
  ],
  cancer: [
    { key: "non_ambulatory",    label: "Non-ambulatory / Sedentary" },
    { key: "hypermetabolic",    label: "Hypermetabolic / Treatment" },
    { key: "severely_stressed", label: "Severely Stressed / HCT first month" },
    { key: "high_protein",      label: "High Protein Needs (wasting/enteropathy)" },
  ],
  short_bowel: [
    { key: "adult_standard",          label: "Adult — Standard / Intestinal Failure" },
    { key: "peds_pn_dependent",       label: "Pediatric — PN-Dependent" },
    { key: "peds_enteral_autonomous", label: "Pediatric — Enteral Autonomous / Transitioning" },
  ],
  ckd_3_5: [
    { key: "vlcd",   label: "VLCD + Keto Analogs" },
    { key: "lcd",    label: "Low-Protein Diet" },
    { key: "lcd_dm", label: "Low-Protein + Diabetes" },
  ],
  ckd_5d: [
    { key: "hd", label: "Hemodialysis (HD)" },
    { key: "pd", label: "Peritoneal Dialysis (PD)" },
  ],
  kidney_transplant: [
    { key: "acute",      label: "Acute (Post-op)" },
    { key: "chronic",    label: "Chronic (Stable, no DM)" },
    { key: "chronic_dm", label: "Chronic + Diabetes" },
  ],
  cirrhosis: [
    { key: "standard",  label: "Standard / Compensated" },
    { key: "critical",  label: "Critical / Decompensated" },
  ],
  liver_transplant: [
    { key: "acute",   label: "Acute (Post-op)" },
    { key: "chronic", label: "Chronic (Stable)" },
  ],
  critical_illness: [
    { key: "bmi_lt30",  label: "BMI < 30" },
    { key: "bmi_30_50", label: "BMI 30–50 (Obese)" },
    { key: "bmi_gt50",  label: "BMI > 50 (Severely Obese)" },
  ],
  pregnancy: [
    { key: "t1", label: "Trimester 1 (+0 kcal)",   sex: "F", minAge: 12 },
    { key: "t2", label: "Trimester 2 (+340 kcal)",  sex: "F", minAge: 12 },
    { key: "t3", label: "Trimester 3 (+452 kcal)",  sex: "F", minAge: 12 },
  ],
  pressure_injuries: [
    { key: "stage_1_2", label: "Stage 1–2" },
    { key: "stage_3_4", label: "Stage 3–4" },
  ],
  masld_mash: [
    { key: "standard",    label: "Standard (BMI 18.5–39.9)" },
    { key: "malnourished", label: "Underweight / Malnourished / Sarcopenic" },
  ],
  cystic_fibrosis: [
    { key: "bed",       label: "Bed-bound (PAL 1.3)" },
    { key: "sedentary", label: "Sedentary (PAL 1.5)" },
    { key: "active",    label: "Active (PAL 1.7)" },
  ],
  stroke: [
    { key: "standard",    label: "Ischemic / Standard" },
    { key: "hemorrhagic", label: "Hemorrhagic / High Protein" },
  ],
  sickle_cell: [
    { key: "peds_stable",  label: "Pediatric — Stable",       maxAge: 17.9 },
    { key: "peds_crisis",  label: "Pediatric — VOC / Crisis", maxAge: 17.9 },
    { key: "adult_stable", label: "Adult — Stable",           minAge: 18 },
    { key: "adult_crisis", label: "Adult — VOC / Crisis",     minAge: 18 },
  ],
  hsct: [
    { key: "infant_child",  label: "Infants & Young Children (BMR × 1.6–1.8)", maxAge: 5.9 },
    { key: "child_16",      label: "Children ≤ 16 yr / ≤ 75 kg (BMR × 1.6)",  maxAge: 16 },
    { key: "older_adol",    label: "Older Adolescent > 16 yr or > 75 kg (BEE × 1.5–1.6)", minAge: 16.1, maxAge: 17.9 },
    { key: "adult",         label: "Adult (BEE × 1.5 or 30–35 kcal/kg)",       minAge: 18 },
    { key: "post_engraft",  label: "Post-engraftment / Recovery" },
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
    { key: "tempMax",    label: "Max Temp past 24h (°F)",      type: "number", hint: "Required for PSU 2003b / PSU 2010", autoPullFrom: "clinical.tempMax" },
    { key: "ve",         label: "Minute Ventilation Ve (L/min)", type: "number", hint: "Required for PSU 2003b / PSU 2010", autoPullFrom: "clinical.ve" },
  ],
  cystic_fibrosis: [
    { key: "fev1Pct",               label: "FEV₁ % Predicted",                  type: "number", autoPullFrom: "clinical.fev1" },
    { key: "isPancreaticSufficient", label: "Pancreatic Sufficient",              type: "checkbox" },
    { key: "cfa",                   label: "Coefficient of Fat Absorption (CFA)", type: "number", hint: "Default 0.85 if no stool collection" },
  ],
  burns: [
    { key: "tbsaPct",       label: "TBSA Burned (%)",                   type: "number", autoPullFrom: "clinical.tbsa" },
    { key: "pbd",           label: "Post-Burn Day (PBD)",               type: "number", hint: "Required for Milner and Toronto" },
    { key: "caloricIntake", label: "Current Caloric Intake (kcal/day)", type: "number", hint: "Required for Toronto equation" },
    { key: "coreTemp",      label: "Core Temperature (°C)",             type: "number", hint: "Required for Toronto equation" },
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
  short_bowel: [
    { key: "hasPreservedColon",    label: "Preserved Colon (increases water absorption)",    type: "checkbox" },
    { key: "remainingBowelShort",  label: "Remaining Bowel < 40 cm or Excessive Output",     type: "checkbox" },
    { key: "growthSuboptimal",     label: "Suboptimal Growth Trajectory",                    type: "checkbox" },
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
  const ree   = calcMSJ(wtKg, htCm, ageYears, sex);

  // ── IC override pre-computation ──────────────────────────────────────────────
  const useIC        = !!icMeasuredKcal && icMeasuredKcal > 0;
  const activeIcCaf  = icCaf || 1.0;
  const icFloor      = useIC ? icMeasuredKcal * activeIcCaf      : 0;
  const icCeiling    = useIC ? icMeasuredKcal * (activeIcCaf + 0.1) : 0;

  // ── Build shared context ──────────────────────────────────────────────────────
  const ctx: SharedEvalContext = {
    wtKg, htCm, ageYears, ageDays, sex, bmi,
    ibwKg, ree,
    useIC, icFloor, icCeiling, activeIcCaf,
  };

  // ── Delegate to the correct sub-engine ───────────────────────────────────────
  const cr: ConditionResult = isPeds
    ? evaluatePedsCondition({ ...opts, condition }, ctx)
    : evaluateAdultCondition({ ...opts, condition }, ctx);

  // ── IC global override (applies to BOTH paths) ────────────────────────────────
  let { kcalLow, kcalHigh, eeKcal, eeSource, cafUsed } = cr;
  if (useIC) {
    eeKcal    = icFloor;
    eeSource  = "IC";
    cafUsed   = activeIcCaf;
    kcalLow   = icFloor;
    kcalHigh  = icCeiling;
  }

  const { protLow, protHigh, protFixed, fluidLow, fluidHigh, fluidNote,
          wtForKcal, wtLabel, wtForProt, afUsed, flags } = cr;

  // ── Build result rows ─────────────────────────────────────────────────────────
  const results: EvalResult[] = [];

  if (kcalLow > 0 && kcalHigh > 0) {
    results.push({
      label:   "Energy",
      target:  fmtRange(kcalLow, kcalHigh, "kcal/day"),
      current: currentRx.kcalPerDay,
      unit:    "kcal/day",
      status:  evalStatus(currentRx.kcalPerDay, kcalLow, kcalHigh),
      note: eeSource === "IC"
        ? `Based on Indirect Calorimetry (${icMeasuredKcal} kcal) × CAF ${activeIcCaf}`
        : `Based on ${wtLabel} (${Math.round(wtForKcal)} kg) via ${eeSource}`,
    });
  }

  if (protLow > 0 || protFixed !== null) {
    const pLow  = protFixed ?? protLow;
    const pHigh = protFixed ?? protHigh;
    results.push({
      label:   "Protein",
      target:  fmtRange(pLow, pHigh, "g/day"),
      current: currentRx.proteinGPerDay,
      unit:    "g/day",
      status:  evalStatus(currentRx.proteinGPerDay, pLow, pHigh),
      note: protFixed
        ? `Fixed RDA target (${protFixed} g/day)`
        : `Based on ${wtForProt === ibwKg ? "IBW (Hamwi)" : wtLabel} (${Math.round(wtForProt)} kg)`,
    });
  }

  if (fluidLow !== null && fluidHigh !== null && currentRx.fluidMlPerDay !== undefined) {
    results.push({
      label:   "Fluid",
      target:  fmtRange(fluidLow, fluidHigh, "mL/day"),
      current: currentRx.fluidMlPerDay,
      unit:    "mL/day",
      status:  evalStatus(currentRx.fluidMlPerDay, fluidLow, fluidHigh),
      note:    fluidNote,
    });
  } else if (fluidNote) {
    flags.push(`Fluid: ${fluidNote}`);
  }

  return {
    ibwKg,
    reeKcal:     Math.round(ree),
    eeKcal:      Math.round(eeKcal),
    eeSource,
    afUsed,
    cafUsed,
    weightUsed:  Math.round(wtForKcal * 10) / 10,
    weightLabel: wtLabel,
    isPediatric: isPeds,
    results,
    flags,
  };
}

// ─── Reference Tables ─────────────────────────────────────────────────────────

export const IC_ACTIVITY_FACTORS: { condition: string; cafLow: number; cafHigh: number; note: string }[] = [
  { condition: "Uncomplicated post-op / sedated ventilated", cafLow: 1.0, cafHigh: 1.1, note: "Minimal stress" },
  { condition: "Mild infection / medical floor",             cafLow: 1.1, cafHigh: 1.2, note: "Low-moderate physiologic stress" },
  { condition: "Major surgery / moderate sepsis",            cafLow: 1.2, cafHigh: 1.3, note: "Moderate hypermetabolism" },
  { condition: "Polytrauma / severe sepsis / burns",         cafLow: 1.3, cafHigh: 1.5, note: "High hypermetabolism" },
  { condition: "Severe burns / major head injury",           cafLow: 1.5, cafHigh: 1.8, note: "Very high catabolism" },
];

export const MSJ_ACTIVITY_FACTORS: { label: string; af: number; description: string }[] = [
  { label: "Sedentary",        af: 1.2,   description: "Little or no activity; bed rest" },
  { label: "Lightly active",   af: 1.375, description: "Light exercise 1–3 days/week" },
  { label: "Moderately active",af: 1.55,  description: "Moderate exercise 3–5 days/week" },
  { label: "Very active",      af: 1.725, description: "Hard exercise 6–7 days/week" },
  { label: "Extra active",     af: 1.9,   description: "Very hard exercise / physical job" },
];