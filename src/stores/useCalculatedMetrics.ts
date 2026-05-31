// src/stores/useCalculatedMetrics.ts
// Phase 5: Extended with a bi-directional unit conversion system so any
// component can access measurements in the format it needs without local math.
//
// Reads from useAnthroStore + useNoteStore (patientData).
// Exposes both raw SI values and display-ready converted values.

import { useAnthroStore } from "./useAnthroStore";
import { useNoteStore } from "./useNoteStore";
import { calcIBW } from "../features/assessment/assess-standards/nutritionStandards";

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
  ubwTimeframeDays: number | null;

  // Normalised SI values (always in kg / cm) for equations
  wtKg: number;
  htCm: number;
  ibwKg: number;

  // Display-ready values in the user's chosen units (for UI fields)
  wtDisplay: number;
  wtDisplayUnit: string;
  htDisplay: number;
  htDisplayUnit: string;

  // Handy boolean
  isAdult: boolean; // ageDays >= 6570 (18 years)
  isPediatric: boolean; // ageDays < 6570
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

  // ── Age in days ─────────────────────────────────────────────────────────────
  let ageDays: number | null = null;
  if (patientData.dob && patientData.noteDate) {
    const ms =
      new Date(patientData.noteDate).getTime() -
      new Date(patientData.dob).getTime();
    ageDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  }

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

  return {
    bmi,
    ibw: ibwKg,
    adjIbw,
    ageDays,
    ubwTimeframeDays,
    wtKg,
    htCm,
    ibwKg,
    wtDisplay,
    wtDisplayUnit,
    htDisplay,
    htDisplayUnit,
    isAdult,
    isPediatric,
  };
}