/**
 * Growth Standards Data
 * src/shared/data/growthStandards.ts
 *
 * Single location for all WHO and CDC growth standard ?raw CSV imports.
 * Each dataset is parsed once at module load and exported as a typed
 * LMSRow[] array. No component or utility should import ?raw CSV strings
 * directly — they import from here instead.
 *
 * WHO tables (0–730 days, keyed by Day):
 *   Weight-for-age, Length/height-for-age, Weight-for-length,
 *   BMI-for-age, Head-circumference-for-age
 *
 * CDC tables (24–240 months, keyed by Agemos + Sex):
 *   Weight-for-age, Stature-for-age, BMI-for-age
 *
 * Sex encoding:
 *   WHO tables: no Sex column — separate files per sex
 *   CDC tables: Sex column — 1 = Male, 2 = Female
 */

import { parseGrowthCSV, LMSRow } from "../utils/growthStandardsMath";

// ─── WHO 0–730 days ───────────────────────────────────────────────────────────

import wfaBoysRaw from "../assets/datafiles_cleaned_csv/0_730_days/weight_for_age-boys-zscore-expanded-tables.csv?raw";
import wfaGirlsRaw from "../assets/datafiles_cleaned_csv/0_730_days/weight_for_age-girls-zscore-expanded-tables.csv?raw";
import lfaBoysRaw from "../assets/datafiles_cleaned_csv/0_730_days/lengthheight_for_age-boys-zscore-expanded-tables.csv?raw";
import lfaGirlsRaw from "../assets/datafiles_cleaned_csv/0_730_days/lengthheight_for_age-girls-zscore-expanded-tables.csv?raw";
import wflBoysRaw from "../assets/datafiles_cleaned_csv/0_730_days/weight_for_length-boys-zscore-expanded-table.csv?raw";
import wflGirlsRaw from "../assets/datafiles_cleaned_csv/0_730_days/weight_for_length-girls-zscore-expanded-table.csv?raw";
import bfaBoysRaw from "../assets/datafiles_cleaned_csv/0_730_days/bmi_for_age-boys-zscore-expanded-tables.csv?raw";
import bfaGirlsRaw from "../assets/datafiles_cleaned_csv/0_730_days/bmi_for_age-girls-zscore-expanded-tables.csv?raw";
import hfaBoysRaw from "../assets/datafiles_cleaned_csv/0_730_days/headcircumference_for_age-boys-zscore-expanded-tables.csv?raw";
import hfaGirlsRaw from "../assets/datafiles_cleaned_csv/0_730_days/headcircumference_for_age-girls-zscore-expanded-tables.csv?raw";

// ─── CDC 24–240 months ────────────────────────────────────────────────────────

import wtageRaw from "../assets/datafiles_cleaned_csv/24_240_months/wtage.csv?raw";
import statageRaw from "../assets/datafiles_cleaned_csv/24_240_months/statage.csv?raw";
import bmiageRaw from "../assets/datafiles_cleaned_csv/24_240_months/bmiagerev.csv?raw";

// ─── Parsed exports — WHO ─────────────────────────────────────────────────────

/** WHO weight-for-age boys (0–730 days). Key column: Day */
export const whoWfaBoys: LMSRow[] = parseGrowthCSV(wfaBoysRaw);

/** WHO weight-for-age girls (0–730 days). Key column: Day */
export const whoWfaGirls: LMSRow[] = parseGrowthCSV(wfaGirlsRaw);

/** WHO length/height-for-age boys (0–730 days). Key column: Day */
export const whoLfaBoys: LMSRow[] = parseGrowthCSV(lfaBoysRaw);

/** WHO length/height-for-age girls (0–730 days). Key column: Day */
export const whoLfaGirls: LMSRow[] = parseGrowthCSV(lfaGirlsRaw);

/** WHO weight-for-length boys (0–730 days). Key column: Length */
export const whoWflBoys: LMSRow[] = parseGrowthCSV(wflBoysRaw);

/** WHO weight-for-length girls (0–730 days). Key column: Length */
export const whoWflGirls: LMSRow[] = parseGrowthCSV(wflGirlsRaw);

/** WHO BMI-for-age boys (0–730 days). Key column: Day */
export const whoBfaBoys: LMSRow[] = parseGrowthCSV(bfaBoysRaw);

/** WHO BMI-for-age girls (0–730 days). Key column: Day */
export const whoBfaGirls: LMSRow[] = parseGrowthCSV(bfaGirlsRaw);

/** WHO head-circumference-for-age boys (0–730 days). Key column: Day */
export const whoHfaBoys: LMSRow[] = parseGrowthCSV(hfaBoysRaw);

/** WHO head-circumference-for-age girls (0–730 days). Key column: Day */
export const whoHfaGirls: LMSRow[] = parseGrowthCSV(hfaGirlsRaw);

// ─── Parsed exports — CDC ─────────────────────────────────────────────────────

/** CDC weight-for-age (24–240 months). Key columns: Sex, Agemos */
export const cdcWtage: LMSRow[] = parseGrowthCSV(wtageRaw);

/** CDC stature-for-age (24–240 months). Key columns: Sex, Agemos */
export const cdcStatage: LMSRow[] = parseGrowthCSV(statageRaw);

/** CDC BMI-for-age (24–240 months). Key columns: Sex, Agemos */
export const cdcBmiage: LMSRow[] = parseGrowthCSV(bmiageRaw);

// ─── Convenience selectors ────────────────────────────────────────────────────

/** Return the correct WHO weight-for-age dataset for a given sex. */
export function whoWfa(sex: "M" | "F"): LMSRow[] {
  return sex === "M" ? whoWfaBoys : whoWfaGirls;
}

/** Return the correct WHO length-for-age dataset for a given sex. */
export function whoLfa(sex: "M" | "F"): LMSRow[] {
  return sex === "M" ? whoLfaBoys : whoLfaGirls;
}

/** Return the correct WHO weight-for-length dataset for a given sex. */
export function whoWfl(sex: "M" | "F"): LMSRow[] {
  return sex === "M" ? whoWflBoys : whoWflGirls;
}

/** Return the correct WHO BMI-for-age dataset for a given sex. */
export function whoBfa(sex: "M" | "F"): LMSRow[] {
  return sex === "M" ? whoBfaBoys : whoBfaGirls;
}

/** Return the correct WHO head-circumference-for-age dataset for a given sex. */
export function whoHfa(sex: "M" | "F"): LMSRow[] {
  return sex === "M" ? whoHfaBoys : whoHfaGirls;
}

/**
 * Return CDC rows pre-filtered by sex.
 * CDC Sex column: 1 = Male, 2 = Female.
 */
export function cdcBySex(data: LMSRow[], sex: "M" | "F"): LMSRow[] {
  const code = sex === "M" ? 1 : 2;
  return data.filter((r) => r["Sex"] === code);
}