// src/shared/utils/formulaOptimizer.ts
//
// ALGORITHM — deterministic grid search with ceiling-only protein penalty
// ────────────────────────────────────────────────────────────────────────
// Iterates over every (kcal target, formula pair, mixing ratio) combination
// and evaluates a weighted loss on protein and fluid deviations.
//
// KEY DESIGN DECISION — asymmetric protein penalty:
//
//   Protein modulars can only ADD protein to a prescription.  Being below
//   the protein floor is therefore recoverable (clinician adds modular),
//   while being above the protein ceiling is NOT recoverable at that formula
//   volume.  Using a symmetric band penalty would bias the optimizer toward
//   high-kcal solutions that maximise formula protein delivery — and if that
//   delivery lands just under the floor, any modular addition can overshoot
//   the ceiling.
//
//   Fix: penalise ONLY protein ceiling violations.
//
//     penalty_protein(p) = max(0, p − proteinHigh)²
//
//   The optimizer therefore finds the solution that stays safely under the
//   ceiling; the result exposes `proteinDeficitG` and `proteinHeadroomG` so
//   the panel can show the clinician exactly how much modular is safe to add.
//
// Complements formulaViability.ts (variational single-formula scorer):
//   formulaViability.ts  → ranks individual formulas; powers the Ranked tab
//   formulaOptimizer.ts  → finds the globally optimal single/blended
//                          prescription incl. flush; powers the Blend tab
//
// Pure utility — no imports from stores or React.

import type { EnteralFormula } from "../../types/enteralFormula";

// ── Configuration & Constraints ───────────────────────────────────────────────

/** Minimum reasonable daily flush (40 mL q4h × 6 = 240 mL). */
const FLUSH_MIN = 240;
/** Maximum typical daily flush (120 mL q4h × 6 = 720 mL). */
const FLUSH_MAX = 900;

/**
 * Assumed caloric density of a standard protein modular supplement
 * (e.g. Beneprotein / ProMod — both ≈ 4 kcal/g of protein powder).
 * Used to convert the remaining kcal budget into a safe modular ceiling.
 */
export const MODULAR_KCAL_PER_G = 4;

/** Weight on protein CEILING violations (one-sided). */
const WEIGHT_PROTEIN_OVER  = 10.0;
/** Weight on fluid band deviations (symmetric — flush handles most of this). */
const WEIGHT_FLUID         = 1.0;

// ── Public types ──────────────────────────────────────────────────────────────

export interface OptimizationTargets {
  kcalLow: number;
  kcalHigh: number;
  /** Protein floor — under-delivery is acceptable; add modular to reach. */
  proteinLow: number;
  /** Protein ceiling — must not be exceeded by the formula alone. */
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
  /** One entry for a pure formula; two entries for a 50/50 blend. */
  formulas: { formula: EnteralFormula; volumeMl: number }[];
  flushMl: number;
  totals: Totals;
  /** Weighted loss at the selected point (lower = better). */
  loss: number;

  /**
   * Grams of protein modular needed to reach the floor target.
   * 0 when formula protein is already at or above proteinLow.
   * Null when proteinLow was not specified.
   */
  proteinDeficitG: number | null;

  /**
   * Maximum grams of protein modular that can be safely added without
   * breaching EITHER the protein ceiling OR the kcal ceiling
   * (modular contributes ~MODULAR_KCAL_PER_G kcal per gram).
   *
   * Computed as:
   *   min(proteinHigh − formulaProtein,
   *       (kcalHigh − formulaKcal) / MODULAR_KCAL_PER_G)
   *
   * If proteinDeficitG > proteinHeadroomG the formula cannot reach the
   * protein floor without exceeding the kcal ceiling — the panel should
   * flag this as an infeasible modular adjustment.
   * Null when proteinHigh was not specified.
   */
  proteinHeadroomG: number | null;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * ONE-SIDED ceiling penalty — the core fix.
 *
 * Returns 0 when protein is at or below the ceiling.
 * Grows quadratically above the ceiling to strongly discourage over-delivery.
 * Being below the floor carries zero penalty (modular handles it).
 */
function proteinCeilingPenalty(protein: number, ceiling: number): number {
  const over = Math.max(0, protein - ceiling);
  return over * over;
}

/**
 * Symmetric band penalty for fluid.
 * Flush volume already absorbs most fluid error, so a linear (not squared)
 * measure is sufficient here.
 */
function fluidBandPenalty(fluid: number, low: number, high: number): number {
  if (fluid < low)  return low  - fluid;
  if (fluid > high) return fluid - high;
  return 0;
}

/**
 * Total weighted loss.
 * Kcal is guaranteed inside the band by the search loop — not penalised here.
 */
function computeLoss(
  protein: number,
  fluid: number,
  targets: OptimizationTargets
): number {
  return (
    WEIGHT_PROTEIN_OVER * proteinCeilingPenalty(protein, targets.proteinHigh) +
    WEIGHT_FLUID        * fluidBandPenalty(fluid, targets.fluidLow, targets.fluidHigh)
  );
}

/**
 * Select the flush volume that centres base fluid in [targetFluidLow, targetFluidHigh],
 * clamped to physiological nursing constraints [FLUSH_MIN, FLUSH_MAX].
 */
function bestFlush(
  baseFluid: number,
  targetFluidLow: number,
  targetFluidHigh: number
): number {
  const centre = (targetFluidLow + targetFluidHigh) / 2;
  const ideal  = centre - baseFluid;
  if (ideal < FLUSH_MIN) return FLUSH_MIN;
  if (ideal > FLUSH_MAX) return FLUSH_MAX;
  return ideal;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Find the optimal enteral prescription from `availableFormulas` that:
 *   1. Strictly satisfies the kcal band (hard constraint via loop bounds)
 *   2. Never exceeds the protein ceiling (ceiling-only penalty)
 *   3. Minimises fluid deviation after flush optimisation
 *
 * Protein under-delivery is intentionally NOT penalised — the caller should
 * use `result.proteinDeficitG` to prompt the clinician to add a protein
 * modular supplement up to `result.proteinHeadroomG` grams.
 *
 * Considers:
 *   - Pure single-formula prescriptions (alpha = 1.0)
 *   - Clinical 50/50 blends of any two formulas (alpha = 0.5)
 *   - Flush volume within [FLUSH_MIN, FLUSH_MAX]
 *
 * Returns `feasible: false` when inputs are invalid or no formula has
 * sufficient nutritional data.
 */
export function optimizeEnteralPrescription(
  availableFormulas: EnteralFormula[],
  targets: OptimizationTargets
): OptimizationResult {
  const INFEASIBLE: OptimizationResult = {
    feasible: false,
    formulas: [],
    flushMl: 0,
    totals: { kcal: 0, protein: 0, fluid: 0 },
    loss: Infinity,
    proteinDeficitG: null,
    proteinHeadroomG: null,
  };

  const valid = availableFormulas.filter(
    (f) =>
      f.kcal_per_ml     !== null &&
      f.protein_g_per_l !== null &&
      f.free_water_pct  !== null
  );

  if (valid.length === 0 || targets.kcalLow > targets.kcalHigh) {
    return INFEASIBLE;
  }

  let best = INFEASIBLE;

  const KCAL_STEP    = 10;
  const MIXING_RATIOS = [0.5, 1.0]; // 50/50 blend or pure formula

  for (
    let targetKcal = targets.kcalLow;
    targetKcal <= targets.kcalHigh;
    targetKcal += KCAL_STEP
  ) {
    for (let i = 0; i < valid.length; i++) {
      for (let j = i; j < valid.length; j++) {
        const formA = valid[i];
        const formB = valid[j];

        for (const alpha of MIXING_RATIOS) {
          if (i === j && alpha !== 1.0) continue; // pure-formula only for same formula

          const kcalA = targetKcal * alpha;
          const kcalB = targetKcal * (1 - alpha);

          const volA = kcalA / formA.kcal_per_ml!;
          const volB = kcalB > 0 ? kcalB / formB.kcal_per_ml! : 0;

          const protein =
            (formA.protein_g_per_l! / 1000) * volA +
            (formB.protein_g_per_l! / 1000) * volB;

          const baseFluid =
            (formA.free_water_pct! / 100) * volA +
            (formB.free_water_pct! / 100) * volB;

          const flush = bestFlush(baseFluid, targets.fluidLow, targets.fluidHigh);
          const fluid = baseFluid + flush;

          const loss = computeLoss(protein, fluid, targets);

          if (loss < best.loss) {
            const usedFormulas: { formula: EnteralFormula; volumeMl: number }[] = [];
            if (volA > 0) usedFormulas.push({ formula: formA, volumeMl: Math.round(volA) });
            if (volB > 0 && i !== j) usedFormulas.push({ formula: formB, volumeMl: Math.round(volB) });

            const proteinRounded = Math.round(protein * 10) / 10;

            const hasProteinTargets =
              targets.proteinLow > 0 && targets.proteinHigh > 0;

            // How much protein headroom exists in each dimension?
            const headroomFromProtein =
              targets.proteinHigh - proteinRounded;
            const headroomFromKcal =
              (targets.kcalHigh - targetKcal) / MODULAR_KCAL_PER_G;
            const safeModularHeadroom =
              Math.min(headroomFromProtein, headroomFromKcal);

            best = {
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
            };
          }
        }
      }
    }
  }

  return best;
}