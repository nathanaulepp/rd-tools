// src/features/assessment/assess-standards/nutritionStandardsPeds.ts
//
// Pediatric condition evaluation engine.
// Called exclusively by evaluateNutritionRx() in nutritionStandards.ts when isPeds === true.
// Do NOT import this file from UI components — always go through the barrel (nutritionStandards.ts).

import type { EvalOptions } from "../../../types/standards";
import type { SharedEvalContext, ConditionResult } from "../../../types/nutritionEngine";
import {
  calcBSA,
  calcHolidaySegar,
} from "./nutritionStandardsMath";
import {
  calculatePediatricHealthyEER,
  calculatePediatricHealthyProtein,
} from "../pediatricHealthyMath";
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
} from "../pediatricDiseaseMath";

// ─── Pediatric Evaluation Engine ──────────────────────────────────────────────

export function evaluatePedsCondition(
  opts: EvalOptions,
  ctx: SharedEvalContext
): ConditionResult {
  const { variant, currentRx, extraInputs = {} } = opts;
  const {
    wtKg, htCm, ageYears, ageDays, sex,
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
  let eeKcal = 0;
  let eeSource: ConditionResult["eeSource"] = "Schofield WH×SF";
  let afUsed: number | undefined;
  let cafUsed: number | undefined;
  const flags: string[] = [];

  const schofieldOpts = { ageDays, weightKg: wtKg, heightCm: htCm, sex };

  switch (condition) {

    // ── HEALTHY ──────────────────────────────────────────────────────────────
    case "healthy": {
      const pal = Number(extraInputs.pal) || 1.4;
      const isOverweight = extraInputs.isOverweight === "true" || extraInputs.isOverweight === 1;
      eeKcal = calculatePediatricHealthyEER({
        ageDays,
        weightKg: wtKg,
        heightCm: htCm,
        sex,
        pal,
        isOverweight,
      });
      eeSource = "DRI/EER";
      kcalLow = eeKcal * 0.925;
      kcalHigh = eeKcal * 1.075;

      const protRda = calculatePediatricHealthyProtein(ageDays, wtKg);
      protLow = protRda;
      protHigh = protRda;

      const holidayFluid = calcHolidaySegar(wtKg);
      fluidLow = holidayFluid;
      fluidHigh = holidayFluid;
      fluidNote = `Holliday-Segar: ${Math.round(holidayFluid)} mL/day.`;

      flags.push("ℹ Pediatric healthy EER calculated via DRI/EER equations (Institute of Medicine). PAL applied from slider.");
      flags.push("For overweight/obese pediatric patients, select the PAL appropriate to actual activity level — the overweight DRI equations are applied automatically.");
      break;
    }

    // ── AKI ──────────────────────────────────────────────────────────────────
    case "aki": {
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
      break;
    }

    // ── ACUTE PANCREATITIS ────────────────────────────────────────────────────
    case "acute_pancreatitis": {
      const pedsBMR = calculateSchofieldWH(schofieldOpts);
      const pRange = calculatePediatricPancreatitisEnergy(schofieldOpts);
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
      break;
    }

    // ── BREASTFEEDING ─────────────────────────────────────────────────────────
    case "breastfeeding": {
      // Adolescent breastfeeding (14–17y)
      const adolBMR = calculateAdolescentSchofieldBMR(wtKg, sex);
      const addOn = variant === "late" ? 330 : 400;
      eeKcal = adolBMR + addOn;
      eeSource = "Schofield WH×SF";
      kcalLow = eeKcal - 20; kcalHigh = eeKcal + 20;
      const pedsProtein = getPediatricSDI(ageDays, wtKg);
      protFixed = pedsProtein + 25;
      protLow = protFixed; protHigh = protFixed;
      const holidayFluidBF = calcHolidaySegar(wtKg);
      fluidLow = holidayFluidBF + 800; fluidHigh = holidayFluidBF + 800;
      fluidNote = `Holliday-Segar (${Math.round(holidayFluidBF)} mL) + 800 mL for lactation = ${Math.round(fluidLow)} mL/day.`;
      flags.push(`ℹ Adolescent breastfeeding: Schofield BMR (${Math.round(adolBMR)} kcal) + ${addOn} kcal lactation addition.`);
      flags.push("Protein: Pediatric DRI for age + 25 g/day for milk production.");
      break;
    }

    // ── BURNS ─────────────────────────────────────────────────────────────────
    case "burns": {
      const tbsa = Number(extraInputs.tbsaPct) || 0;
      const bsa = calcBSA(htCm, wtKg);
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
      if (useIC) flags.push("IC strongly recommended for burns — recalculate frequently.");
      fluidNote = "Parkland formula / physiological endpoints — strict I/O monitoring required.";
      break;
    }

    // ── ONCOLOGY ─────────────────────────────────────────────────────────────
    case "oncology": {
      const isUndernourished = extraInputs.isUndernourished === "true" || extraInputs.isUndernourished === 1;
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
      fluidNote = "DRI; adjust for nephrotoxic agents and GI losses.";
      break;
    }

    // ── CKD 3–5 ──────────────────────────────────────────────────────────────
    case "ckd_3_5": {
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
      break;
    }

    // ── CKD 5D ───────────────────────────────────────────────────────────────
    case "ckd_5d": {
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
      break;
    }

    // ── KIDNEY TRANSPLANT ─────────────────────────────────────────────────────
    case "kidney_transplant": {
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
      break;
    }

    // ── COPD ─────────────────────────────────────────────────────────────────
    case "copd": {
      const pedsBMR = calculateSchofieldWH(schofieldOpts);
      eeKcal = calculatePediatricCOPDEnergy(schofieldOpts);
      eeSource = "Schofield WH×SF";
      kcalLow = eeKcal * 0.9; kcalHigh = eeKcal * 1.1;
      protLow = wtKg * 0.8; protHigh = wtKg * 1.5;
      const ageGroup = ageYears < 10 ? "3–10y" : "10–18y";
      flags.push(`ℹ Pediatric COPD: Schofield WH ${ageGroup} bracket (${Math.round(pedsBMR)} kcal) × AF 1.3 = ${Math.round(eeKcal)} kcal/day.`);
      flags.push("Adult Schofield weight brackets are inappropriate for pediatric COPD — using age-specific WH table.");
      fluidNote = "DRI; restrict if cor pulmonale or pulmonary edema present.";
      break;
    }

    // ── CIRRHOSIS ─────────────────────────────────────────────────────────────
    case "cirrhosis": {
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
      break;
    }

    // ── LIVER TRANSPLANT ──────────────────────────────────────────────────────
    case "liver_transplant": {
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
      break;
    }

    // ── CRITICAL ILLNESS ──────────────────────────────────────────────────────
    case "critical_illness": {
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
        flags.push("⚠ Permissive underfeeding (12–25 kcal/kg) halts linear growth and causes long-term cognitive/metabolic deficits in children. IC is strongly preferred.");
      }
      const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "critical_illness", variant: variant || "", extraInputs });
      protLow = protRange.min; protHigh = protRange.max;
      const holidayFluid = calcHolidaySegar(wtKg);
      fluidLow = holidayFluid * 0.9; fluidHigh = holidayFluid * 1.1;
      fluidNote = `Holliday-Segar: ~${Math.round(holidayFluid)} mL/day. Titrate to resuscitation goals.`;
      break;
    }

    // ── PREGNANCY ─────────────────────────────────────────────────────────────
    case "pregnancy": {
      // Adolescent pregnancy (14–17y)
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
      break;
    }

    // ── PRESSURE INJURIES ─────────────────────────────────────────────────────
    case "pressure_injuries": {
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
      break;
    }

    // ── TRAUMA ───────────────────────────────────────────────────────────────
    case "trauma": {
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
      break;
    }

    // ── MASLD / MASH ──────────────────────────────────────────────────────────
    case "masld_mash": {
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
      break;
    }

    // ── SHORT BOWEL SYNDROME ──────────────────────────────────────────────────
    case "short_bowel": {
      const isPNDependent = variant === "peds_pn_dependent";
      const isEnteralAutonomous = variant === "peds_enteral_autonomous";
      const hasPreservedColon = extraInputs.hasPreservedColon === "true" || extraInputs.hasPreservedColon === 1;
      const remainingBowelShort = extraInputs.remainingBowelShort === "true" || extraInputs.remainingBowelShort === 1;
      const growthSuboptimal = extraInputs.growthSuboptimal === "true" || extraInputs.growthSuboptimal === 1;
      const ageGroup = ageDays <= 182.625 ? "infant_0_6mo"
                     : ageDays <= 365.25  ? "infant_6_12mo"
                     : ageYears < 12      ? "child"
                     :                      "adolescent";

      eeSource = "Schofield WH×SF";

      if (isPNDependent) {
        switch (ageGroup) {
          case "infant_0_6mo":  kcalLow = wtKg * 85;  kcalHigh = wtKg * 105; break;
          case "infant_6_12mo": kcalLow = wtKg * 80;  kcalHigh = wtKg * 100; break;
          case "child":         kcalLow = wtKg * 50;  kcalHigh = wtKg * 90;  break;
          case "adolescent":    kcalLow = wtKg * 30;  kcalHigh = wtKg * 50;  break;
        }
        eeKcal = (kcalLow + kcalHigh) / 2;
        flags.push("PN-dependent SBS: conservative energy targets — gut not yet compensating. Advance enteral feeds gradually.");
        flags.push("⚠ Maximize parenteral sodium provision to match high GI losses.");
        flags.push("Monitor trace elements (zinc, selenium, copper) weekly — GI losses deplete them rapidly.");
        if (ageGroup === "infant_0_6mo" || ageGroup === "infant_6_12mo") {
          protLow = wtKg * 3.5; protHigh = wtKg * 4.0;
        } else {
          protLow = wtKg * 2.0; protHigh = wtKg * 3.0;
        }
        let fluidBase = 120;
        if (hasPreservedColon) fluidBase -= 20;
        if (remainingBowelShort) fluidBase += 30;
        const fluidMl = Math.min(Math.max(fluidBase, 110), 200) * wtKg;
        fluidLow = fluidMl; fluidHigh = fluidMl;
        fluidNote = `~${Math.round(fluidBase)} mL/kg/day (PN route). Adjusted for anatomy and output. Target urine output ≥1–2 mL/kg/hr.`;

      } else if (isEnteralAutonomous) {
        switch (ageGroup) {
          case "infant_0_6mo":
            kcalLow = wtKg * 200; kcalHigh = wtKg * 250;
            flags.push("Enteral SBS infant: up to 200–250 kcal/kg/day to overcome malabsorption. Monitor growth weekly.");
            break;
          case "infant_6_12mo":
            kcalLow = wtKg * 100; kcalHigh = wtKg * 150;
            flags.push("Scale energy upward from this baseline based on growth response.");
            break;
          case "child":
            kcalLow = wtKg * 80; kcalHigh = wtKg * 130;
            flags.push("Scale energy upward from this baseline based on growth response.");
            break;
          case "adolescent": {
            const schofieldAdol = calculateSchofieldWH(schofieldOpts);
            kcalLow = schofieldAdol * 1.8; kcalHigh = schofieldAdol * 2.2;
            flags.push(`Adolescent enteral SBS: Schofield REE (${Math.round(schofieldAdol)} kcal) × 1.8–2.2 to overcome malabsorption.`);
            break;
          }
        }
        eeKcal = (kcalLow + kcalHigh) / 2;
        flags.push("⚠ Enteral autonomy achieved: ensure aggressive enteral sodium supplementation (4–6 mEq/kg/day).");
        flags.push("Advance enteral feeds slowly — bowel adaptation continues for 1–3 years post-resection.");
        if (ageGroup === "infant_0_6mo" || ageGroup === "infant_6_12mo") {
          protLow = wtKg * 3.0; protHigh = wtKg * 3.5;
        } else {
          protLow = wtKg * 2.0; protHigh = wtKg * 3.0;
        }
        let fluidBaseE = 150;
        if (hasPreservedColon) fluidBaseE -= 20;
        if (remainingBowelShort) fluidBaseE += 30;
        const fluidMlE = Math.min(Math.max(fluidBaseE, 110), 200) * wtKg;
        fluidLow = fluidMlE; fluidHigh = fluidMlE;
        fluidNote = `~${Math.round(fluidBaseE)} mL/kg/day (enteral route). High losses require aggressive replacement.`;

      } else {
        flags.push("Select a pediatric SBS sub-type (PN-Dependent or Enteral Autonomous) for individualized targets.");
        kcalLow = wtKg * 80; kcalHigh = wtKg * 130;
        eeKcal = (kcalLow + kcalHigh) / 2;
        protLow = wtKg * 2.0; protHigh = wtKg * 3.0;
        fluidNote = "Titrate to output losses. Target urine output ≥1 mL/kg/hr.";
      }

      if (growthSuboptimal) {
        kcalLow *= 1.10; kcalHigh *= 1.10; eeKcal *= 1.10;
        flags.push("Growth suboptimal: energy targets increased 10%. Reassess weekly.");
      }

      flags.push("IC strongly recommended for SBS — energy needs are highly variable and change with adaptation phase.");
      flags.push("Source: Kay et al. (2021). Pediatric SBS: Nutritional Care. Nutrition Issues in Gastroenterology, Series No. 206.");
      break;
    }

    // ── CYSTIC FIBROSIS ───────────────────────────────────────────────────────
    case "cystic_fibrosis": {
      const fev1 = Number(extraInputs.fev1Pct) || 100;
      const isPancSuf = extraInputs.isPancreaticSufficient === "true" || extraInputs.isPancreaticSufficient === 1;
      const cfa = Number(extraInputs.cfa) || 0.85;
      let palForCF = 1.5;
      if (variant === "bed") palForCF = 1.3;
      else if (variant === "active") palForCF = 1.7;

      const pRange = calculatePediatricCFEnergy({
        ageDays,
        weightKg: wtKg,
        heightCm: htCm,
        sex,
        ac: palForCF,
        dc: fev1 >= 80 ? 0 : fev1 >= 40 ? 0.2 : 0.4,
        isPancreaticSufficient: isPancSuf,
        cfa,
        intakeKcal: currentRx.kcalPerDay,
        intakeFatG: currentRx.fatGPerDay,
      });
      eeKcal = (pRange.min + pRange.max) / 2;
      eeSource = "CF Formula";
      kcalLow = pRange.min;
      kcalHigh = pRange.max;
      protLow = wtKg * 0.8 * 1.2; protHigh = wtKg * 0.8 * 2.0;
      fluidNote = "DRI";
      if (pRange.flags) flags.push(...pRange.flags);
      flags.push(`ℹ Pediatric CF Formula: PAL ${palForCF} + DC ${fev1 >= 80 ? 0 : fev1 >= 40 ? 0.2 : 0.4} with Schofield WH ${ageYears < 3 ? "0–3y" : ageYears < 10 ? "3–10y" : "10–18y"} bracket.`);
      flags.push("CF systems frequently truncate age at 10 — correct pediatric brackets used.");
      break;
    }

    // ── STROKE ────────────────────────────────────────────────────────────────
    case "stroke": {
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
      break;
    }

    // ── HEART FAILURE ─────────────────────────────────────────────────────────
    case "heart_failure": {
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
      break;
    }

    // ── OBESITY STABLE ────────────────────────────────────────────────────────
    case "obesity_stable": {
      flags.push("ℹ Pediatric obesity energy targets are automatically calculated via the DRI/EER Overweight equations in 'Healthy / Preventive' ");
      flags.push("Gradual, growth-preserving weight management: target weight stabilization, not active loss, during linear growth phases.");
      kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
      break;
    }

    // ── SEVERE MALNUTRITION ───────────────────────────────────────────────────
    case "severe_malnutrition": {
      flags.push("⚠ FOLLOW-UP REQUIRED: Pediatric catch-up growth formula [RDA × Ideal Weight / Actual Weight] requires an 'Ideal Weight for Height' input field not yet implemented.");
      flags.push("Start at 50% of energy target and advance over 3–5 days. Monitor phosphorus, magnesium, potassium, and thiamine closely.");
      flags.push("⚠ REFEEDING RISK: Pediatric refeeding syndrome risks are overlooked when applying standard adult energy calculations.");
      kcalLow = 0; kcalHigh = 0; protLow = 0; protHigh = 0;
      break;
    }

    // ── SICKLE CELL DISEASE ───────────────────────────────────────────────────
    case "sickle_cell": {
      const hgb = Number(extraInputs.hgb) || 8.0;
      const pal = Number(extraInputs.pal) || 1.5;
      eeKcal = calculatePediatricSCDEnergy({ weightKg: wtKg, hgbGdL: hgb, sex, pal });
      eeSource = "SCD REE";
      kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
      const protRange = calculatePediatricDiseaseProtein({ ageDays, weightKg: wtKg, condition: "sickle_cell", variant: variant || "", extraInputs });
      protLow = protRange.min; protHigh = protRange.max;
      flags.push(`ℹ Pediatric SCD REE: Hemoglobin-adjusted sex-specific equation (Hgb: ${hgb} g/dL) × AF ${pal}.`);
      flags.push("Adult MSJ with activity factors is architecturally invalid for pediatric SCD — sex-specific hemoglobin-adjusted REE used.");
      break;
    }

    // ── HSCT ─────────────────────────────────────────────────────────────────
    case "hsct": {
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
      break;
    }

    // ── BPD ──────────────────────────────────────────────────────────────────
    case "bpd": {
      kcalLow = wtKg * 120;
      kcalHigh = wtKg * 150;
      eeKcal = wtKg * 135;
      eeSource = "Schofield WH×SF";
      protLow = wtKg * 3.5;
      protHigh = wtKg * 4.5;
      fluidLow = wtKg * 130;
      fluidHigh = wtKg * 150;
      flags.push("ℹ BPD targets: 120–150 kcal/kg and 3.5–4.5 g/kg/day protein. Both titrate DOWN as respiratory status stabilises and growth velocity normalises.");
      flags.push("⚠ Fluid restriction (130–150 mL/kg/day) requires calorically dense enteral formula (≥1 kcal/mL, consider 1.5–2 kcal/mL) to close the energy gap.");
      flags.push("ℹ Monitor growth velocity weekly. If weight gain <15–20 g/day in VLBW infants, reassess energy density before increasing volume.");
      flags.push("Source: Gipson DR et al. BMJ Nutr Prev Health. 2025;:e000913. doi:10.1136/bmjnph-2024-000913");
      break;
    }

    default: {
      eeKcal = calculateSchofieldWH(schofieldOpts);
      eeSource = "Schofield WH×SF";
      kcalLow = eeKcal * 0.95; kcalHigh = eeKcal * 1.05;
      protLow = wtKg * 1.0; protHigh = wtKg * 1.5;
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