// src/types/refeedingScreen.ts
// Types for the RD2B Refeeding Risk Screen tool.
// Based on: ASPEN Refeeding Syndrome consensus criteria.

export type RiskLevel = "none" | "moderate" | "significant";

// ── Criterion 2: Weight Loss ──────────────────────────────────────────────────

/**
 * How the weight loss criterion is fulfilled:
 *   "auto"   — calculated from anthro UBW + note date (within 6-month window)
 *   "manual" — UBW unavailable or outside window; clinician enters values
 *   "na"     — criterion cannot be assessed
 */
export type WtLossSource = "auto" | "manual" | "na";

// ── Criterion 3: Energy Intake ─────────────────────────────────────────────────

/**
 * Which sub-criterion the clinician is using for energy intake:
 *   "option1" — None or negligible oral intake for N days
 *   "option2" — <X% of estimated EER for N days during acute illness/injury
 *   "option3" — <X% of estimated EER for N days (general, >1 month context)
 */
export type EnergyIntakeOption = "option1" | "option2" | "option3" | "";

// ── Criterion 4: Electrolytes ─────────────────────────────────────────────────

export interface ElectrolyteCriterion {
  /** Clinical judgment: "none" | "moderate" | "significant" */
  potassium: RiskLevel;
  phosphorus: RiskLevel;
  magnesium: RiskLevel;
}

// ── Root Screen State ─────────────────────────────────────────────────────────

export interface RefeedingScreen {
  // Criterion 1: BMI (auto-populated from useCalculatedMetrics)
  c1_override: boolean; // if true, clinician overrides auto-result
  c1_manualRisk: RiskLevel;

  // Criterion 2: Weight Loss
  c2_source: WtLossSource;
  c2_manualPct: string;   // % weight loss (manual entry)
  c2_manualDays: string;  // days over which loss occurred (manual entry)
  c2_override: boolean;
  c2_manualRisk: RiskLevel;

  // Criterion 3: Energy Intake
  c3_option: EnergyIntakeOption;
  c3_intakePct: string;   // % of estimated EER (options 2 & 3, or auto from dietary)
  c3_intakeDays: string;  // number of days
  c3_override: boolean;
  c3_manualRisk: RiskLevel;

  // Criterion 4: Electrolytes (always clinical judgment)
  c4_electrolytes: ElectrolyteCriterion;

  // Criterion 5: Fat Loss (auto from NFPE)
  c5_override: boolean;
  c5_manualRisk: RiskLevel;

  // Criterion 6: Muscle Loss (auto from NFPE)
  c6_override: boolean;
  c6_manualRisk: RiskLevel;

  // Criterion 7: Comorbidities (always clinical judgment)
  c7_selected: string[]; // selected comorbidity labels

  // Clinician notes
  screenNotes: string;

  // Timestamp of last screen run (ISO string)
  screenedAt: string;
}