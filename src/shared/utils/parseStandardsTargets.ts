// src/shared/utils/parseStandardsTargets.ts
//
// Parses EvaluationSnapshot.results into plain numeric low/high pairs
// for pre-filling the Nutrition Prescription intervention fields.
//
// Target strings produced by fmtRange() have two forms:
//   "1800–2200 kcal/day"   → { low: 1800, high: 2200 }
//   "72 g/day"             → { low: 72,   high: 72   }
//
// The en-dash (–, U+2013) is used by fmtRange; a regular hyphen is also
// handled defensively.

import type { EvalResult } from "../../types/standards";

export interface ParsedTargets {
  kcalLow: string;
  kcalHigh: string;
  proteinLow: string;
  proteinHigh: string;
  fluidLow: string;
  fluidHigh: string;
}

/**
 * Extract a { low, high } pair from an EvalResult.target string.
 * Returns null when the string is empty or unparseable.
 */
function parseRange(target: string): { low: number; high: number } | null {
  if (!target) return null;

  // Strip the unit suffix (everything after the first space following digits)
  const stripped = target.trim();

  // Try "X–Y unit" or "X-Y unit" (range form)
  const rangeMatch = stripped.match(/^([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (rangeMatch) {
    const low  = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high)) return { low, high };
  }

  // Try "X unit" (single value form)
  const singleMatch = stripped.match(/^([\d.]+)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (!isNaN(val)) return { low: val, high: val };
  }

  return null;
}

/**
 * Convert an array of EvalResult rows (from snapshot.results) into the
 * string-valued field pairs used by NpEnteralNutrition and NpOralNutrition.
 *
 * Any field that cannot be resolved is returned as an empty string so
 * existing manual entries are not overwritten with bad data.
 */
export function parseStandardsTargets(results: EvalResult[]): ParsedTargets {
  const out: ParsedTargets = {
    kcalLow: "", kcalHigh: "",
    proteinLow: "", proteinHigh: "",
    fluidLow: "", fluidHigh: "",
  };

  for (const row of results) {
    const parsed = parseRange(row.target);
    if (!parsed) continue;

    const low  = String(Math.round(parsed.low));
    const high = String(Math.round(parsed.high));

    switch (row.label) {
      case "Energy":
        out.kcalLow  = low;
        out.kcalHigh = high;
        break;
      case "Protein":
        out.proteinLow  = low;
        out.proteinHigh = high;
        break;
      case "Fluid":
        out.fluidLow  = low;
        out.fluidHigh = high;
        break;
    }
  }

  return out;
}