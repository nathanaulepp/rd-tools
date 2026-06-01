// src/shared/utils/nutrition-engine/nutritionStandards.ts
//
// PUBLIC API BARREL for the Comparative Standards domain.


import type {
  EvalStatus,
  EvalResult,
  NutritionEvaluation,
  ConditionKey,
  EvalOptions,
  RuntimeContext,
  EvaluationSnapshot,
} from "../../../types/standards";

import type { ConditionResult, SharedEvalContext } from "./nutritionStandardsTypes";
import { evaluateAdultCondition } from "./nutritionStandardsAdult";
import { evaluatePedsCondition }  from "./nutritionStandardsPeds";
import {
  calcIBW,
  calcBSA,
  calcFleischBMR,
  calcHarrisBenedict,
  calcMSJ,
  calcPSU2003b,
  calcPSU2010,
  calcToronto,
  calcSchofieldBMR,
  calcCFBMR,
  calcSCDREEPeds,
  calcHolidaySegar,
  evalStatus,
  fmtRange,
  isPedsAge,
} from "./nutritionStandardsMath";

// Re-export math helpers for backward compatibility with other files (e.g. useCalculatedMetrics)
export {
  calcIBW,
  calcBSA,
  calcFleischBMR,
  calcHarrisBenedict,
  calcMSJ,
  calcPSU2003b,
  calcPSU2010,
  calcToronto,
  calcSchofieldBMR,
  calcCFBMR,
  calcSCDREEPeds,
  calcHolidaySegar,
};

// ─── buildRuntimeContext ──────────────────────────────────────────────────────
//
// Constructs the normalized, dollar-prefixed RuntimeContext from raw inputs.
// This is the single place where all patient variables are computed and named.
//
// Rules:
//   - Always produces both SI and imperial variants so equations never branch
//     on unit selection.
//   - Pre-computes both MSJ and Schofield REE baselines; the sub-engines pick
//     whichever is appropriate for age.
//   - Merges dollar-prefixed extra inputs at the end so condition-specific
//     values (e.g. $tbsaPct, $fev1Pct) are accessible under the same
//     naming convention as core variables.

export function buildRuntimeContext(opts: EvalOptions, sex: "M" | "F"): RuntimeContext {
  const { patient, extraInputs = {} } = opts;
  const {
    wtKg,
    htCm,
    ageYears,
    ageDays = ageYears * 365.25,
    bmi,
    icMeasuredKcal = 0,
    icCaf = 1.0,
  } = patient;

  const htM   = htCm / 100;
  const htIn  = htCm / 2.54;
  const wtLbs = wtKg * 2.2046;
  const ibwKg = calcIBW(htCm, sex);
  const bsa   = calcBSA(htCm, wtKg);
  const msjKcal       = calcMSJ(wtKg, htCm, ageYears, sex);
  const schofieldKcal = calcSchofieldBMR(wtKg, htM, ageYears, sex);

  // Normalize extra inputs to dollar-prefixed numeric keys
  const extraNormalized: Record<string, number> = {};
  for (const [k, v] of Object.entries(extraInputs)) {
    const key = k.startsWith("$") ? k : `$${k}`;
    const num = typeof v === "number" ? v : parseFloat(v as string);
    extraNormalized[key] = isNaN(num) ? 0 : num;
  }

  const ctx: RuntimeContext = {
    $wtKg:           wtKg,
    $wtLbs:          wtLbs,
    $ibwKg:          ibwKg,
    $ibwLbs:         ibwKg * 2.2046,
    $adjIbwKg:       ibwKg,
    $edwKg:          wtKg,
    $htCm:           htCm,
    $htIn:           htIn,
    $htM:            htM,
    $ageDays:        ageDays,
    $ageYears:       ageYears,
    $ageMonths:      ageDays / 30.4375,
    $bmi:            bmi,
    $bsa:            bsa,
    $msjKcal:        msjKcal,
    $schofieldKcal:  schofieldKcal,
    $icMeasuredKcal: icMeasuredKcal,
    $icCaf:          icCaf,
    ...extraNormalized,
  };

  return ctx;
}

// ─── resolveEquation ─────────────────────────────────────────────────────────
//
// Safe, sandboxed evaluator for arithmetic expression strings that reference
// dollar-prefixed RuntimeContext variables.
//
// Supported:
//   - Variable references:  $wtKg, $ibwKg, $msjKcal, etc.
//   - Arithmetic operators: + - * / ( )
//   - Math functions:       min(...), max(...), round(...)
//   - Numeric literals
//
// NOT supported (and will throw):
//   - Any identifier not starting with $ (prevents code injection)
//   - eval(), Function(), or any JS execution primitive besides the
//     controlled Function constructor below (which only receives a
//     fully numeric + operators string after substitution)
//
// Example:
//   resolveEquation("$wtKg * 1.5", ctx) → 108.75  (for wtKg = 72.5)
//   resolveEquation("max($ibwKg, $edwKg) * 1.2", ctx) → ...
//
// Milestone 2: this function will be called by the Settings equation builder
// to validate user-entered expressions before saving to the DB.

export function resolveEquation(expr: string, ctx: RuntimeContext): number {
  // Step 1 — substitute all $variable references with their numeric values
  const substituted = expr.replace(/\$[a-zA-Z][a-zA-Z0-9]*/g, (match) => {
    const val = (ctx as unknown as Record<string, number>)[match];
    if (val === undefined) {
      throw new Error(`resolveEquation: unknown variable "${match}"`);
    }
    return String(val);
  });

  // Step 2 — strip allowed function names, then verify only safe chars remain
  const withoutFns = substituted
    .replace(/\bmin\s*\(/g, "(")
    .replace(/\bmax\s*\(/g, "(")
    .replace(/\bround\s*\(/g, "(");

  if (!/^[\d\s\+\-\*\/\(\)\.\,]+$/.test(withoutFns)) {
    throw new Error(`resolveEquation: unsafe expression after substitution: "${substituted}"`);
  }

  // Step 3 — evaluate using a controlled Function constructor on a fully
  // numeric string. Safe because Step 2 guarantees no identifiers remain.
  try {
    const fn = new Function(
      "min", "max", "round",
      `"use strict"; return (${substituted});`
    );
    const result = fn(Math.min, Math.max, Math.round);
    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error(`resolveEquation: non-finite result for "${expr}"`);
    }
    return result;
  } catch (e) {
    throw new Error(`resolveEquation: evaluation failed for "${expr}": ${(e as Error).message}`);
  }
}

// ─── buildSnapshot ────────────────────────────────────────────────────────────
//
// Lifts a completed NutritionEvaluation + RuntimeContext into the
// EvaluationSnapshot shape that gets written into notes.standards.
//
// Called by evaluateNutritionRx() after the result rows are assembled.
// The snapshot is also returned to the caller so NutritionStandardsDomain
// can pass it to useStandardsStore.setStandards() without a second pass.

export function buildSnapshot(
  evaluation: NutritionEvaluation,
  ctx: RuntimeContext,
  conditionKey: ConditionKey,
  variantKey: string
): EvaluationSnapshot {
  const contextVars: Record<string, number> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (typeof v === "number" && isFinite(v)) {
      contextVars[k] = v;
    }
  }

  return {
    evaluatedAt:  new Date().toISOString(),
    conditionKey,
    variantKey,
    eeSource:     evaluation.eeSource,
    weightUsedKg: evaluation.weightUsed,
    weightLabel:  evaluation.weightLabel,
    isPediatric:  evaluation.isPediatric,
    results:      evaluation.results,
    flags:        evaluation.flags,
    contextVars,
  };
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
//
// Milestone 1 return type change:
//   Now returns { evaluation, snapshot } instead of just NutritionEvaluation.
//   NutritionStandardsDomain reads .evaluation for the chart and passes
//   .snapshot to useStandardsStore.setStandards() for autosave.

export interface EvaluateResult {
  evaluation: NutritionEvaluation;
  snapshot: EvaluationSnapshot;
}

export function evaluateNutritionRx(opts: EvalOptions): EvaluateResult {
  const { variant, patient, currentRx, extraInputs = {} } = opts;
  const condition: ConditionKey = opts.condition === "cancer" ? "oncology" : opts.condition;

  const sexRaw = (patient as any).sex as "M" | "F" | "";
  const sex: "M" | "F" = sexRaw === "F" ? "F" : "M";

  const { wtKg, htCm, ageYears, bmi, icMeasuredKcal, icCaf, weightLabel } = patient;
  const ageDays: number = (patient as any).ageDays ?? ageYears * 365.25;
  const isPeds = isPedsAge(ageYears);

  const ibwKg = calcIBW(htCm, sex);
  const ree   = calcMSJ(wtKg, htCm, ageYears, sex);

  // ── Build RuntimeContext ──────────────────────────────────────────────────
  const ctx = buildRuntimeContext(opts, sex);

  // ── IC override pre-computation ──────────────────────────────────────────
  const useIC       = !!icMeasuredKcal && icMeasuredKcal > 0;
  const activeIcCaf = icCaf || 1.0;
  const icFloor     = useIC ? icMeasuredKcal * activeIcCaf        : 0;
  const icCeiling   = useIC ? icMeasuredKcal * (activeIcCaf + 0.1) : 0;

  // ── Bridge: SharedEvalContext for sub-engines ─────────────────────────────
  // Sub-engines still receive the old shape. Migrating them to RuntimeContext
  // directly is a future pass (the switch cases are unchanged for Milestone 1).
  const sharedCtx: SharedEvalContext = {
    wtKg:        ctx.$wtKg,
    htCm:        ctx.$htCm,
    ageYears:    ctx.$ageYears,
    ageDays:     ctx.$ageDays,
    sex,
    bmi:         ctx.$bmi,
    ibwKg:       ctx.$ibwKg,
    ree,
    useIC,
    icFloor,
    icCeiling,
    activeIcCaf,
  };

  // ── Delegate to the correct sub-engine ───────────────────────────────────
  const cr: ConditionResult = isPeds
    ? evaluatePedsCondition({ ...opts, condition }, sharedCtx)
    : evaluateAdultCondition({ ...opts, condition }, sharedCtx);

  // ── IC global override ────────────────────────────────────────────────────
  let { kcalLow, kcalHigh, eeKcal, eeSource, cafUsed } = cr;
  if (useIC) {
    eeKcal   = icFloor;
    eeSource = "IC";
    cafUsed  = activeIcCaf;
    kcalLow  = icFloor;
    kcalHigh = icCeiling;
  }

  const { protLow, protHigh, protFixed, fluidLow, fluidHigh, fluidNote,
          wtForKcal, wtLabel, wtForProt, afUsed, flags } = cr;

  // ── Build result rows ─────────────────────────────────────────────────────
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

  // ── Assemble NutritionEvaluation ──────────────────────────────────────────
  const evaluation: NutritionEvaluation = {
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

  // ── Build EvaluationSnapshot ──────────────────────────────────────────────
  const snapshot = buildSnapshot(evaluation, ctx, condition, variant || "");

  return { evaluation, snapshot };
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
  { label: "Sedentary",         af: 1.2,   description: "Little or no activity; bed rest" },
  { label: "Lightly active",    af: 1.375, description: "Light exercise 1–3 days/week" },
  { label: "Moderately active", af: 1.55,  description: "Moderate exercise 3–5 days/week" },
  { label: "Very active",       af: 1.725, description: "Hard exercise 6–7 days/week" },
  { label: "Extra active",      af: 1.9,   description: "Very hard exercise / physical job" },
];
