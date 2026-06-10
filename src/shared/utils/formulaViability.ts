// src/shared/utils/formulaViability.ts
// Pure utility — no imports from stores or React.
//
// ALGORITHM (v2 — variational / calculus-based)
// ─────────────────────────────────────────────
// Each nutrient delivered scales linearly with infusion volume V (mL/day):
//
//   kcal(V)    = α · V          where α = kcal_per_ml
//   protein(V) = β · V          where β = protein_g_per_l / 1000
//   fluid(V)   = γ · V          where γ = free_water_pct / 100
//
// Define a squared-error penalty for each nutrient against its [lo, hi] target:
//
//   P_k(V) = max(0, lo_k - k(V))²  +  max(0, k(V) - hi_k)²
//
// This is zero inside the target band and grows quadratically outside.
// The total weighted cost is:
//
//   C(V) = w_e · P_kcal(V) + w_p · P_prot(V) + w_f · P_fluid(V)
//
// C(V) is a piecewise-quadratic convex function of V.
// Its unconstrained minimum is found analytically by differentiating each
// active quadratic piece, then clamping to the physiological range
// [V_PHYS_MIN, V_PHYS_MAX].
//
// The optimal volume V* is reported alongside the residual cost at V*,
// which is normalised into the 0–100 viability score.

import type { EnteralFormula } from "../../types/enteralFormula";

// ── Physiological volume bounds ───────────────────────────────────────────────
const V_PHYS_MIN = 200;    // mL/day — minimum clinically meaningful EN volume
const V_PHYS_MAX = 3500;   // mL/day — upper safety ceiling

// ── Weights ───────────────────────────────────────────────────────────────────
const W_KCAL    = 0.45;
const W_PROTEIN = 0.40;
const W_FLUID   = 0.15;

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface FormulaViabilityResult {
  formula: EnteralFormula;
  /** Optimal mL/day — the volume that minimises the weighted penalty across all targets */
  optimalVolMl: number;
  /** mL/hr at continuous 24h infusion at the optimal volume */
  optimalRateMlHr: number;
  /** kcal/day delivered at optimal volume */
  actualKcal: number;
  /** Protein g/day delivered at optimal volume */
  actualProteinG: number;
  /** Free water mL/day delivered at optimal volume */
  actualFreeWaterMl: number;
  /** 0–100 composite viability score (higher = better fit) */
  score: number;
  /** Per-nutrient penalty contributions (0–100, lower = better) — for display */
  kcalPenalty: number;
  proteinPenalty: number;
  fluidPenalty: number;
  /** Human-readable flags */
  flags: string[];
  /** "great" | "good" | "marginal" | "poor" */
  tier: "great" | "good" | "marginal" | "poor";
}

export interface ViabilityTargets {
  kcalLow: number;
  kcalHigh: number;
  proteinLow: number;
  proteinHigh: number;
  /** Optional — omit or 0 to skip fluid in the optimisation */
  fluidLow?: number;
  fluidHigh?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core math
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Squared-distance penalty of a linear nutrient function f(V) = slope·V
 * against the interval [lo, hi].
 *
 * P(V) = max(0, lo - slope·V)²  +  max(0, slope·V - hi)²
 */
function penalty(V: number, slope: number, lo: number, hi: number): number {
  const val = slope * V;
  const under = Math.max(0, lo - val);
  const over  = Math.max(0, val - hi);
  return under * under + over * over;
}

/**
 * Derivative of penalty w.r.t. V:
 *
 * dP/dV = -2·slope·max(0, lo - slope·V)  +  2·slope·max(0, slope·V - hi)
 */
function dPenalty(V: number, slope: number, lo: number, hi: number): number {
  const val = slope * V;
  const under = Math.max(0, lo - val);
  const over  = Math.max(0, val - hi);
  return -2 * slope * under + 2 * slope * over;
}

/**
 * Second derivative of penalty w.r.t. V (constant per piece):
 *
 * d²P/dV² = 2·slope² when outside the interval, 0 inside.
 */
function d2Penalty(V: number, slope: number, lo: number, hi: number): number {
  const val = slope * V;
  if (val < lo || val > hi) return 2 * slope * slope;
  return 0;
}

/**
 * Find the volume V* in [V_PHYS_MIN, V_PHYS_MAX] that minimises the total
 * weighted cost C(V) using a single Newton step seeded at each "break-point"
 * volume (the V where each nutrient enters/exits its target band), then
 * picking the global minimum.
 *
 * Because C(V) is convex and piecewise-quadratic, the true minimum is either:
 *   (a) at a point where dC/dV = 0 in one of the quadratic pieces, or
 *   (b) at one of the boundary volumes.
 *
 * We evaluate C at all candidate points and return the argmin.
 */
function findOptimalVolume(
  alphaKcal: number,
  betaProt: number,
  gammaFluid: number | null,
  targets: ViabilityTargets
): number {
  const { kcalLow, kcalHigh, proteinLow, proteinHigh } = targets;
  const fluidLo = targets.fluidLow  ?? 0;
  const fluidHi = targets.fluidHigh ?? 0;
  const hasFluid = gammaFluid !== null && fluidLo > 0 && fluidHi > 0;
  const hasProtein = proteinLow > 0 && proteinHigh > 0;

  // Cost function C(V)
  const C = (V: number): number => {
    const ck = W_KCAL    * penalty(V, alphaKcal, kcalLow, kcalHigh);
    const cp = hasProtein
      ? W_PROTEIN * penalty(V, betaProt, proteinLow, proteinHigh)
      : 0;
    const cf = hasFluid
      ? W_FLUID   * penalty(V, gammaFluid!, fluidLo, fluidHi)
      : 0;
    return ck + cp + cf;
  };

  // dC/dV
  const dC = (V: number): number => {
    const dk = W_KCAL    * dPenalty(V, alphaKcal, kcalLow, kcalHigh);
    const dp = hasProtein
      ? W_PROTEIN * dPenalty(V, betaProt, proteinLow, proteinHigh)
      : 0;
    const df = hasFluid
      ? W_FLUID   * dPenalty(V, gammaFluid!, fluidLo, fluidHi)
      : 0;
    return dk + dp + df;
  };

  // d²C/dV²
  const d2C = (V: number): number => {
    const d2k = W_KCAL    * d2Penalty(V, alphaKcal, kcalLow, kcalHigh);
    const d2p = hasProtein
      ? W_PROTEIN * d2Penalty(V, betaProt, proteinLow, proteinHigh)
      : 0;
    const d2f = hasFluid
      ? W_FLUID   * d2Penalty(V, gammaFluid!, fluidLo, fluidHi)
      : 0;
    return d2k + d2p + d2f;
  };

  // ── Candidate break-point volumes ─────────────────────────────────────────
  // These are the V values where each nutrient crosses its target boundary.
  // The unconstrained minimum of each piece lies at V = -dC_piece / d2C_piece,
  // which we approximate via a Newton step from each breakpoint.
  const breakpoints: number[] = [
    V_PHYS_MIN,
    V_PHYS_MAX,
    kcalLow    / alphaKcal,
    kcalHigh   / alphaKcal,
  ];

  if (hasProtein && betaProt > 0) {
    breakpoints.push(proteinLow / betaProt, proteinHigh / betaProt);
  }
  if (hasFluid && gammaFluid! > 0) {
    breakpoints.push(fluidLo / gammaFluid!, fluidHi / gammaFluid!);
  }

  // For each breakpoint, attempt a single Newton step to the local minimum
  const candidates: number[] = [];
  for (const bp of breakpoints) {
    const V0 = Math.max(V_PHYS_MIN, Math.min(V_PHYS_MAX, bp));
    candidates.push(V0);

    // Newton step: V* ≈ V0 - dC(V0) / d2C(V0)
    const curv = d2C(V0);
    if (curv > 1e-12) {
      const step = -dC(V0) / curv;
      const Vnewton = Math.max(V_PHYS_MIN, Math.min(V_PHYS_MAX, V0 + step));
      candidates.push(Vnewton);
    }
  }

  // Also probe midpoints between consecutive sorted breakpoints
  const sorted = [...new Set(candidates)].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    candidates.push((sorted[i] + sorted[i + 1]) / 2);
  }

  // Pick the candidate with the lowest cost
  let bestV = V_PHYS_MIN;
  let bestC = Infinity;
  for (const V of candidates) {
    const cV = C(V);
    if (cV < bestC) { bestC = cV; bestV = V; }
  }

  return Math.round(bestV);
}

// ─────────────────────────────────────────────────────────────────────────────
// Score normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert the raw minimum cost C(V*) to a 0–100 viability score.
 *
 * The reference "worst case" cost is the cost of delivering zero of every
 * nutrient (V = 0), which equals:
 *   C_max = W_k · kcalMid² + W_p · protMid² + W_f · fluidMid²
 *
 * score = 100 · max(0, 1 − C(V*) / C_max)
 *
 * This gives a meaningful relative scale: 100 = perfect fit, 0 = no better
 * than giving nothing.
 */
function normaliseScore(
  costAtOptimal: number,
  targets: ViabilityTargets,
  hasProtein: boolean,
  hasFluid: boolean
): number {
  const kcalMid  = (targets.kcalLow + targets.kcalHigh) / 2;
  const protMid  = hasProtein
    ? (targets.proteinLow + targets.proteinHigh) / 2
    : 0;
  const fluidMid = hasFluid
    ? ((targets.fluidLow ?? 0) + (targets.fluidHigh ?? 0)) / 2
    : 0;

  const cMax =
    W_KCAL    * kcalMid  * kcalMid +
    W_PROTEIN * protMid  * protMid +
    W_FLUID   * fluidMid * fluidMid;

  if (cMax < 1e-9) return 0;
  return Math.max(0, Math.round(100 * (1 - costAtOptimal / cMax)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a single EN formula against provided targets using variational
 * optimisation. Returns null when the formula lacks minimum required data.
 */
export function scoreFormula(
  formula: EnteralFormula,
  targets: ViabilityTargets
): FormulaViabilityResult | null {
  const { kcalLow, kcalHigh, proteinLow, proteinHigh } = targets;

  if (
    formula.kcal_per_ml === null ||
    formula.protein_g_per_l === null ||
    kcalLow <= 0 || kcalHigh <= 0
  ) {
    return null;
  }

  const alphaKcal  = formula.kcal_per_ml;
  const betaProt   = formula.protein_g_per_l / 1000;
  const gammaFluid = formula.free_water_pct !== null
    ? formula.free_water_pct / 100
    : null;

  const hasProtein = proteinLow > 0 && proteinHigh > 0;
  const hasFluid   = gammaFluid !== null &&
                     (targets.fluidLow ?? 0) > 0 &&
                     (targets.fluidHigh ?? 0) > 0;

  // ── Find optimal volume ───────────────────────────────────────────────────
  const V = findOptimalVolume(alphaKcal, betaProt, gammaFluid, targets);

  // ── Compute actual deliveries at V ────────────────────────────────────────
  const actualKcal        = alphaKcal * V;
  const actualProteinG    = betaProt  * V;
  const actualFreeWaterMl = gammaFluid !== null ? gammaFluid * V : 0;

  // ── Per-nutrient raw penalties at V ───────────────────────────────────────
  const rawKcalPenalty  = penalty(V, alphaKcal, kcalLow, kcalHigh);
  const rawProtPenalty  = hasProtein
    ? penalty(V, betaProt, proteinLow, proteinHigh)
    : 0;
  const rawFluidPenalty = hasFluid
    ? penalty(V, gammaFluid!, targets.fluidLow!, targets.fluidHigh!)
    : 0;

  const totalCost =
    W_KCAL    * rawKcalPenalty +
    W_PROTEIN * rawProtPenalty +
    W_FLUID   * rawFluidPenalty;

  // ── Composite score ───────────────────────────────────────────────────────
  const score = normaliseScore(totalCost, targets, hasProtein, hasFluid);

  // ── Per-nutrient penalty display values (0–100, lower = better fit) ───────
  // Normalise each penalty by its single-nutrient "worst case" (mid²)
  const kcalMid  = (kcalLow + kcalHigh) / 2;
  const protMid  = hasProtein ? (proteinLow + proteinHigh) / 2 : 1;
  const fluidMid = hasFluid
    ? ((targets.fluidLow ?? 0) + (targets.fluidHigh ?? 0)) / 2
    : 1;

  const kcalPenalty  = Math.min(100, Math.round(rawKcalPenalty  / (kcalMid  * kcalMid)  * 100));
  const proteinPenalty = hasProtein
    ? Math.min(100, Math.round(rawProtPenalty  / (protMid  * protMid)  * 100))
    : 0;
  const fluidPenalty = hasFluid
    ? Math.min(100, Math.round(rawFluidPenalty / (fluidMid * fluidMid) * 100))
    : 0;

  // ── Flags ─────────────────────────────────────────────────────────────────
  const flags: string[] = [];

  if (V >= V_PHYS_MAX - 50)
    flags.push(`Volume capped at ${V} mL/day`);
  else if (V > 3000)
    flags.push(`High volume: ${V} mL/day`);

  if (actualKcal < kcalLow * 0.9)
    flags.push(`Kcal short: ${Math.round(actualKcal)} / ${Math.round(kcalLow)} kcal min`);
  else if (actualKcal > kcalHigh * 1.1)
    flags.push(`Kcal excess: ${Math.round(actualKcal)} / ${Math.round(kcalHigh)} kcal max`);

  if (hasProtein && actualProteinG < proteinLow * 0.85)
    flags.push(`Protein short: ${actualProteinG.toFixed(1)}g / ${proteinLow}g min`);
  else if (hasProtein && actualProteinG > proteinHigh * 1.15)
    flags.push(`Protein excess: ${actualProteinG.toFixed(1)}g / ${proteinHigh}g max`);

  if (hasFluid && actualFreeWaterMl < targets.fluidLow! * 0.6)
    flags.push(`Low free water: ${Math.round(actualFreeWaterMl)} mL/day`);

  if (formula.route === "post-pyloric")
    flags.push("Post-pyloric route");

  // ── Tier ──────────────────────────────────────────────────────────────────
  let tier: FormulaViabilityResult["tier"];
  if (score >= 85)      tier = "great";
  else if (score >= 65) tier = "good";
  else if (score >= 40) tier = "marginal";
  else                  tier = "poor";

  return {
    formula,
    optimalVolMl:     V,
    optimalRateMlHr:  Math.round((V / 24) * 10) / 10,
    actualKcal:       Math.round(actualKcal),
    actualProteinG:   Math.round(actualProteinG * 10) / 10,
    actualFreeWaterMl: Math.round(actualFreeWaterMl),
    score,
    kcalPenalty,
    proteinPenalty,
    fluidPenalty,
    flags,
    tier,
  };
}

/**
 * Score all formulas and return them sorted by score descending.
 * Formulas without sufficient data are excluded.
 */
export function rankFormulas(
  formulas: EnteralFormula[],
  targets: ViabilityTargets
): FormulaViabilityResult[] {
  return formulas
    .map((f) => scoreFormula(f, targets))
    .filter((r): r is FormulaViabilityResult => r !== null)
    .sort((a, b) => b.score - a.score || a.formula.name.localeCompare(b.formula.name));
}