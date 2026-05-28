// src/features/assessment/assess-standards/nutritionStandards.ts
// Condition-driven nutrition evaluation engine
// IBW: Hamwi method | Kcal: MSJ (REE×AF) or IC×CAF | Evaluation: LOW / WNL / HIGH

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvalStatus = "LOW" | "WNL" | "HIGH" | "N/A";

export interface PatientInputs {
  wtKg: number;
  htCm: number;
  ageYears: number;
  sex: "M" | "F";
  bmi: number;
  weightLabel?: string;
  // Optional overrides
  dryWtKg?: number;
  icMeasuredKcal?: number; // If IC available, bypass MSJ
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
  reeKcal: number; // MSJ REE (always calculated even if IC used)
  eeKcal: number;  // Final energy expenditure used (IC or MSJ×AF)
  eeSource: "IC" | "MSJ×AF" | "MSJ×CAF";
  afUsed?: number;
  cafUsed?: number;
  weightUsed: number;
  weightLabel: string;
  results: EvalResult[];
  flags: string[];
}

// ─── Condition Config Types ───────────────────────────────────────────────────

export type KcalMethod = "weight_based" | "ree_multiplier" | "ic_preferred" | "fixed_grams";

export interface KcalRule {
  method: KcalMethod;
  kcalPerKgLow?: number;
  kcalPerKgHigh?: number;
  reeMultiplierLow?: number;
  reeMultiplierHigh?: number;
  fixedKcal?: number;
  useWeight: "actual" | "ibw" | "dry";
  af?: number; // Activity factor for MSJ when IC not used
  cafLow?: number;
  cafHigh?: number;
  note?: string;
}

export interface ProteinRule {
  gPerKgLow: number;
  gPerKgHigh: number;
  useWeight: "actual" | "ibw";
  fixedGPerDay?: number; // overrides g/kg (e.g. pregnancy 71g)
  note?: string;
}

export interface FluidRule {
  mlPerKgLow?: number;
  mlPerKgHigh?: number;
  fixedMlPerDay?: number;
  fixedMlPerDayHigh?: number;
  note?: string;
}

// ─── Condition Sub-variant keys ───────────────────────────────────────────────

export type AKIVariant = "no_dialysis" | "dialysis" | "crrt";
export type CancerVariant = "inactive" | "repletion" | "stressed" | "cachexia";
export type CKDVariant = "vlcd" | "lcd" | "lcd_dm";
export type KidneyTxVariant = "acute" | "chronic" | "chronic_dm";
export type LiverTxVariant = "acute" | "chronic";
export type CriticalVariant = "bmi_lt30" | "bmi_30_50" | "bmi_gt50";
export type PressureInjuryVariant = "stage_1_2" | "stage_3_4";
export type PancreatitisSeverity = "mild_moderate" | "severe_critical";
export type BurnsVariant = "moderate" | "large";
export type PregnancyTrimester = "t1" | "t2_t3_uw" | "t2_t3_nw" | "t2_t3_ow" | "t2_t3_ob";
export type CirrhosisVariant = "standard" | "critical";

export type ConditionKey =
  | "aki"
  | "acute_pancreatitis"
  | "breastfeeding"
  | "burns"
  | "cancer"
  | "ckd_3_5"
  | "ckd_5d"
  | "kidney_transplant"
  | "copd"
  | "cirrhosis"
  | "liver_transplant"
  | "critical_illness"
  | "pregnancy"
  | "pressure_injuries"
  | "trauma"
  | "healthy";

// ─── Hamwi IBW ────────────────────────────────────────────────────────────────

export function calcIBW(htCm: number, sex: "M" | "F"): number {
  const htIn = htCm / 2.54;
  const inchesOver5Ft = Math.max(0, htIn - 60);
  const base = sex === "M" ? 48.1 : 45.4;
  const perInch = sex === "M" ? 2.72 : 2.27;
  return Math.round((base + perInch * inchesOver5Ft) * 10) / 10;
}

// ─── MSJ REE ─────────────────────────────────────────────────────────────────

export function calcMSJ(wtKg: number, htCm: number, ageYears: number, sex: "M" | "F"): number {
  if (sex === "M") return 10 * wtKg + 6.25 * htCm - 5 * ageYears + 5;
  return 10 * wtKg + 6.25 * htCm - 5 * ageYears - 161;
}

// ─── Evaluation helper ────────────────────────────────────────────────────────

function evalStatus(current: number, low: number, high: number): EvalStatus {
  if (current < low) return "LOW";
  if (current > high) return "HIGH";
  return "WNL";
}

function fmtRange(low: number, high: number, unit: string): string {
  if (low === high) return `${Math.round(low)} ${unit}`;
  return `${Math.round(low)}–${Math.round(high)} ${unit}`;
}

// ─── Condition Registry ───────────────────────────────────────────────────────

export const CONDITION_LABELS: Record<ConditionKey, string> = {
  aki: "AKI (Acute Kidney Injury)",
  acute_pancreatitis: "Acute Pancreatitis",
  breastfeeding: "Breastfeeding",
  burns: "Burns (>20% TBSA)",
  cancer: "Cancer",
  ckd_3_5: "CKD Stages 3–5 (Pre-dialysis)",
  ckd_5d: "CKD Stage 5D (HD / PD)",
  kidney_transplant: "Kidney Transplant",
  copd: "COPD",
  cirrhosis: "Cirrhosis",
  liver_transplant: "Liver Transplant",
  critical_illness: "Critical Illness",
  pregnancy: "Pregnancy",
  pressure_injuries: "Pressure Injuries",
  trauma: "Trauma",
  healthy: "Healthy / Preventive",
};

// Sub-variant labels per condition
export const CONDITION_VARIANTS: Partial<Record<ConditionKey, { key: string; label: string }[]>> = {
  aki: [
    { key: "no_dialysis", label: "No Dialysis / Non-catabolic" },
    { key: "dialysis", label: "Dialysis / Catabolic" },
    { key: "crrt", label: "CRRT / Critical" },
  ],
  acute_pancreatitis: [
    { key: "mild_moderate", label: "Mild–Moderate" },
    { key: "severe_critical", label: "Severe / Critical" },
  ],
  breastfeeding: [
    { key: "t1", label: "0–6 months postpartum" },
    { key: "t2_t3_nw", label: "7–12 months postpartum" },
  ],
  burns: [
    { key: "moderate", label: "20–40% TBSA" },
    { key: "large", label: ">40% TBSA" },
  ],
  cancer: [
    { key: "inactive", label: "Inactive / Maintenance" },
    { key: "repletion", label: "Repletion" },
    { key: "stressed", label: "Stressed / Hypermetabolic" },
    { key: "cachexia", label: "Cachexia" },
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
    { key: "bmi_30_50", label: "BMI 30–50" },
    { key: "bmi_gt50", label: "BMI > 50" },
  ],
  pregnancy: [
    { key: "t1", label: "Trimester 1" },
    { key: "t2_t3_uw", label: "Tri 2/3 – Underweight (BMI <18.5)" },
    { key: "t2_t3_nw", label: "Tri 2/3 – Normal Weight (BMI 18.5–24.9)" },
    { key: "t2_t3_ow", label: "Tri 2/3 – Overweight (BMI 25–29.9)" },
    { key: "t2_t3_ob", label: "Tri 2/3 – Obese (BMI ≥30)" },
  ],
  pressure_injuries: [
    { key: "stage_1_2", label: "Stage 1–2" },
    { key: "stage_3_4", label: "Stage 3–4" },
  ],
};

// Extra condition-specific inputs needed beyond the base patient data
export const CONDITION_EXTRA_INPUTS: Partial<Record<ConditionKey, { key: string; label: string; type: "number" | "select"; options?: string[] }[]>> = {
  ckd_5d: [
    { key: "urineOutputMlDay", label: "Urine Output (mL/day)", type: "number" },
  ],
  burns: [
    { key: "tbsaPct", label: "TBSA (%)", type: "number" },
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
  const { condition, variant, patient, currentRx, extraInputs = {} } = opts;
  const { wtKg, htCm, ageYears, sex, bmi, dryWtKg, icMeasuredKcal, weightLabel } = patient;

  const ibwKg = calcIBW(htCm, sex);
  const ree = calcMSJ(wtKg, htCm, ageYears, sex);

  const results: EvalResult[] = [];
  const flags: string[] = [];

  // ── Defaults (overridden per condition) ──────────────────────────────────
  let kcalLow = 0, kcalHigh = 0;
  let protLow = 0, protHigh = 0;
  let fluidLow: number | null = null, fluidHigh: number | null = null;
  let fluidNote = "";
  let wtForKcal = wtKg;
  let wtLabel = weightLabel || "Actual Wt";
  let wtForProt = wtKg;
  let eeKcal = ree; // default
  let eeSource: NutritionEvaluation["eeSource"] = "MSJ×AF";
  let afUsed: number | undefined;
  let cafUsed: number | undefined;
  let protFixed: number | null = null;
  let kcalFixed: number | null = null; // for fixed absolute values

  // ── Condition Logic ───────────────────────────────────────────────────────

  switch (condition) {

    case "healthy": {
      afUsed = Number(extraInputs.pal) || 2.0;
      eeKcal = ree * afUsed;
      eeSource = "MSJ×AF";
      kcalLow = Math.max(0, eeKcal * 0.925);
      kcalHigh = eeKcal * 1.075;
      
      // Protein adjustment based on PAL
      if (afUsed >= 2.15) {
        protLow = wtKg * 1.8; protHigh = wtKg * 2.2;
        flags.push("Elite endurance detected: protein targets increased to 1.8–2.2 g/kg.");
      } else if (afUsed >= 1.9) {
        protLow = wtKg * 1.5; protHigh = wtKg * 1.8;
        flags.push("High-volume endurance detected: protein targets increased to 1.5–1.8 g/kg.");
      } else if (afUsed >= 1.6) {
        protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
      } else {
        protLow = wtKg * 0.8; protHigh = wtKg * 1.2;
      }

      fluidLow = wtKg * 30;
      fluidHigh = wtKg * 35;
      break;
    }

    case "aki": {
      wtForKcal = wtKg; 
      if (icMeasuredKcal) {
        cafUsed = 1.0; eeKcal = icMeasuredKcal * cafUsed;
        eeSource = "IC";
        kcalLow = eeKcal * 1.0; kcalHigh = eeKcal * 1.3;
      } else {
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 20; kcalHigh = wtKg * 30;
      }
      flags.push("⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.");

      if (variant === "no_dialysis") { protLow = wtKg * 0.8; protHigh = wtKg * 1.0; }
      else if (variant === "dialysis") { protLow = wtKg * 1.0; protHigh = wtKg * 1.5; }
      else if (variant === "crrt") {
        protLow = wtKg * 1.7; protHigh = wtKg * 2.5;
        fluidNote = "Fluid unrestricted during CRRT";
      }
      else { protLow = wtKg * 0.8; protHigh = wtKg * 1.5; }
      break;
    }

    case "acute_pancreatitis": {
      wtForKcal = wtKg;
      if (icMeasuredKcal) {
        cafUsed = 1.0; eeKcal = icMeasuredKcal * cafUsed; eeSource = "IC";
        kcalLow = eeKcal * 1.0; kcalHigh = eeKcal * 1.1;
        flags.push("IC preferred for pancreatitis — recalculate regularly.");
      } else {
        afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      }
      if (variant === "severe_critical") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else { protLow = wtKg * 1.2; protHigh = wtKg * 1.5; }
      break;
    }

    case "breastfeeding": {
      wtForKcal = wtKg;
      // TEE estimated as MSJ × 1.5 (average active new mother)
      afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      const tee = eeKcal;
      if (variant === "t1") { // 0-6 mo
        kcalLow = tee + 380; kcalHigh = tee + 420;
      } else { // 7-12 mo
        kcalLow = tee + 360; kcalHigh = tee + 400;
      }
      protFixed = 71; protLow = 71; protHigh = 71;
      fluidFixed(3800); fluidNote = "AI target 3.8 L/day for breastfeeding";
      function fluidFixed(val: number) { fluidLow = val; fluidHigh = val; }
      break;
    }

    case "burns": {
      wtForKcal = wtKg;
      if (icMeasuredKcal) {
        cafUsed = 1.0; eeKcal = icMeasuredKcal; eeSource = "IC";
        kcalLow = eeKcal; kcalHigh = eeKcal * 1.1;
        flags.push("IC recommended weekly in burns — energy needs change rapidly.");
      } else {
        afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        flags.push("IC strongly preferred for burns. MSJ×AF used as fallback.");
      }
      if (variant === "large") { protLow = wtKg * 3.0; protHigh = wtKg * 4.0; }
      else { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      fluidNote = "Strict I/O monitoring required; fluid driven by resuscitation protocol.";
      break;
    }

    case "cancer": {
      wtForKcal = wtKg;
      if (icMeasuredKcal) {
        cafUsed = 1.1; eeKcal = icMeasuredKcal * cafUsed; eeSource = "IC";
        kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
      } else {
        afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        if (variant === "inactive") { kcalLow = wtKg * 25; kcalHigh = wtKg * 30; }
        else if (variant === "repletion") { kcalLow = wtKg * 30; kcalHigh = wtKg * 35; }
        else if (variant === "stressed" || variant === "cachexia") { kcalLow = wtKg * 35; kcalHigh = wtKg * 35; }
        else { kcalLow = wtKg * 25; kcalHigh = wtKg * 35; }
      }
      if (variant === "cachexia") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else { protLow = wtKg * 1.0; protHigh = wtKg * 1.5; }
      break;
    }

    case "ckd_3_5": {
      wtForKcal = wtKg;
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      if (variant === "vlcd") { protLow = wtKg * 0.28; protHigh = wtKg * 0.43; }
      else if (variant === "lcd_dm") { protLow = wtKg * 0.60; protHigh = wtKg * 0.80; }
      else { protLow = wtKg * 0.55; protHigh = wtKg * 0.60; }
      fluidNote = "Fluid individualized — monitor edema, urine output, and electrolytes.";
      break;
    }

    case "ckd_5d": {
      wtForKcal = wtKg;
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      protLow = wtKg * 1.0; protHigh = wtKg * 1.2;
      const urineOut = Number(extraInputs.urineOutputMlDay || 0);
      if (variant === "pd") {
        fluidLow = 1000; fluidHigh = 3000;
        fluidNote = "PD: 1000–3000 mL/day individualized.";
      } else {
        if (urineOut >= 1000) { fluidLow = 2000; fluidHigh = 2000; fluidNote = "Urine output ≥1L → 2000 mL/day"; }
        else if (urineOut > 0) { fluidLow = 1000; fluidHigh = 1500; fluidNote = "Urine output <1L → 1000–1500 mL/day"; }
        else { fluidNote = "Oliguria: restrict to 24h urine volume + 750 mL. Enter urine output above."; }
      }
      break;
    }

    case "kidney_transplant": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      if (variant === "acute") {
        wtForKcal = wtKg;
        kcalLow = Math.min(wtKg * 30, ree * 1.3);
        kcalHigh = Math.max(wtKg * 35, ree * 1.5);
        protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
      } else {
        wtForKcal = wtKg;
        kcalLow = wtKg * 25; kcalHigh = wtKg * 30;
        if (variant === "chronic_dm") { protLow = wtKg * 0.8; protHigh = wtKg * 0.9; }
        else { protLow = wtKg * 0.6; protHigh = wtKg * 0.8; }
      }
      fluidNote = "Fluid unrestricted post-transplant unless clinical indication.";
      break;
    }

    case "copd": {
      wtForKcal = wtKg;
      afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 30; kcalHigh = wtKg * 30;
      protLow = wtKg * 1.0; protHigh = wtKg * 1.5;
      if (bmi >= 30) flags.push("⚠ COPD with obesity: adjust targets for obese weight if clinically indicated.");
      break;
    }

    case "cirrhosis": {
      const baseWt = dryWtKg || wtKg;
      wtForKcal = baseWt; 
      if (!weightLabel) {
        wtLabel = dryWtKg ? "Dry Wt" : "Actual Wt (no dry wt entered)";
      }
      
      if (icMeasuredKcal) {
        cafUsed = 1.0; eeKcal = icMeasuredKcal * cafUsed;
        eeSource = "IC";
        kcalLow = eeKcal * 1.0; kcalHigh = eeKcal * 1.2; // Standard cirrhosis IC target
      } else {
        afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        kcalLow = baseWt * 30; kcalHigh = baseWt * 35;
      }

      if (variant === "critical") { protLow = baseWt * 1.5; protHigh = baseWt * 2.0; }
      else { protLow = baseWt * 1.0; protHigh = baseWt * 1.5; }
      fluidLow = baseWt * 30; fluidHigh = baseWt * 35;
      fluidNote = "Restrict fluids for hypervolemic hyponatremia.";
      if (!dryWtKg && !weightLabel) flags.push("⚠ Cirrhosis: use dry weight for targets — enter in inputs for accurate calculation.");
      flags.push("ℹ Do NOT restrict protein in cirrhosis (outdated practice). Adequate intake prevents sarcopenia.");
      break;
    }

    case "liver_transplant": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      wtForKcal = wtKg;
      if (variant === "acute") {
        kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
        protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
      } else { // chronic
        if (icMeasuredKcal) {
          cafUsed = 1.0; eeKcal = icMeasuredKcal; eeSource = "IC";
          kcalLow = eeKcal * 1.0; kcalHigh = eeKcal * 1.3;
        } else {
          kcalLow = ree * 1.0; kcalHigh = ree * 1.3;
          flags.push("Chronic liver transplant: target is REE×1.0–1.3. MSJ used as REE estimate.");
        }
        protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
      }
      fluidLow = wtKg * 30; fluidHigh = wtKg * 35;
      break;
    }

    case "critical_illness": {
      let bmiGroup = bmi < 30 ? "bmi_lt30" : bmi <= 50 ? "bmi_30_50" : "bmi_gt50";
      const activeVariant = variant || bmiGroup;

      if (icMeasuredKcal) {
        cafUsed = 1.0; eeKcal = icMeasuredKcal; eeSource = "IC";
        kcalLow = eeKcal * 0.8; kcalHigh = eeKcal * 1.0;
        flags.push("IC preferred in critical illness. Full feeds typically initiated after day 2–3.");
      } else {
        eeSource = "MSJ×AF";
        afUsed = 1.2;
        flags.push("IC preferred in critical illness. MSJ×AF used as fallback.");
        if (activeVariant === "bmi_lt30") {
          wtForKcal = wtKg;
          kcalLow = wtKg * 12; kcalHigh = wtKg * 25;
          flags.push("BMI <30: 12–25 kcal/kg in first 7–10 days (hypocaloric early feeding). Advance to 25–30 after.");
        } else if (activeVariant === "bmi_30_50") {
          wtForKcal = wtKg;
          kcalLow = wtKg * 11; kcalHigh = wtKg * 14;
          flags.push("Obese critical illness (BMI 30–50): permissive underfeeding 11–14 kcal/kg actual wt.");
        } else { // bmi_gt50
          wtForKcal = ibwKg; wtLabel = "IBW (Hamwi)";
          kcalLow = ibwKg * 22; kcalHigh = ibwKg * 25;
          flags.push("Severely obese (BMI >50): 22–25 kcal/kg IBW.");
        }
        eeKcal = ree * afUsed;
      }

      // Protein by BMI group regardless of IC
      wtForProt = wtKg;
      if (bmi < 30) { protLow = wtKg * 1.2; protHigh = wtKg * 2.0; }
      else if (bmi < 40) { wtForProt = ibwKg; protLow = ibwKg * 2.0; protHigh = ibwKg * 2.0; flags.push("Protein: 2.0 g/kg IBW for BMI 30–39.9"); }
      else { wtForProt = ibwKg; protLow = ibwKg * 2.5; protHigh = ibwKg * 2.5; flags.push("Protein: 2.5 g/kg IBW for BMI ≥40"); }
      break;
    }

    case "pregnancy": {
      // TEE estimate: MSJ × 1.4 (light activity)
      afUsed = 1.4; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      wtForKcal = wtKg;
      if (variant === "t1") {
        kcalLow = eeKcal; kcalHigh = eeKcal;
        flags.push("T1: No additional caloric intake above non-pregnant EER.");
      } else {
        const addOn = variant === "t2_t3_uw" ? 300 : variant === "t2_t3_nw" ? 200 : variant === "t2_t3_ow" ? 150 : -50;
        kcalLow = eeKcal + addOn; kcalHigh = eeKcal + addOn + 50;
        if (addOn < 0) flags.push("Obese pregnancy: slight caloric restriction may apply — individualize.");
      }
      protFixed = 71; protLow = 71; protHigh = 71;
      break;
    }

    case "pressure_injuries": {
      wtForKcal = wtKg;
      afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
      if (variant === "stage_3_4") { protLow = wtKg * 1.5; protHigh = wtKg * 2.0; }
      else { protLow = wtKg * 1.2; protHigh = wtKg * 1.5; }
      // Fluid: 30 mL/kg OR 1.0-1.5 mL/kcal
      const prescribedKcal = Number(extraInputs.targetKcal || 0);
      fluidLow = wtKg * 30;
      fluidHigh = prescribedKcal > 0 ? prescribedKcal * 1.5 : wtKg * 35;
      fluidNote = "Target 30 mL/kg/day OR 1.0–1.5 mL/kcal prescribed.";
      break;
    }

    case "trauma": {
      wtForKcal = wtKg;
      afUsed = 1.4; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 20; kcalHigh = wtKg * 35;
      protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
      flags.push("Trauma protein may exceed 2.0 g/kg in severe/polytrauma — individualize.");
      break;
    }
  }

  // ─── Build result rows ───────────────────────────────────────────────────

  if (kcalLow > 0 && kcalHigh > 0) {
    results.push({
      label: "Energy",
      target: fmtRange(kcalLow, kcalHigh, "kcal/day"),
      current: currentRx.kcalPerDay,
      unit: "kcal/day",
      status: evalStatus(currentRx.kcalPerDay, kcalLow, kcalHigh),
      note: eeSource === "IC" 
        ? `Based on Indirect Calorimetry (${icMeasuredKcal} kcal)`
        : `Based on ${wtLabel} (${Math.round(wtForKcal)} kg)`,
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
        : `Based on ${bmi < 30 || condition !== "critical_illness" ? wtLabel : wtForProt === ibwKg ? "IBW (Hamwi)" : wtLabel} (${Math.round(wtForProt)} kg)`,
    });
  }
  if (fluidLow !== null && fluidHigh !== null && currentRx.fluidMlPerDay !== undefined) {
    results.push({
      label: "Fluid",
      target: fmtRange(fluidLow!, fluidHigh!, "mL/day"),
      current: currentRx.fluidMlPerDay,
      unit: "mL/day",
      status: evalStatus(currentRx.fluidMlPerDay, fluidLow!, fluidHigh!),
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

// ─── IC Activity Factor Reference Table ──────────────────────────────────────
// For IC fallback documentation in the UI

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