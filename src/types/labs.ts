// src/types/labs.ts
// Phase 1 overhaul: LabEntry now carries LOINC metadata.
// Keys are stable catalog slugs (e.g. "hba1c", "bun"), NOT display names.

export interface LabEntry {
  /** Clinician-entered value for the most recent draw */
  current: string;
  /** Clinician-entered prior value for trend comparison */
  historical: string;
  /** Display unit — defaults to CatalogEntry.defaultUnit, editable per-note */
  unit: string;
  /** LOINC_NUM for this entry (carried forward from catalog or API search) */
  loincCode: string;
  /** Human-readable LOINC long name (from catalog or API search result) */
  loincName: string;
}

/**
 * Labs keyed by stable catalog slug ID (e.g. "hba1c", "bun").
 * Only keys with at least one populated field are persisted to the DB.
 */
export type Labs = Record<string, LabEntry>;

// ── Preset ────────────────────────────────────────────────────────────────────

export interface LabPreset {
  /** UUID — generated client-side, persisted to DB */
  id: string;
  /** User-chosen display name (e.g. "ICU Renal Panel") */
  name: string;
  /** Ordered array of catalog slug IDs active in this preset */
  labKeys: string[];
}
