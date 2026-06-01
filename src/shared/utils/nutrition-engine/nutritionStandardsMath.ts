// src/shared/utils/nutrition-engine/nutritionStandardsMath.ts
//
// Re-exports all math primitives from the canonical source (clinicalMath.ts).
// Do NOT add implementations here — add them to clinicalMath.ts and re-export.
//
// This file exists solely so the nutrition engine barrel (nutritionStandards.ts)
// and its sub-engines can import from a single local path without reaching
// outside the nutrition-engine folder, preventing circular dependency issues.

import type { EvalStatus } from "../../../types/standards";

export {
  // Body composition
  calcIBW,
  calcBSA,

  // REE / BMR
  calcHarrisBenedict,
  calcMSJ,
  calcPSU2003b,
  calcPSU2010,
  calcToronto,
  calcSchofieldBMR,
  calcFleischBMR,
  calcCFBMR,
  calcSCDREEPeds,

  // Fluid
  calcHolidaySegar,

  // Eval helpers
  evalStatus,
  fmtRange,

  // Age gate
  isPedsAge,
} from "../clinicalMath";

// EvalStatus is a type re-export — keep it here for consumers that import it
// alongside the math helpers from this path.
export type { EvalStatus };
