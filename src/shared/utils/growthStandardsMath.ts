/**
 * Growth Standards Math
 * src/shared/utils/growthStandardsMath.ts
 *
 * Pure functions for WHO/CDC LMS-based growth standard calculations.
 * No asset imports, no store imports, no side effects.
 *
 * Single source of truth for:
 *   - CSV parsing
 *   - Closest-row lookup
 *   - LMS z-score (with WHO extreme-value adjustment)
 *   - Reverse LMS (z-score → measurement value)
 *   - Standard normal CDF
 *
 * Consumers:
 *   - src/shared/data/growthStandards.ts       (CSV parsing)
 *   - src/shared/utils/pediatricWeightStatus.ts (z-score + CDF)
 *   - src/features/assessment/assess-anthro/GrowthStandardsTable.tsx
 *                                               (all functions)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single row from a WHO or CDC LMS CSV file. */
export interface LMSRow {
  [key: string]: number;
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a raw CSV string (from a Vite `?raw` import) into an array of
 * numeric row objects keyed by header name.
 */
export function parseGrowthCSV(raw: string): LMSRow[] {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const result: LMSRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = lines[i].split(",");
    const obj: LMSRow = {};
    headers.forEach((h, j) => {
      obj[h] = parseFloat(values[j]);
    });
    result.push(obj);
  }
  return result;
}

// ─── Row Lookup ───────────────────────────────────────────────────────────────

/**
 * Return the row whose `keyCol` value is closest to `target`.
 * Returns null only when the data array is empty.
 */
export function getClosestRow(
  data: LMSRow[],
  keyCol: string,
  target: number
): LMSRow | null {
  if (data.length === 0) return null;
  let best = data[0];
  let bestDiff = Math.abs(data[0][keyCol] - target);
  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i][keyCol] - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = data[i];
    }
  }
  return best;
}

// ─── Standard Normal CDF ──────────────────────────────────────────────────────

/**
 * Approximation of the standard normal cumulative distribution function.
 * Accuracy is sufficient for clinical percentile display (±0.0001).
 * Uses the Horner-form rational approximation (Abramowitz & Stegun 26.2.17).
 */
export function stdNormCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423;
  const p =
    1 -
    d *
      Math.exp((-x * x) / 2) *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? p : 1 - p;
}

// ─── LMS Z-Score ─────────────────────────────────────────────────────────────

/**
 * Compute a z-score from an observed measurement using the LMS method.
 *
 * For WHO tables (isCDC = false), applies the WHO-recommended adjustment for
 * |z| > 3 to prevent implausible extrapolation at the tails. This adjustment
 * is not applied for CDC tables.
 *
 * @param observed   The measured value (weight kg, length cm, BMI kg/m², etc.)
 * @param L          Box-Cox power (skewness)
 * @param M          Median
 * @param S          Coefficient of variation
 * @param isCDC      True for CDC tables; disables the WHO tail adjustment
 */
export function calcLMSZScore(
  observed: number,
  L: number,
  M: number,
  S: number,
  isCDC: boolean
): number {
  const zInitial = (Math.pow(observed / M, L) - 1) / (S * L);

  if (isCDC || Math.abs(zInitial) <= 3) return zInitial;

  // WHO extreme z-score adjustment (applied when |z| > 3)
  const SD2pos = M * Math.pow(1 + L * S * 2, 1 / L);
  const SD2neg = M * Math.pow(1 + L * S * -2, 1 / L);
  const SD3pos = M * Math.pow(1 + L * S * 3, 1 / L);
  const SD3neg = M * Math.pow(1 + L * S * -3, 1 / L);

  if (zInitial > 3) {
    return 3 + (observed - SD3pos) / (SD3pos - SD2pos);
  }
  return -3 + (observed - SD3neg) / (SD2neg - SD3neg);
}

/**
 * Reverse LMS: given a z-score and LMS parameters, return the corresponding
 * measurement value. Used to project "expected" values at a maintained
 * percentile (e.g., expected weight gain per month).
 *
 * Applies the same WHO tail adjustment as calcLMSZScore for |z| > 3.
 *
 * @param z      Target z-score
 * @param L      Box-Cox power
 * @param M      Median
 * @param S      Coefficient of variation
 * @param isCDC  True for CDC tables
 */
export function calcLMSValue(
  z: number,
  L: number,
  M: number,
  S: number,
  isCDC: boolean
): number {
  if (isCDC || Math.abs(z) <= 3) {
    return M * Math.pow(1 + L * S * z, 1 / L);
  }

  // WHO extreme value reconstruction
  const SD2pos = M * Math.pow(1 + L * S * 2, 1 / L);
  const SD2neg = M * Math.pow(1 + L * S * -2, 1 / L);
  const SD3pos = M * Math.pow(1 + L * S * 3, 1 / L);
  const SD3neg = M * Math.pow(1 + L * S * -3, 1 / L);

  if (z > 3) {
    return SD3pos + (z - 3) * (SD3pos - SD2pos);
  }
  return SD3neg + (z + 3) * (SD2neg - SD3neg);
}

// ─── Velocity & Deltas ───────────────────────────────────────────────────────

/**
 * Return the linear difference between two z-scores.
 */
export function calculateZScoreDelta(currentZ: number, pastZ: number): number {
  return currentZ - pastZ;
}

/**
 * Calculate growth velocity (weight gain/loss per day).
 * @param currentWt  Current weight in kg
 * @param pastWt     Past weight in kg
 * @param timeDiff   Time difference in days
 * @returns          Velocity in g/day
 */
export function calculateGrowthVelocity(
  currentWt: number,
  pastWt: number,
  timeDiff: number
): number {
  if (timeDiff <= 0) return 0;
  return ((currentWt - pastWt) / timeDiff) * 1000;
}