// src/stores/useCalculatedMetrics.ts
// Phase 5: Extended with a bi-directional unit conversion system so any
// component can access measurements in the format it needs without local math.
//
// Reads from useAnthroStore + useNoteStore (patientData).
// Exposes both raw SI values and display-ready converted values.

import { useAnthroStore } from "./useAnthroStore";
import { useNoteStore } from "./useNoteStore";
import { useStandardsStore } from "./useStandardsStore";
import { calcIBW, calcBSA, calcMSJ, calcHolidaySegar } from "../shared/utils/nutrition-engine/nutritionStandards";
import { 
  calculatePediatricHealthyEER, 
  calculatePediatricHealthyProtein 
} from "../shared/utils/pediatricHealthyMath";
import { classifyPediatricWeightStatus } from "../shared/utils/pediatricWeightStatus";
import {
  calculateSchofieldWH,
  getPediatricStressFactor,
  calculatePediatricDiseaseProtein,
  calculatePediatricAKIEnergy,
  calculatePediatricInsensibleLoss
} from "../shared/utils/pediatricDiseaseMath";

// ─── Amputation lookup table ──────────────────────────────────────────────────

const AMPUTATION_DATA = [
  { label: "Hand",                pct: 0.7  },
  { label: "Forearm",             pct: 2.3  },
  { label: "Entire Arm",          pct: 5.0  },
  { label: "Foot",                pct: 1.5  },
  { label: "BKA (Below Knee)",    pct: 5.9  },
  { label: "AKA (Above Knee)",    pct: 11.0 },
  { label: "Entire Leg",          pct: 16.0 },
] as const;

// ─── Unit conversion helpers (exported so components can use them standalone) ─

/** Convert any supported weight value to kilograms. */
export function toKg(value: number, unit: string): number {
  switch (unit) {
    case "lbs": return value / 2.2046;
    case "g":   return value / 1000;
    case "oz":  return value / 35.274;
    default:    return value; // kg
  }
}

/** Convert any supported weight from kg to the target unit. */
export function fromKg(kg: number, targetUnit: string): number {
  switch (targetUnit) {
    case "lbs": return kg * 2.2046;
    case "g":   return kg * 1000;
    case "oz":  return kg * 35.274;
    default:    return kg;
  }
}

/** Convert any supported length value to centimetres. */
export function toCm(value: number, unit: string): number {
  return unit === "in" ? value * 2.54 : value;
}

/** Convert a length from cm to the target unit. */
export function fromCm(cm: number, targetUnit: string): number {
  return targetUnit === "in" ? cm / 2.54 : cm;
}

/** Convert Fahrenheit to Celsius. */
export function fToC(f: number): number {
  return (f - 32) * (5 / 9);
}

/** Convert Celsius to Fahrenheit. */
export function cToF(c: number): number {
  return c * (9 / 5) + 32;
}

// ─── Return type ──────────────────────────────────────────────────────────────

export interface CalculatedMetrics {
  // Derived identity
  bmi: string;
  ibw: number;
  adjIbw: number | null;
  ageDays: number | null;
  ageInMonths: number | null;
  ubwTimeframeDays: number | null;

  // Normalised SI values (always in kg / cm) for equations
  wtKg: number;
  htCm: number;
  ibwKg: number;
  /** Amputation-corrected weight (intact weight estimate). Equals wtKg when no amputations. */
  correctedWtKg: number;

  // Display-ready values in the user's chosen units (for UI fields)
  wtDisplay: number;
  wtDisplayUnit: string;
  htDisplay: number;
  htDisplayUnit: string;

  // Handy boolean
  isAdult: boolean; // ageDays >= 6570 (18 years)
  isPediatric: boolean; // ageDays < 6570

  // Healthy Pediatric Targets (DRI/EER)
  pediatricEER: number | null;
  pediatricProtein: number | null;
  pediatricProteinMin?: number | null;
  pediatricProteinMax?: number | null;
  pediatricFluid: number | null;

  // Adult targets
  adultEERMin: number | null;
  adultEERMax: number | null;
  adultProteinMin: number | null;
  adultProteinMax: number | null;
  adultFluid: number | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalculatedMetrics(): CalculatedMetrics {
  const anthro      = useAnthroStore((s) => s.anthro);
  const patientData = useNoteStore((s) => s.patientData);

  // ── Normalise to SI ─────────────────────────────────────────────────────────
  const htCm = toCm(Number(anthro.ht) || 0, anthro.htUnit || "cm");
  const wtKg = toKg(Number(anthro.wt) || 0, anthro.wtUnit || "kg");

  // ── BMI ────────────────────────────────────────────────────────────────────
  const bmi =
    htCm > 0 && wtKg > 0
      ? (wtKg / Math.pow(htCm / 100, 2)).toFixed(1)
      : "--";

  // ── IBW (Hamwi) ────────────────────────────────────────────────────────────
  const sex: "M" | "F" = patientData.sex === "F" ? "F" : "M";
  const ibwKg = htCm > 0 ? calcIBW(htCm, sex) : 0;

  // ── Adjusted IBW for amputations ───────────────────────────────────────────
  let adjIbw: number | null = null;
  const amputations: string[] = anthro.amputations ?? [];
  if (ibwKg > 0 && amputations.length > 0) {
    const totalPct = amputations.reduce((acc, label) => {
      const entry = AMPUTATION_DATA.find((d) => d.label === label);
      return acc + (entry?.pct ?? 0);
    }, 0);
    adjIbw = Number((ibwKg * (100 - totalPct) / 100).toFixed(1));
  }

  // ── Amputation-corrected (intact) weight ──────────────────────────────────
  // Reverses the limb-loss mass to estimate what the patient would weigh intact.
  // Formula: scalewt / (1 - totalAmputationPct/100)
  const totalAmputationPct = amputations.reduce((acc, label) => {
    const entry = AMPUTATION_DATA.find((d) => d.label === label);
    return acc + (entry?.pct ?? 0);
  }, 0);
  const correctedWtKg = totalAmputationPct > 0
    ? wtKg / (1 - totalAmputationPct / 100)
    : wtKg;

  // ── Age in days ─────────────────────────────────────────────────────────────
  let ageDays: number | null = null;
  if (patientData.dob && patientData.noteDate) {
    const ms =
      new Date(patientData.noteDate).getTime() -
      new Date(patientData.dob).getTime();
    ageDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  const ageInMonths = ageDays !== null ? ageDays / 30.4375 : null;

  // ── UBW timeframe ───────────────────────────────────────────────────────────
  let ubwTimeframeDays: number | null = null;
  if (anthro.ubwDate && patientData.noteDate) {
    const ms =
      new Date(patientData.noteDate).getTime() -
      new Date(anthro.ubwDate).getTime();
    ubwTimeframeDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  // ── Display values in user's chosen units ──────────────────────────────────
  // For the UI, we just echo back what the user entered + the unit they chose.
  // Conversion is only needed when a downstream equation needs SI.
  const wtDisplay = Number(anthro.wt) || 0;
  const wtDisplayUnit = anthro.wtUnit || "kg";
  const htDisplay = Number(anthro.ht) || 0;
  const htDisplayUnit = anthro.htUnit || "cm";

  const isAdult = ageDays !== null && ageDays >= 6570; // 18 * 365.25 ≈ 6570
  const isPediatric = !isAdult;

  const standards = useStandardsStore((s) => s.standards);
  const condition = standards.condition;
  const variant = standards.variant;

  let pediatricEER: number | null = null;
  let pediatricProtein: number | null = null;
  let pediatricProteinMin: number | null = null;
  let pediatricProteinMax: number | null = null;
  let pediatricFluid: number | null = null;

  let adultEERMin: number | null = null;
  let adultEERMax: number | null = null;
  let adultProteinMin: number | null = null;
  let adultProteinMax: number | null = null;
  let adultFluid: number | null = null;

  if (isPediatric && ageDays !== null) {
    const pal = parseFloat(standards.extraInputs.pal) || 1.2;

    if (condition === "healthy" || condition === "obesity_stable") {
      // ── Healthy Pediatric DRI/EER (Redirection for Obesity) ────────────────
      const bmiNum = parseFloat(bmi) || 0;
      const weightStatus = classifyPediatricWeightStatus({
        ageDays,
        bmi: bmiNum,
        sex,
      });
 
      pediatricEER = calculatePediatricHealthyEER({
        ageDays,
        weightKg: wtKg,
        heightCm: htCm,
        sex,
        pal,
        isOverweight: weightStatus.useOverweightEER,
      });

      pediatricProtein = calculatePediatricHealthyProtein(ageDays, wtKg);
      pediatricProteinMin = pediatricProtein;
      pediatricProteinMax = pediatricProtein;
      pediatricFluid = calcHolidaySegar(wtKg);
    } else if (condition) {
      // ── Unhealthy/Disease Pediatric Path ────────────────────────────────────

      if (condition === "aki") {
        // AKI Energy Override: Schofield WH x 1.3
        pediatricEER = calculatePediatricAKIEnergy({ ageDays, weightKg: wtKg, heightCm: htCm, sex });
        
        // AKI Fluid Target: Measured Output + Insensible Losses (400 x BSA)
        const bsa = calcBSA(htCm, wtKg);
        const insensible = calculatePediatricInsensibleLoss(bsa);
        const output = parseFloat(standards.extraInputs.urineOutputMlDay) || 0;
        pediatricFluid = output + insensible;
      } else {
        // 1. Energy (Schofield WH Baseline)
        const bmr = calculateSchofieldWH({ ageDays, weightKg: wtKg, heightCm: htCm, sex });
        const stressFactor = getPediatricStressFactor(pal, condition);
        pediatricEER = bmr * stressFactor;

        // 3. Fluid (Holliday-Segar Baseline)
        pediatricFluid = calcHolidaySegar(wtKg);
      }

      // 2. Protein (Surgical Overrides & ASPEN Critical Care)
      const protRange = calculatePediatricDiseaseProtein({
        ageDays,
        weightKg: wtKg,
        condition,
        variant,
        extraInputs: standards.extraInputs
      });
      pediatricProteinMin = protRange.min;
      pediatricProteinMax = protRange.max;
      pediatricProtein = (protRange.min + protRange.max) / 2;
    }
  } else if (isAdult && condition) {
    // ── Adult Disease Path ────────────────────────────────────────────────────
    
    if (condition === "aki") {
      const ageYears = ageDays ? ageDays / 365.25 : 40;
      const msj = calcMSJ(wtKg, htCm, ageYears, sex);
      adultEERMin = Math.min(msj * 1.0, wtKg * 20);
      adultEERMax = Math.max(msj * 1.1, wtKg * 25);

      const output = parseFloat(standards.extraInputs.urineOutputMlDay) || 0;
      const tmaxF = parseFloat(standards.extraInputs.tempMax) || 98.6;
      const tmaxC = (tmaxF - 32) * (5 / 9);
      const baseInsensible = 500;
      adultFluid =
        output +
        (tmaxC <= 37 ? baseInsensible : baseInsensible * (1 + (tmaxC - 37) * 0.1));
    }
  }

  return {
    bmi,
    ibw: ibwKg,
    adjIbw,
    ageDays,
    ageInMonths,
    ubwTimeframeDays,
    wtKg,
    htCm,
    ibwKg,
    correctedWtKg,
    wtDisplay,
    wtDisplayUnit,
    htDisplay,
    htDisplayUnit,
    isAdult,
    isPediatric,
    pediatricEER,
    pediatricProtein,
    pediatricProteinMin,
    pediatricProteinMax,
    pediatricFluid,
    adultEERMin,
    adultEERMax,
    adultProteinMin,
    adultProteinMax,
    adultFluid,
  };
}
