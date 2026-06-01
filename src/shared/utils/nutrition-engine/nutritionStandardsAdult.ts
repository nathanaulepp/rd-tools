// src/features/assessment/assess-standards/nutritionStandardsAdult.ts
//
// Adult condition evaluation engine.
// Called exclusively by evaluateNutritionRx() in nutritionStandards.ts when isPeds === false.
// Do NOT import this file from UI components — always go through the barrel (nutritionStandards.ts).

import type { EvalOptions } from "../../../types/standards";
import type { SharedEvalContext, ConditionResult } from "../../../types/nutritionEngine";
import {
  calcIBW,
  calcMSJ,
  calcHarrisBenedict,
  calcFleischBMR,
  calcBSA,
  calcPSU2003b,
  calcPSU2010,
  calcToronto,
  calcCFBMR,
  calcHolidaySegar,
} from "./nutritionStandardsMath";

// ─── Internal helpers ─────────────────────────────────────────────────────────

// ─── AKI helpers (inlined from adultDiseaseMath.ts) ──────────────────────────

function calculateAdultAKIEnergy(opts: {
  wtKg: number;
  htCm: number;
  ageYears: number;
  sex: "M" | "F";
  isHypermetabolic?: boolean;
  isOnCRRT?: boolean;
}): { min: number; max: number } {
  const { wtKg, htCm, ageYears, sex, isHypermetabolic, isOnCRRT } = opts;
  const msj = calcMSJ(wtKg, htCm, ageYears, sex);
  if (isHypermetabolic || isOnCRRT) {
    return { min: msj * 1.2, max: msj * 1.3 };
  }
  return {
    min: Math.min(msj * 1.0, wtKg * 20),
    max: Math.max(msj * 1.1, wtKg * 25),
  };
}

function calculateAdultFluidWithFever(opts: {
  measuredOutputMl: number;
  tmaxC: number;
}): number {
  const { measuredOutputMl, tmaxC } = opts;
  const baselineInsensible = 500;
  const insensible =
    tmaxC <= 37
      ? baselineInsensible
      : baselineInsensible * (1 + (tmaxC - 37) * 0.1);
  return measuredOutputMl + insensible;
}

// ─── Adult Evaluation Engine ──────────────────────────────────────────────────

export function evaluateAdultCondition(
  opts: EvalOptions,
  ctx: SharedEvalContext
): ConditionResult {
  const { variant, currentRx, extraInputs = {} } = opts;
  const {
    wtKg, htCm, ageYears, ageDays, sex, bmi,
    ibwKg, ree,
    useIC, icFloor, icCeiling, activeIcCaf,
  } = ctx;

  const condition = opts.condition === "cancer" ? "oncology" : opts.condition;

  let kcalLow = 0, kcalHigh = 0;
  let protLow = 0, protHigh = 0;
  let protFixed: number | null = null;
  let fluidLow: number | null = null, fluidHigh: number | null = null;
  let fluidNote = "";
  let wtForKcal = wtKg;
  let wtLabel = "Actual Wt";
  let wtForProt = wtKg;
  let eeKcal = ree;
  let eeSource: ConditionResult["eeSource"] = "MSJ×AF";
  let afUsed: number | undefined;
  let cafUsed: number | undefined;
  const flags: string[] = [];

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
      break;
    }

    // ── ACUTE PANCREATITIS ────────────────────────────────────────────────────
    case "acute_pancreatitis": {
      eeSource = "MSJ×AF";
      if (variant === "severe_critical") {
        afUsed = 1.35; eeKcal = ree * afUsed;
        kcalLow = ree * 1.2; kcalHigh = ree * 1.5;
        protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
        flags.push("Severe/critical pancreatitis: MSJ × 1.2–1.5 stress factor.");
      } else {
        afUsed = 1.15; eeKcal = ree * afUsed;
        kcalLow = ree * 1.1; kcalHigh = ree * 1.2;
        protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        flags.push("Mild–moderate pancreatitis: MSJ × 1.1–1.2. Reserve higher factors for severe/necrotizing cases.");
      }
      if (useIC) flags.push("IC preferred for pancreatitis — recalculate regularly.");
      flags.push("Initiate EN within 72 hours of admission.");
      fluidNote = "DRI (individualize for GI losses)";
      break;
    }

    // ── BREASTFEEDING ─────────────────────────────────────────────────────────
    case "breastfeeding": {
      if (ageYears < 14) {
        flags.push("⚠ MANUAL ASSESSMENT REQUIRED: Patient is an extreme pediatric outlier (age < 14). Standard automated equations are clinically unvalidated for this case.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
        break;
      }
      // Adolescent breastfeeding (14–17y) is handled in the peds engine.
      // This branch handles adults ≥18.
      afUsed = 1.5; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      const addOnBF = variant === "late" ? 330 : 400;
      kcalLow = ree + addOnBF - 20; kcalHigh = ree + addOnBF + 20;
      flags.push(`Lactation energy addition: +${addOnBF} kcal/day above non-pregnant EER (${variant === "late" ? "7–12 months" : "0–6 months"}).`);
      protFixed = 71; protLow = 71; protHigh = 71;
      fluidLow = 3800; fluidHigh = 3800;
      fluidNote = "AI target 3.8 L/day for breastfeeding";
      break;
    }

    // ── BURNS ─────────────────────────────────────────────────────────────────
    case "burns": {
      const tbsa = Number(extraInputs.tbsaPct) || 0;
      const bsa = calcBSA(htCm, wtKg);
      const pbd = Number(extraInputs.pbd) || 0;
      const useToronto = variant === "adult_toronto";

      if (useToronto) {
        const caloricIntake = Number(extraInputs.caloricIntake) || currentRx.kcalPerDay || 0;
        const coreTempC = Number(extraInputs.coreTemp) || 37.0;
        const hbe = calcHarrisBenedict(wtKg, htCm, ageYears, sex);
        const torontoKcal = calcToronto(tbsa, caloricIntake, hbe, coreTempC, pbd);
        eeKcal = Math.max(torontoKcal, wtKg * 20);
        eeSource = "Milner"; // reuse slot; displayed as Toronto in flags
        kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
        flags.push(`Toronto Formula: −4343 + 10.5×${tbsa} + 0.23×${Math.round(caloricIntake)} + 0.84×HBE(${Math.round(hbe)}) + 114×${coreTempC}°C − 4.5×${pbd} = ${Math.round(eeKcal)} kcal.`);
        flags.push("Toronto equation preferred: limits glucose to ≤5 mg/kg/min, preventing hepatic steatosis and hypercapnia.");
        if (!tbsa) flags.push("Enter TBSA%, core temperature, and current caloric intake for Toronto equation.");
      } else {
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

      if (useIC) flags.push("IC strongly recommended for burns — recalculate frequently.");
      fluidNote = "Parkland formula / physiological endpoints — strict I/O monitoring required.";
      break;
    }

    // ── ONCOLOGY ─────────────────────────────────────────────────────────────
    case "oncology": {
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
      fluidNote = "DRI; adjust for nephrotoxic agents and GI losses.";
      break;
    }

    // ── CKD 3–5 ──────────────────────────────────────────────────────────────
    case "ckd_3_5": {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      if (variant === "vlpd") {
        protLow = wtKg * 0.28; protHigh = wtKg * 0.43;
        flags.push("VLPD + keto-analog supplementation: 0.28–0.43 g/kg/day protein.");
      } else if (variant === "lcd_dm") {
        protLow = wtKg * 0.60; protHigh = wtKg * 0.80;
        flags.push("Low-protein diet + diabetes: 0.60–0.80 g/kg/day.");
      } else {
        protLow = wtKg * 0.55; protHigh = wtKg * 0.60;
        flags.push("Pre-dialysis protein restriction: 0.55–0.60 g/kg/day to balance uremic control with protein-energy wasting risk.");
      }
      fluidNote = "Fluid individualized — monitor edema, urine output, and electrolytes.";
      break;
    }

    // ── CKD 5D ───────────────────────────────────────────────────────────────
    case "ckd_5d": {
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
      const urineOut5d = Number(extraInputs.urineOutputMlDay || 0);
      if (variant === "pd") {
        fluidLow = 1000; fluidHigh = 3000; fluidNote = "PD: 1000–3000 mL/day individualized.";
      } else {
        if (urineOut5d >= 1000) { fluidLow = 2000; fluidHigh = 2000; fluidNote = "Urine ≥1L → 2000 mL/day"; }
        else if (urineOut5d > 0) { fluidLow = 1000; fluidHigh = 1500; fluidNote = "Urine <1L → 1000–1500 mL/day"; }
        else { fluidNote = "Oliguria: restrict to 24h urine + 750 mL. Enter urine output above."; }
      }
      break;
    }

    // ── KIDNEY TRANSPLANT ─────────────────────────────────────────────────────
    case "kidney_transplant": {
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
      break;
    }

    // ── COPD ─────────────────────────────────────────────────────────────────
    case "copd": {
      afUsed = 1.175; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = ree * 1.15; kcalHigh = ree * 1.20;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.5;
      fluidNote = "DRI; restrict if cor pulmonale or pulmonary edema present.";
      flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.15–1.20 hypermetabolic factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
      flags.push("Monitor respiratory quotient (RQ): avoid overfeeding-induced hypercapnic respiratory failure (RQ target ≤1.0).");
      if (bmi >= 30) flags.push("⚠ COPD with obesity: adjust targets; consider impact on respiratory quotient.");
      break;
    }

    // ── CIRRHOSIS ─────────────────────────────────────────────────────────────
    case "cirrhosis": {
      if (useIC) {
        eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
        kcalLow = icFloor; kcalHigh = icCeiling;
      } else {
        afUsed = 1.3; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
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
      break;
    }

    // ── LIVER TRANSPLANT ──────────────────────────────────────────────────────
    case "liver_transplant": {
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
      break;
    }

    // ── CRITICAL ILLNESS ──────────────────────────────────────────────────────
    case "critical_illness": {
      const isMechVent = extraInputs.isMechVent === "true" || extraInputs.isMechVent === 1;
      const tmaxF = Number(extraInputs.tempMax) || 0;
      const ve = Number(extraInputs.ve) || 0;
      const bmiGroup = bmi < 30 ? "bmi_lt30" : bmi <= 50 ? "bmi_30_50" : "bmi_gt50";
      const activeVariant = variant || bmiGroup;
      const isObeseOver60 = bmi >= 30 && ageYears >= 60;

      if (useIC) {
        eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
        kcalLow = icFloor; kcalHigh = icCeiling;
        flags.push("IC is the clinical gold standard. Full feeds typically initiated after day 2–3.");
      } else if (isMechVent && tmaxF > 0 && ve > 0) {
        if (isObeseOver60) {
          const psuKcal = calcPSU2010(ree, tmaxF, ve);
          eeKcal = Math.max(psuKcal, 0); eeSource = "PSU 2010";
          kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
          const tmaxC = ((tmaxF - 32) * 5 / 9).toFixed(1);
          flags.push(`PSU 2010 (obese ≥60): MSJ(${Math.round(ree)}) × 0.71 + Ve(${ve}) × 64 + ${tmaxC}°C × 85 − 3085 = ${Math.round(eeKcal)} kcal.`);
          flags.push("PSU 2010 selected: patient is obese (BMI ≥30) and ≥60 years old.");
        } else if (activeVariant === "bmi_lt30") {
          const psuKcal = calcPSU2003b(ree, tmaxF, ve);
          eeKcal = Math.max(psuKcal, 0); eeSource = "PSU 2003b";
          kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
          const tmaxC = ((tmaxF - 32) * 5 / 9).toFixed(1);
          flags.push(`PSU 2003b: MSJ(${Math.round(ree)}) × 0.96 + ${tmaxC}°C × 167 + ${ve}L/min × 31 − 6212 = ${Math.round(eeKcal)} kcal.`);
        } else {
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
      break;
    }

    // ── PREGNANCY ─────────────────────────────────────────────────────────────
    case "pregnancy": {
      if (ageYears < 14) {
        flags.push("⚠ MANUAL ASSESSMENT REQUIRED: Patient is an extreme pediatric outlier (age < 14). Calculate manually.");
        kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
        break;
      }
      // Adolescent pregnancy (14–17y) is handled in the peds engine.
      afUsed = 1.4; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      let addOnPreg = 0;
      if (variant === "t2") addOnPreg = 340;
      else if (variant === "t3") addOnPreg = 452;
      else flags.push("Trimester 1: no additional calories above non-pregnant EER.");
      kcalLow = ree * afUsed + addOnPreg; kcalHigh = ree * afUsed + addOnPreg + 50;
      protFixed = 71; protLow = 71; protHigh = 71;
      fluidLow = 3000; fluidHigh = 3000;
      fluidNote = "3 L/day total (beverages + food moisture)";
      break;
    }

    // ── PRESSURE INJURIES ─────────────────────────────────────────────────────
    case "pressure_injuries": {
      afUsed = 1.25; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = ree * 1.2; kcalHigh = ree * 1.3;
      if (variant === "stage_3_4") {
        protLow = wtKg * 1.5; protHigh = wtKg * 2.0;
      } else {
        protLow = wtKg * 1.25; protHigh = wtKg * 1.5;
      }
      const prescribedKcalPI = Number(extraInputs.targetKcal || 0);
      fluidLow = wtKg * 30;
      fluidHigh = prescribedKcalPI > 0 ? prescribedKcalPI * 1.5 : wtKg * 35;
      fluidNote = "30 mL/kg/day OR 1.0–1.5 mL/kcal prescribed.";
      flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.2–1.3 stress factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
      break;
    }

    // ── TRAUMA ────────────────────────────────────────────────────────────────
    case "trauma": {
      afUsed = 1.35; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = ree * 1.3; kcalHigh = ree * 1.4;
      protLow = wtKg * 1.2; protHigh = wtKg * 2.0;
      flags.push(`MSJ REE (${Math.round(ree)} kcal) × 1.3–1.4 acute phase factor = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
      flags.push("Severe/polytrauma: protein may exceed 2.0 g/kg — individualize. Use IC to track energy expenditure changes.");
      break;
    }

    // ── MASLD / MASH ──────────────────────────────────────────────────────────
    case "masld_mash": {
      if (useIC) {
        eeKcal = icFloor; eeSource = "IC"; cafUsed = activeIcCaf;
        kcalLow = icFloor - 800; kcalHigh = icFloor - 500;
        flags.push("IC preferred for MASLD/MASH. Apply −500 to −800 kcal/day hypocaloric deficit from measured REE.");
      } else {
        afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
        if (variant === "malnourished") {
          kcalLow = wtKg * 30; kcalHigh = wtKg * 35;
          flags.push("Underweight/malnourished/sarcopenic MASLD: 30–35 kcal/kg. Do NOT apply caloric deficit.");
        } else {
          kcalLow = Math.max(eeKcal - 800, wtKg * 20);
          kcalHigh = Math.max(eeKcal - 500, wtKg * 22);
          flags.push(`Hypocaloric deficit: MSJ×AF(${Math.round(eeKcal)}) − 500–800 kcal = ${Math.round(kcalLow)}–${Math.round(kcalHigh)} kcal/day.`);
        }
        if (bmi >= 18.5 && bmi < 35) {
          flags.push("Target 5–10% total body weight loss to improve hepatic outcomes (EASL-EASD-EASO, 2024).");
        }
      }
      protLow = wtKg * 1.5; protHigh = wtKg * 1.8;
      flags.push("Maintain protein ≥1.5 g/kg/day to preserve lean body mass during caloric restriction.");
      fluidNote = "Individualized; restrict if ascites or edema present.";
      break;
    }

    // ── SHORT BOWEL SYNDROME ──────────────────────────────────────────────────
    case "short_bowel": {
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
      if (variant === "adult_standard") {
        flags.push("Adult SBS: individualize sodium and fluid replacement to measured ostomy/stool output.");
      }
      break;
    }

    // ── CYSTIC FIBROSIS ───────────────────────────────────────────────────────
    case "cystic_fibrosis": {
      const fev1CF = Number(extraInputs.fev1Pct) || 100;
      const isPancSufCF = extraInputs.isPancreaticSufficient === "true" || extraInputs.isPancreaticSufficient === 1;
      const cfaCF = Number(extraInputs.cfa) || 0.85;
      let palForCF = 1.5;
      if (variant === "bed") palForCF = 1.3;
      else if (variant === "active") palForCF = 1.7;

      let dfLow: number, dfHigh: number;
      if (fev1CF >= 80) { dfLow = 1.0; dfHigh = 1.1; }
      else if (fev1CF >= 40) { dfLow = 1.1; dfHigh = 1.4; }
      else { dfLow = 1.5; dfHigh = 2.0; }

      const msjAdjLow = ree * dfLow;
      const msjAdjHigh = ree * dfHigh;
      const teeLow = msjAdjLow * palForCF;
      const teeHigh = msjAdjHigh * palForCF;
      const teeAvg = (teeLow + teeHigh) / 2;

      let efficiency = 1.0;
      if (!isPancSufCF) {
        // Weighted absorption model: CFA only applies to fat calories.
        // Pull from global intake store (passed via currentRx).
        const intakeKcal = currentRx.kcalPerDay || teeAvg; 
        const intakeFatG = currentRx.fatGPerDay || (intakeKcal * 0.35 / 9); // Fallback to 35% fat
        const fatKcal = intakeFatG * 9;
        const fatFraction = Math.min(1, fatKcal / Math.max(1, intakeKcal));
        const nonFatFraction = 1 - fatFraction;
        
        // non-fat absorption is assumed 1.0 (100%)
        efficiency = (nonFatFraction * 1.0) + (fatFraction * cfaCF);
        
        flags.push(`Weighted absorption: ${Math.round(fatFraction * 100)}% fat (${Math.round(intakeFatG)}g) @ ${Math.round(cfaCF * 100)}% CFA + ${Math.round(nonFatFraction * 100)}% non-fat @ 100% = ${Math.round(efficiency * 100)}% efficiency.`);
      }

      eeKcal = teeAvg / efficiency;
      kcalLow = teeLow / efficiency;
      kcalHigh = teeHigh / efficiency;

      eeSource = "CF Formula";
      flags.push(`Adult CF: MSJ(${Math.round(ree)}) × DF(${dfLow}–${dfHigh}) × PAL(${palForCF}) = TEE ${Math.round(teeLow)}–${Math.round(teeHigh)} kcal/day.`);
      flags.push(`FEV₁ ${fev1CF}% → Disease Factor ${dfLow}–${dfHigh}. ${fev1CF < 40 ? "Severe airflow obstruction: significant hypermetabolism." : fev1CF < 80 ? "Moderate obstruction: increased energy demands." : "Mild/normal lung function."}`);
      protLow = wtKg * 0.8 * 1.2; protHigh = wtKg * 0.8 * 2.0;
      fluidNote = "DRI";
      break;
    }

    // ── STROKE ────────────────────────────────────────────────────────────────
    case "stroke": {
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
      break;
    }

    // ── HEART FAILURE ─────────────────────────────────────────────────────────
    case "heart_failure": {
      const palHF = Number(extraInputs.pal) || 1.3;
      afUsed = palHF; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
      fluidNote = "Strictly individualized — often fluid restricted. Individualize sodium and fluid restrictions based on volume status and ejection fraction.";
      flags.push("Cardiac cachexia increases REE, but total energy needs may be lower due to decreased physical activity.");
      flags.push("Heart failure: fluid restriction individualized to clinical status and ejection fraction.");
      break;
    }

    // ── OBESITY STABLE ────────────────────────────────────────────────────────
    case "obesity_stable": {
      eeSource = "MSJ×AF"; afUsed = 1.2; eeKcal = ree * afUsed;
      wtForKcal = ibwKg; wtLabel = "IBW (Hamwi)";
      kcalLow = ibwKg * 20; kcalHigh = ibwKg * 25;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.0;
      fluidNote = "DRI (~30 mL/kg)";
      flags.push(`20–25 kcal/kg IBW (${Math.round(ibwKg)} kg). Use IC for more precise target. Consider adjusted body weight if BMI ≥40.`);
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
      break;
    }

    // ── HSCT ─────────────────────────────────────────────────────────────────
    case "hsct": {
      eeSource = "HSCT";
      if (variant === "post_engraft") {
        afUsed = 1.3; eeKcal = ree * afUsed;
        kcalLow = ree * 1.3; kcalHigh = ree * 1.3;
        protLow = wtKg * 1.2; protHigh = wtKg * 1.5;
        flags.push("Post-engraftment: energy needs decrease — reassess regularly.");
      } else {
        afUsed = 1.4; eeKcal = ree * afUsed;
        kcalLow = Math.min(ree * 1.3, wtKg * 30);
        kcalHigh = Math.max(ree * 1.5, wtKg * 35);
        protLow = wtKg * 1.5; protHigh = wtKg * 1.5;
        flags.push("Adults (HSCT): MSJ × 1.3–1.5 or 30–35 kcal/kg during first month post-transplant.");
      }
      const holidayFluidHSCT = calcHolidaySegar(wtKg);
      fluidLow = holidayFluidHSCT * 0.9; fluidHigh = holidayFluidHSCT * 1.1;
      fluidNote = `Holliday-Segar: ~${Math.round(holidayFluidHSCT)} mL/day. Increase with fever, GI losses, conditioning.`;
      flags.push("HSCT fluid: increase with fever, excessive GI losses, hypermetabolism, nephrotoxic meds.");
      flags.push("Post-transplant complications (GvHD) can significantly increase energy and protein requirements — reassess frequently.");
      break;
    }

    // ── BPD — Adult guard ─────────────────────────────────────────────────────
    case "bpd": {
      flags.push("⚠ BPD is a pediatric condition. Adult patients should not be assigned this condition.");
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.2;
      break;
    }

    default: {
      afUsed = 1.2; eeKcal = ree * afUsed; eeSource = "MSJ×AF";
      kcalLow = wtKg * 25; kcalHigh = wtKg * 35;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.2;
      break;
    }
  }

  return {
    kcalLow, kcalHigh,
    protLow, protHigh, protFixed,
    fluidLow, fluidHigh, fluidNote,
    wtForKcal, wtLabel, wtForProt,
    eeKcal, eeSource,
    afUsed, cafUsed,
    flags,
  };
}