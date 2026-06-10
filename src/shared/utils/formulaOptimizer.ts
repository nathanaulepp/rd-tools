// src/shared/utils/formulaOptimizer.ts

import type { EnteralFormula } from "../../types/enteralFormula";

// ── Configuration & Constraints ───────────────────────────────────────────────

const FLUSH_MIN = 240;
const FLUSH_MAX = 900;
export const MODULAR_KCAL_PER_G = 4;

const WEIGHT_PROTEIN_OVER  = 10.0;
const WEIGHT_FLUID         = 1.0;

// ── Public types ──────────────────────────────────────────────────────────────

export interface OptimizationTargets {
  kcalLow: number;
  kcalHigh: number;
  proteinLow: number;
  proteinHigh: number;
  fluidLow: number;
  fluidHigh: number;
}

export interface Totals {
  kcal: number;
  protein: number;
  fluid: number;
}

export interface OptimizationResult {
  feasible: boolean;
  formulas: { formula: EnteralFormula; volumeMl: number }[];
  flushMl: number;
  totals: Totals;
  loss: number;
  proteinDeficitG: number | null;
  proteinHeadroomG: number | null;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function proteinCeilingPenalty(protein: number, ceiling: number): number {
  const over = Math.max(0, protein - ceiling);
  return over * over;
}

function fluidBandPenalty(fluid: number, low: number, high: number): number {
  if (fluid < low)  return low  - fluid;
  if (fluid > high) return fluid - high;
  return 0;
}

function computeLoss(protein: number, fluid: number, targets: OptimizationTargets): number {
  return (
    WEIGHT_PROTEIN_OVER * proteinCeilingPenalty(protein, targets.proteinHigh) +
    WEIGHT_FLUID        * fluidBandPenalty(fluid, targets.fluidLow, targets.fluidHigh)
  );
}

function bestFlush(baseFluid: number, targetFluidLow: number, targetFluidHigh: number): number {
  const centre = (targetFluidLow + targetFluidHigh) / 2;
  const ideal  = centre - baseFluid;
  if (ideal < FLUSH_MIN) return FLUSH_MIN;
  if (ideal > FLUSH_MAX) return FLUSH_MAX;
  return ideal;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns an array of the best volume configuration for EVERY feasible single
 * formula, sorted by lowest penalty (best fit).
 */
export function optimizeEnteralPrescription(
  availableFormulas: EnteralFormula[],
  targets: OptimizationTargets
): OptimizationResult[] {
  const valid = availableFormulas.filter(
    (f) =>
      f.kcal_per_ml     !== null &&
      f.protein_g_per_l !== null &&
      f.free_water_pct  !== null
  );

  if (valid.length === 0 || targets.kcalLow > targets.kcalHigh) {
    return [];
  }

  // Track the best result for each formula
  const resultsMap = new Map<string, OptimizationResult>();
  const KCAL_STEP = 10;

  for (
    let targetKcal = targets.kcalLow;
    targetKcal <= targets.kcalHigh;
    targetKcal += KCAL_STEP
  ) {
    for (let i = 0; i < valid.length; i++) {
      const formA = valid[i];

      const volA = targetKcal / formA.kcal_per_ml!;
      
      const protein = (formA.protein_g_per_l! / 1000) * volA;
      const baseFluid = (formA.free_water_pct! / 100) * volA;

      const flush = bestFlush(baseFluid, targets.fluidLow, targets.fluidHigh);
      const fluid = baseFluid + flush;

      const loss = computeLoss(protein, fluid, targets);
      const key = formA.id;

      const currentBest = resultsMap.get(key);
      
      if (!currentBest || loss < currentBest.loss) {
        const usedFormulas = [{ formula: formA, volumeMl: Math.round(volA) }];

        const proteinRounded = Math.round(protein * 10) / 10;
        const hasProteinTargets = targets.proteinLow > 0 && targets.proteinHigh > 0;

        const headroomFromProtein = targets.proteinHigh - proteinRounded;
        const headroomFromKcal = (targets.kcalHigh - targetKcal) / MODULAR_KCAL_PER_G;
        const safeModularHeadroom = Math.min(headroomFromProtein, headroomFromKcal);

        resultsMap.set(key, {
          feasible: true,
          formulas: usedFormulas,
          flushMl: Math.round(flush),
          totals: {
            kcal:    Math.round(targetKcal),
            protein: proteinRounded,
            fluid:   Math.round(fluid),
          },
          loss,
          proteinDeficitG: hasProteinTargets
            ? Math.max(0, Math.round((targets.proteinLow - proteinRounded) * 10) / 10)
            : null,
          proteinHeadroomG: hasProteinTargets
            ? Math.max(0, Math.round(safeModularHeadroom * 10) / 10)
            : null,
        });
      }
    }
  }

  // Convert map to array and sort by lowest penalty (best fit first)
  return Array.from(resultsMap.values()).sort((a, b) => a.loss - b.loss);
}