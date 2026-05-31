// src/stores/useCalculatedMetrics.ts
// Derived metrics selector — replaces the calculatedMetrics useMemo in App.tsx.
// Reads live from useAnthroStore + useNoteStore so any consumer gets the same
// values without passing them as props.

import { useAnthroStore } from "./useAnthroStore";
import { useNoteStore } from "./useNoteStore";
import { calcIBW } from "../features/assessment/assess-standards/nutritionStandards";

const AMPUTATION_DATA = [
  { label: "Hand",                pct: 0.7  },
  { label: "Forearm",             pct: 2.3  },
  { label: "Entire Arm",          pct: 5.0  },
  { label: "Foot",                pct: 1.5  },
  { label: "BKA (Below Knee)",    pct: 5.9  },
  { label: "AKA (Above Knee)",    pct: 11.0 },
  { label: "Entire Leg",          pct: 16.0 },
] as const;

export interface CalculatedMetrics {
  bmi: string;
  ibw: number;
  adjIbw: number | null;
  ageDays: number | null;
  ubwTimeframeDays: number | null;
}

export function useCalculatedMetrics(): CalculatedMetrics {
  const anthro      = useAnthroStore((s) => s.anthro);
  const patientData = useNoteStore((s) => s.patientData);

  // Height → cm
  const htCm =
    anthro.htUnit === "in"
      ? Number(anthro.ht) * 2.54
      : Number(anthro.ht);

  // Weight → kg
  const wtKg =
    anthro.wtUnit === "lbs"
      ? Number(anthro.wt) / 2.205
      : Number(anthro.wt);

  // BMI
  const bmi =
    htCm > 0 && wtKg > 0
      ? (wtKg / Math.pow(htCm / 100, 2)).toFixed(1)
      : "--";

  // IBW (Hamwi)
  const sex: "M" | "F" = patientData.sex === "F" ? "F" : "M";
  const ibw = htCm > 0 ? calcIBW(htCm, sex) : 0;

  // Adjusted IBW for amputations
  let adjIbw: number | null = null;
  const amputations: string[] = anthro.amputations ?? [];
  if (ibw > 0 && amputations.length > 0) {
    const totalPct = amputations.reduce((acc, label) => {
      const entry = AMPUTATION_DATA.find((d) => d.label === label);
      return acc + (entry?.pct ?? 0);
    }, 0);
    adjIbw = Number((ibw * (100 - totalPct) / 100).toFixed(1));
  }

  // Age in days (DOB → note date)
  let ageDays: number | null = null;
  if (patientData.dob && patientData.noteDate) {
    const ms =
      new Date(patientData.noteDate).getTime() -
      new Date(patientData.dob).getTime();
    ageDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  // UBW timeframe in days
  let ubwTimeframeDays: number | null = null;
  if (anthro.ubwDate && patientData.noteDate) {
    const ms =
      new Date(patientData.noteDate).getTime() -
      new Date(anthro.ubwDate).getTime();
    ubwTimeframeDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  return { bmi, ibw, adjIbw, ageDays, ubwTimeframeDays };
}