// src/features/diagnosis/pediatricMalnutritionEngine.ts
//
// Pediatric malnutrition diagnostic engine.
// Implements the full ASPEN/AND pediatric malnutrition criteria table:
//
// SECTION 1 — Primary Indicators (1 data point sufficient for diagnosis)
//   • Wt-for-length Z (infants, 0–<2y)
//   • BMI-for-age Z   (2–20y)
//   • Length/Ht Z     (stunting; moderate/severe only)
//   • MUAC Z          (>6 mo; not yet tracked — skeleton present)
//
// SECTION 2 — Multi-indicator block (requires ≥2 data points AND ≥2 indicators)
//   • Deceleration in wt-for-length or height Z
//   • Inadequate nutrient intake
//   • Physical assessment (muscle or fat loss from NFPE)
//   • Functional capacity for age
//
// SECTION 3 — Age-conditional velocity/loss block (pick the right age group)
//   < 2 years (pick one):
//     • Δ Wt-for-age Z   (decline in 1 / 2 / 3 Z)
//     • WHO wt gain velocity Z   (-1 to 1.99 / -2 to -2.9 / ≤ -3)
//     • Wt gain velocity % of norm   (<75% / <50% / <25%)
//     • Wt loss %   (5% / 7.5% / 10% UBW)
//   2–20 years (pick one):
//     • Δ Wt-for-age Z   (0.66 / 0.67–1.33 / ≥1.34 decline)

export type Severity = "None" | "Mild" | "Moderate" | "Severe" | "Not Applicable";

// ─── Section 1: Primary Indicator Results ────────────────────────────────────

export interface PrimaryIndicators {
  /** Wt-for-length Z (infants 0–<2y). null when not applicable (≥2y or no data). */
  wtForLengthZ: number | null;
  wtForLengthSev: Severity;

  /** BMI-for-age Z (2–20y). null when not applicable or no data. */
  bmiForAgeZ: number | null;
  bmiForAgeSev: Severity;

  /** Length/Height-for-age Z (stunting; moderate/severe thresholds only). */
  lengthHtZ: number | null;
  lengthHtSev: Severity;

  /** MUAC Z-score (>6 mo). Not yet tracked in anthro — always null/None for now. */
  muacZ: number | null;
  muacSev: Severity;
}

// ─── Section 2: Multi-Indicator Results ──────────────────────────────────────

export interface MultiIndicators {
  /** Decline in wt-for-length or height Z from past measurement */
  decelerationZ: number | null;
  decelerationSev: Severity;

  /** Estimated energy/protein intake as % of needs */
  nutrientIntakePct: number | null;
  nutrientIntakeSev: Severity;

  /**
   * Physical assessment (NFPE muscle or fat loss).
   * Derived from useClinicalStore muscle/fat fields.
   * "None" = no wasting found; "Moderate" = mild/moderate wasting; "Severe" = severe wasting.
   */
  physicalAssessmentSev: Severity;
  /** Human-readable summary of worst NFPE finding */
  physicalAssessmentNote: string;

  /**
   * Functional capacity for age.
   * Severe: significantly reduced ability to perform ADLs, confined to bed/chair >50% waking time,
   *         measurably reduced strength, postural HR change >20 bpm or SBP fall >20 mmHg / DBP >10 mmHg.
   * Moderate: reduced ability to perform previous ADLs, less energy, tired more often.
   * Mild: no impairment, able to perform age-appropriate activity.
   * Derived from gripStrength field.
   */
  functionalCapacitySev: Severity;
  functionalCapacityNote: string;

  /** True when ≥2 of the four multi-indicators above are ≥ Moderate */
  meetsMultiIndicatorThreshold: boolean;
}

// ─── Section 3: Age-Conditional Velocity / Loss Results ──────────────────────

export interface AgeConditionalIndicators {
  ageGroup: "infant" | "child"; // < 2y → infant, 2–20y → child

  // ── Infant block (< 2y) ──────────────────────────────────────────────────
  /** Δ Wt-for-age Z from past measurement (infant thresholds: 1 / 2 / 3 Z decline) */
  deltaWtForAgeZ_infant: number | null;
  deltaWtForAgeZ_infantSev: Severity;

  /** WHO wt gain velocity Z-score. Not yet computed (needs velocity table). */
  wtGainVelocityZ: number | null;
  wtGainVelocityZSev: Severity;

  /** Wt gain velocity as % of expected norm for age/sex. Not yet computed. */
  wtGainVelocityPct: number | null;
  wtGainVelocityPctSev: Severity;

  // ── Child block (2–20y) ──────────────────────────────────────────────────
  /** Wt loss % of UBW (child thresholds: 5% / 7.5% / 10%) */
  wtLossPct_child: number | null;
  wtLossPct_childSev: Severity;

  /**
   * Δ Wt-for-age Z (child thresholds differ from infant):
   *   Mild:     0.66 Z decline
   *   Moderate: 0.67–1.33 Z decline
   *   Severe:   ≥1.34 Z decline
   */
  deltaWtForAgeZ_child: number | null;
  deltaWtForAgeZ_childSev: Severity;
  }

  // ─── Full Criteria Bundle ─────────────────────────────────────────────────────

  export interface PediatricMalnutritionCriteria {
  primary: PrimaryIndicators;
  multi: MultiIndicators;
  ageConditional: AgeConditionalIndicators;
  }

  // ─── Diagnosis Result ─────────────────────────────────────────────────────────

  export interface PediatricMalnutritionDiagnosis {
  diagnosis: "None" | "Mild Malnutrition" | "Moderate Malnutrition" | "Severe Malnutrition";
  reasoning: string[];
  /** Which section drove the diagnosis */
  drivingSection: "primary" | "multi" | "age-conditional" | "none";
  /** The highest severity found across all criteria (for display colouring) */
  highestSeverity: Severity;
  }

  // ─── Section 1 Evaluators ─────────────────────────────────────────────────────

  /** Standard Z-score → severity (all four thresholds including Mild). */
  export function evaluateZScoreSeverity(z: number | null): Severity {
  if (z === null) return "Not Applicable";
  if (z <= -3) return "Severe";
  if (z <= -2) return "Moderate";
  if (z <= -1) return "Mild";
  return "None";
  }

  /** Length/Height Z uses Moderate/Severe only (no Mild stunting in ASPEN criteria). */
  export function evaluateLengthHtZ(z: number | null): Severity {
  if (z === null) return "Not Applicable";
  if (z <= -3) return "Severe";
  if (z <= -2) return "Moderate";
  return "None";
  }

  // ─── Section 2 Evaluators ─────────────────────────────────────────────────────

  /** Deceleration in wt-for-length or height Z from a past measurement. */
  export function evaluateDecelerationZ(delta: number | null): Severity {
  if (delta === null) return "Not Applicable";
  // delta is current − past; a decline is negative
  const decline = -delta; // positive = worsening
  if (decline >= 3) return "Severe";
  if (decline >= 2) return "Moderate";
  if (decline >= 1) return "Mild";
  return "None";
  }

  /** Nutrient intake as % of estimated needs. */
  export function evaluateNutrientIntake(pct: number | null): Severity {
  if (pct === null) return "Not Applicable";
  if (pct <= 25) return "Severe";
  if (pct <= 50) return "Moderate";
  if (pct <= 75) return "Mild";
  return "None";
  }

  /**
  * Derive physical assessment severity from raw NFPE fields.
  * Accepts the muscle fields and fat fields as string arrays.
  * Returns the worst severity found across all fields.
  */
  export function evaluatePhysicalAssessment(
  muscleValues: string[],
  fatValues: string[]
  ): { sev: Severity; note: string } {
  const all = [...muscleValues, ...fatValues];
  let worst: Severity = "None";
  const abnormal: string[] = [];

  for (const v of all) {
    if (v === "Severe") { worst = "Severe"; abnormal.push(v); }
    else if (v === "Moderate" && worst !== "Severe") { worst = "Moderate"; abnormal.push(v); }
    else if (v === "Mild" && worst === "None") { worst = "Mild"; abnormal.push(v); }
  }

  const note = worst === "None"
    ? "No wasting documented on NFPE"
    : `${worst} wasting documented on NFPE`;

  return { sev: worst, note };
  }

  /**
  * Derive functional capacity severity from grip strength + clinical context.
  * Severe criteria (from spreadsheet): measurably reduced strength, confined to bed/chair
  * >50% waking time, postural HR/BP changes.
  * We map the current grip strength field:
  *   "Measurably Reduced" → Moderate (one indicator; Severe requires additional functional signs
  *   not yet tracked — flagged for future expansion).
  */
  export function evaluateFunctionalCapacity(
  gripStrength: string
  ): { sev: Severity; note: string } {
  if (gripStrength === "Measurably Reduced") {
    return {
      sev: "Moderate",
      note: "Measurably reduced grip strength",
    };
  }
  return { sev: "None", note: "No functional impairment documented" };
  }

  // ─── Section 3 Evaluators ─────────────────────────────────────────────────────

  /** Δ Wt-for-age Z for infants (<2y): thresholds are 1 / 2 / 3 Z decline. */
  export function evaluateDeltaWtForAgeZ_infant(delta: number | null): Severity {
  if (delta === null) return "Not Applicable";
  const decline = -delta;
  if (decline >= 3) return "Severe";
  if (decline >= 2) return "Moderate";
  if (decline >= 1) return "Mild";
  return "None";
  }

  /**
  * Δ Wt-for-age Z for children (2–20y): thresholds differ:
  *   Mild:     0.66 Z decline
  *   Moderate: 0.67–1.33 Z decline
  *   Severe:   ≥1.34 Z decline
  */
  export function evaluateDeltaWtForAgeZ_child(delta: number | null): Severity {
  if (delta === null) return "Not Applicable";
  const decline = -delta;
  if (decline >= 1.34) return "Severe";
  if (decline >= 0.67) return "Moderate";
  if (decline >= 0.66) return "Mild";
  return "None";
  }

  /** WHO wt gain velocity Z-score for infants. */
  export function evaluateWtGainVelocityZ(z: number | null): Severity {
  if (z === null) return "Not Applicable";
  if (z <= -3) return "Severe";
  if (z <= -2) return "Moderate";       // -2 to -2.9
  if (z < -1) return "Mild";            // -1 to -1.99
  return "None";
  }

  /** Wt gain velocity as % of expected norm. */
  export function evaluateWtGainVelocityPct(pct: number | null): Severity {
  if (pct === null) return "Not Applicable";
  if (pct < 25) return "Severe";
  if (pct < 50) return "Moderate";
  if (pct < 75) return "Mild";
  return "None";
  }

  /** Wt loss % of UBW (same thresholds for both age groups: 5% / 7.5% / 10%). */
  export function evaluateWtLossPct(pct: number | null): Severity {
  if (pct === null) return "Not Applicable";
  if (pct >= 10) return "Severe";
  if (pct >= 7.5) return "Moderate";
  if (pct >= 5) return "Mild";
  return "None";
  }

  // ─── Diagnosis Aggregator ─────────────────────────────────────────────────────

  const SEV_RANK: Record<Severity, number> = {
  "None": 0,
  "Not Applicable": 0,
  "Mild": 1,
  "Moderate": 2,
  "Severe": 3,
  };

  function maxSev(...sevs: Severity[]): Severity {
  return sevs.reduce<Severity>((best, s) =>
    SEV_RANK[s] > SEV_RANK[best] ? s : best, "None");
  }

  function sevToLabel(s: Severity): "None" | "Mild Malnutrition" | "Moderate Malnutrition" | "Severe Malnutrition" {
  if (s === "Severe") return "Severe Malnutrition";
  if (s === "Moderate") return "Moderate Malnutrition";
  if (s === "Mild") return "Mild Malnutrition";
  return "None";
  }

  export function diagnosePediatricMalnutrition(
  criteria: PediatricMalnutritionCriteria
  ): PediatricMalnutritionDiagnosis {
  const reasoning: string[] = [];
  let highestSev: Severity = "None";
  let drivingSection: PediatricMalnutritionDiagnosis["drivingSection"] = "none";

  // ── Section 1: any primary indicator alone is sufficient ─────────────────
  const primarySev = maxSev(
    criteria.primary.wtForLengthSev,
    criteria.primary.bmiForAgeSev,
    criteria.primary.lengthHtSev,
    criteria.primary.muacSev,
  );

  if (SEV_RANK[primarySev] > SEV_RANK[highestSev]) {
    highestSev = primarySev;
    drivingSection = "primary";
  }
  if (primarySev !== "None" && primarySev !== "Not Applicable") {
    reasoning.push(`Primary indicator: ${primarySev.toLowerCase()} Z-score criterion met (1 data point sufficient).`);
  }

  // ── Section 2: multi-indicator block requires ≥2 indicators ─ ─ ─ ─ ─ ─ ─
  const multiSevs: Severity[] = [
    criteria.multi.decelerationSev,
    criteria.multi.nutrientIntakeSev,
    criteria.multi.physicalAssessmentSev,
    criteria.multi.functionalCapacitySev,
  ];

  const multiMet = multiSevs.filter(s => SEV_RANK[s] >= SEV_RANK["Moderate"]);
  const multiMildMet = multiSevs.filter(s => SEV_RANK[s] >= SEV_RANK["Mild"]);

  if (multiMet.length >= 2) {
    const sec2Sev = maxSev(...multiMet);
    if (SEV_RANK[sec2Sev] > SEV_RANK[highestSev]) {
      highestSev = sec2Sev;
      drivingSection = "multi";
    }
    reasoning.push(`Multi-indicator block: ${multiMet.length} indicators ≥ Moderate met (requires ≥2). Highest: ${sec2Sev}.`);
  } else if (multiMildMet.length >= 2) {
    if (SEV_RANK["Mild"] > SEV_RANK[highestSev]) {
      highestSev = "Mild";
      drivingSection = "multi";
    }
    reasoning.push(`Multi-indicator block: ${multiMildMet.length} Mild indicators met — Mild malnutrition.`);
  } else if (multiMildMet.length === 1) {
    reasoning.push(`Multi-indicator block: only 1 indicator met — insufficient (requires ≥2 data points AND ≥2 indicators).`);
  }

  // ── Section 3: age-conditional block ─────────────────────────────────────
  const ac = criteria.ageConditional;

  if (ac.ageGroup === "infant") {
    const infantSev = maxSev(
      ac.deltaWtForAgeZ_infantSev,
      ac.wtGainVelocityZSev,
      ac.wtGainVelocityPctSev,
    );
    if (SEV_RANK[infantSev] > SEV_RANK[highestSev]) {
      highestSev = infantSev;
      drivingSection = "age-conditional";
    }
    if (infantSev !== "None" && infantSev !== "Not Applicable") {
      reasoning.push(`Infant velocity/loss block: ${infantSev.toLowerCase()} criterion met.`);
    }
  } else {
    const combinedChildSev = maxSev(
      ac.wtLossPct_childSev,
      ac.deltaWtForAgeZ_childSev,
    );
    if (SEV_RANK[combinedChildSev] > SEV_RANK[highestSev]) {
      highestSev = combinedChildSev;
      drivingSection = "age-conditional";
    }
    if (combinedChildSev !== "None" && combinedChildSev !== "Not Applicable") {
      reasoning.push(`Child age-conditional block (2–20y): ${combinedChildSev.toLowerCase()} criterion met.`);
    }
  }

  if (highestSev === "None") {
    reasoning.push("No malnutrition criteria met across all sections.");
  }

  return {
    diagnosis: sevToLabel(highestSev),
    reasoning,
    drivingSection,
    highestSeverity: highestSev,
  };
}