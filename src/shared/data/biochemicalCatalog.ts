// src/shared/data/biochemicalCatalog.ts
// Foundational lab catalog — keyed by stable slug ID.
// Shape: { [id]: { name, loinc, defaultUnit, panel } }
//
// Rules:
//   - IDs are lowercase kebab-case slugs, never changed after creation.
//   - loinc is the authoritative LOINC_NUM from NLM.
//   - defaultUnit is UCUM. Empty string = dimensionless or ratio.
//   - panel groups the entry under a logical header in the default view.
//
// When a clinician adds a lab via LOINC API search, a new entry is merged
// into this catalog at runtime (session only) and registered to activeLabKeys.

export interface CatalogEntry {
  name: string;
  loinc: string;
  defaultUnit: string;
  panel: string;
}

export const GLOBAL_LAB_CATALOG: Record<string, CatalogEntry> = {

  // ── 1. Endocrine & Metabolic ───────────────────────────────────────────────
  "hba1c":              { name: "HbA1c",              loinc: "4548-4",  defaultUnit: "%",       panel: "Endocrine & Metabolic" },
  "glucose":            { name: "Glucose",            loinc: "2345-7",  defaultUnit: "mg/dL",   panel: "Endocrine & Metabolic" },
  "insulin-fasting":    { name: "Fasting Insulin",    loinc: "20448-7", defaultUnit: "µIU/mL",  panel: "Endocrine & Metabolic" },
  "c-peptide":          { name: "C-Peptide",          loinc: "1986-9",  defaultUnit: "ng/mL",   panel: "Endocrine & Metabolic" },
  "fructosamine":       { name: "Fructosamine",       loinc: "1604-8",  defaultUnit: "µmol/L",  panel: "Endocrine & Metabolic" },
  "total-cholesterol":  { name: "Total Cholesterol",  loinc: "2093-3",  defaultUnit: "mg/dL",   panel: "Endocrine & Metabolic" },
  "ldl-c":              { name: "LDL-C",              loinc: "2089-1",  defaultUnit: "mg/dL",   panel: "Endocrine & Metabolic" },
  "hdl-c":              { name: "HDL-C",              loinc: "2085-9",  defaultUnit: "mg/dL",   panel: "Endocrine & Metabolic" },
  "triglycerides":      { name: "Triglycerides",      loinc: "2571-8",  defaultUnit: "mg/dL",   panel: "Endocrine & Metabolic" },
  "vldl-c":             { name: "VLDL-C",             loinc: "13458-5", defaultUnit: "mg/dL",   panel: "Endocrine & Metabolic" },
  "hs-crp":             { name: "hs-CRP",             loinc: "30522-7", defaultUnit: "mg/L",    panel: "Endocrine & Metabolic" },
  "tsh":                { name: "TSH",                loinc: "3016-3",  defaultUnit: "mIU/L",   panel: "Endocrine & Metabolic" },
  "free-t4":            { name: "Free T4",            loinc: "3024-7",  defaultUnit: "ng/dL",   panel: "Endocrine & Metabolic" },

  // ── 2. Renal & Urinary ────────────────────────────────────────────────────
  "bun":                { name: "BUN",                loinc: "3094-0",  defaultUnit: "mg/dL",   panel: "Renal & Urinary" },
  "creatinine":         { name: "Creatinine",         loinc: "2160-0",  defaultUnit: "mg/dL",   panel: "Renal & Urinary" },
  "egfr":               { name: "eGFR",               loinc: "62238-1", defaultUnit: "mL/min/1.73m²", panel: "Renal & Urinary" },
  "uun":                { name: "Urine Urea Nitrogen", loinc: "3091-6", defaultUnit: "g/day",   panel: "Renal & Urinary" },
  "urine-sodium":       { name: "Urine Sodium",       loinc: "2955-3",  defaultUnit: "mEq/L",   panel: "Renal & Urinary" },
  "urine-potassium":    { name: "Urine Potassium",    loinc: "2828-2",  defaultUnit: "mEq/L",   panel: "Renal & Urinary" },
  "urine-chloride":     { name: "Urine Chloride",     loinc: "2079-2",  defaultUnit: "mEq/L",   panel: "Renal & Urinary" },
  "microalbumin-cr":    { name: "Microalbumin/Cr Ratio", loinc: "14585-4", defaultUnit: "mg/g", panel: "Renal & Urinary" },
  "urine-protein-cr":   { name: "Urine Protein/Cr Ratio", loinc: "2889-4", defaultUnit: "mg/g",panel: "Renal & Urinary" },
  "uric-acid":          { name: "Uric Acid",          loinc: "3084-1",  defaultUnit: "mg/dL",   panel: "Renal & Urinary" },
  "cystatin-c":         { name: "Cystatin C",         loinc: "33863-2", defaultUnit: "mg/L",    panel: "Renal & Urinary" },
  "urine-spec-gravity": { name: "Urine Specific Gravity", loinc: "2965-2", defaultUnit: "",     panel: "Renal & Urinary" },

  // ── 3. General Chemistry & Electrolytes ───────────────────────────────────
  "sodium":             { name: "Sodium",             loinc: "2951-2",  defaultUnit: "mEq/L",   panel: "Chemistry & Electrolytes" },
  "potassium":          { name: "Potassium",          loinc: "2823-3",  defaultUnit: "mEq/L",   panel: "Chemistry & Electrolytes" },
  "chloride":           { name: "Chloride",           loinc: "2075-0",  defaultUnit: "mEq/L",   panel: "Chemistry & Electrolytes" },
  "bicarb":             { name: "Bicarbonate (Total CO2)", loinc: "1963-8", defaultUnit: "mEq/L", panel: "Chemistry & Electrolytes" },
  "calcium-total":      { name: "Calcium (Total)",    loinc: "17861-6", defaultUnit: "mg/dL",   panel: "Chemistry & Electrolytes" },
  "calcium-ionized":    { name: "Ionized Calcium",    loinc: "1994-3",  defaultUnit: "mmol/L",  panel: "Chemistry & Electrolytes" },
  "calcium-corrected":  { name: "Corrected Calcium",  loinc: "2000-8",  defaultUnit: "mg/dL",   panel: "Chemistry & Electrolytes" },
  "magnesium":          { name: "Magnesium",          loinc: "2601-3",  defaultUnit: "mg/dL",   panel: "Chemistry & Electrolytes" },
  "phosphorus":         { name: "Phosphorus",         loinc: "2777-1",  defaultUnit: "mg/dL",   panel: "Chemistry & Electrolytes" },
  "osmolality":         { name: "Osmolality",         loinc: "2692-2",  defaultUnit: "mOsm/kg", panel: "Chemistry & Electrolytes" },
  "anion-gap":          { name: "Anion Gap",          loinc: "33037-3", defaultUnit: "mEq/L",   panel: "Chemistry & Electrolytes" },

  // ── 4. Hematology & Iron ──────────────────────────────────────────────────
  "hgb":                { name: "Hgb",                loinc: "718-7",   defaultUnit: "g/dL",    panel: "Hematology & Iron" },
  "hct":                { name: "Hct",                loinc: "4544-3",  defaultUnit: "%",        panel: "Hematology & Iron" },
  "wbc":                { name: "WBC",                loinc: "6690-2",  defaultUnit: "K/µL",    panel: "Hematology & Iron" },
  "rbc":                { name: "RBC",                loinc: "789-8",   defaultUnit: "M/µL",    panel: "Hematology & Iron" },
  "mcv":                { name: "MCV",                loinc: "787-2",   defaultUnit: "fL",       panel: "Hematology & Iron" },
  "platelets":          { name: "Platelets",          loinc: "777-3",   defaultUnit: "K/µL",    panel: "Hematology & Iron" },
  "serum-iron":         { name: "Serum Iron",         loinc: "2498-4",  defaultUnit: "µg/dL",   panel: "Hematology & Iron" },
  "ferritin":           { name: "Ferritin",           loinc: "2276-4",  defaultUnit: "ng/mL",   panel: "Hematology & Iron" },
  "tibc":               { name: "TIBC",               loinc: "2500-7",  defaultUnit: "µg/dL",   panel: "Hematology & Iron" },
  "transferrin":        { name: "Transferrin",        loinc: "3034-6",  defaultUnit: "mg/dL",   panel: "Hematology & Iron" },
  "transferrin-sat":    { name: "Transferrin Saturation %", loinc: "2502-3", defaultUnit: "%",  panel: "Hematology & Iron" },
  "stfr":               { name: "sTfR",               loinc: "35209-6", defaultUnit: "mg/L",    panel: "Hematology & Iron" },
  "reticulocyte":       { name: "Reticulocyte Count", loinc: "17849-1", defaultUnit: "%",       panel: "Hematology & Iron" },

  // ── 5. Hepatobiliary & Specialty Proteins ─────────────────────────────────
  "albumin":            { name: "Albumin",            loinc: "1751-7",  defaultUnit: "g/dL",    panel: "Hepatobiliary & Proteins" },
  "prealbumin":         { name: "Prealbumin",         loinc: "2776-3",  defaultUnit: "mg/dL",   panel: "Hepatobiliary & Proteins" },
  "total-protein":      { name: "Total Protein",      loinc: "2885-2",  defaultUnit: "g/dL",    panel: "Hepatobiliary & Proteins" },
  "ast":                { name: "AST",                loinc: "1920-8",  defaultUnit: "U/L",     panel: "Hepatobiliary & Proteins" },
  "alt":                { name: "ALT",                loinc: "1742-6",  defaultUnit: "U/L",     panel: "Hepatobiliary & Proteins" },
  "alk-phos":           { name: "Alk Phos",           loinc: "6768-6",  defaultUnit: "U/L",     panel: "Hepatobiliary & Proteins" },
  "ggt":                { name: "GGT",                loinc: "2324-2",  defaultUnit: "U/L",     panel: "Hepatobiliary & Proteins" },
  "total-bilirubin":    { name: "Total Bilirubin",    loinc: "1975-2",  defaultUnit: "mg/dL",   panel: "Hepatobiliary & Proteins" },
  "direct-bilirubin":   { name: "Direct Bilirubin",   loinc: "1968-7",  defaultUnit: "mg/dL",   panel: "Hepatobiliary & Proteins" },
  "ammonia":            { name: "Ammonia",            loinc: "1740-0",  defaultUnit: "µmol/L",  panel: "Hepatobiliary & Proteins" },
  "pt-inr":             { name: "Prothrombin Time (PT/INR)", loinc: "5902-2", defaultUnit: "INR", panel: "Hepatobiliary & Proteins" },
  "rbp":                { name: "Retinol Binding Protein", loinc: "5787-7", defaultUnit: "mg/dL", panel: "Hepatobiliary & Proteins" },

  // ── 6. Micronutrient Status ───────────────────────────────────────────────
  "vit-d":              { name: "Vitamin D (25-OH)",  loinc: "1989-3",  defaultUnit: "ng/mL",   panel: "Micronutrient Status" },
  "vit-b12":            { name: "Vitamin B12",        loinc: "2132-9",  defaultUnit: "pg/mL",   panel: "Micronutrient Status" },
  "folate":             { name: "Folate",             loinc: "2284-8",  defaultUnit: "ng/mL",   panel: "Micronutrient Status" },
  "homocysteine":       { name: "Homocysteine",       loinc: "13965-9", defaultUnit: "µmol/L",  panel: "Micronutrient Status" },
  "mma":                { name: "Methylmalonic Acid", loinc: "25531-5", defaultUnit: "nmol/mL", panel: "Micronutrient Status" },
  "vit-b1":             { name: "Vitamin B1 (TDP)",   loinc: "35260-9", defaultUnit: "nmol/L",  panel: "Micronutrient Status" },
  "vit-b6":             { name: "Vitamin B6",         loinc: "14879-1", defaultUnit: "nmol/L",  panel: "Micronutrient Status" },
  "vit-a":              { name: "Vitamin A",          loinc: "2923-1",  defaultUnit: "µg/dL",   panel: "Micronutrient Status" },
  "vit-c":              { name: "Vitamin C",          loinc: "1971-1",  defaultUnit: "mg/dL",   panel: "Micronutrient Status" },
  "vit-e":              { name: "Vitamin E",          loinc: "1727-7",  defaultUnit: "mg/L",    panel: "Micronutrient Status" },
  "vit-k":              { name: "Vitamin K",          loinc: "6242-2",  defaultUnit: "ng/mL",   panel: "Micronutrient Status" },
  "zinc":               { name: "Zinc",               loinc: "5763-8",  defaultUnit: "µg/dL",   panel: "Micronutrient Status" },
  "copper":             { name: "Copper",             loinc: "5651-5",  defaultUnit: "µg/dL",   panel: "Micronutrient Status" },
  "selenium":           { name: "Selenium",           loinc: "5706-7",  defaultUnit: "µg/L",    panel: "Micronutrient Status" },

  // ── 7. Digestive, Pancreatic & Stool ─────────────────────────────────────
  "lipase":             { name: "Serum Lipase",       loinc: "3040-3",  defaultUnit: "U/L",     panel: "Digestive & Pancreatic" },
  "amylase":            { name: "Serum Amylase",      loinc: "1798-8",  defaultUnit: "U/L",     panel: "Digestive & Pancreatic" },
  "fecal-elastase":     { name: "Fecal Elastase-1",   loinc: "13951-9", defaultUnit: "µg/g",    panel: "Digestive & Pancreatic" },
  "fecal-calprotectin": { name: "Fecal Calprotectin", loinc: "27401-8", defaultUnit: "µg/g",    panel: "Digestive & Pancreatic" },
  "fecal-lactoferrin":  { name: "Fecal Lactoferrin",  loinc: "36374-3", defaultUnit: "µg/mL",   panel: "Digestive & Pancreatic" },
  "anti-ttg-iga":       { name: "Anti-tTG IgA",       loinc: "31017-7", defaultUnit: "U/mL",    panel: "Digestive & Pancreatic" },
  "h-pylori-ag":        { name: "H. pylori Antigen",  loinc: "17548-9", defaultUnit: "",         panel: "Digestive & Pancreatic" },
  "steatocrit":         { name: "Steatocrit",         loinc: "67893-1", defaultUnit: "%",        panel: "Digestive & Pancreatic" },
  "breath-hydrogen":    { name: "Breath Hydrogen",    loinc: "29473-7", defaultUnit: "ppm",      panel: "Digestive & Pancreatic" },

  // ── 8. Blood Gas & Acute Care ─────────────────────────────────────────────
  "abg-ph":             { name: "ABG pH",             loinc: "2744-1",  defaultUnit: "",         panel: "Blood Gas & Acute Care" },
  "abg-paco2":          { name: "ABG PaCO2",          loinc: "2019-8",  defaultUnit: "mmHg",     panel: "Blood Gas & Acute Care" },
  "abg-pao2":           { name: "ABG PaO2",           loinc: "2703-7",  defaultUnit: "mmHg",     panel: "Blood Gas & Acute Care" },
  "abg-hco3":           { name: "ABG HCO3",           loinc: "1963-8",  defaultUnit: "mEq/L",    panel: "Blood Gas & Acute Care" },
  "vbg-ph":             { name: "VBG pH",             loinc: "2745-8",  defaultUnit: "",         panel: "Blood Gas & Acute Care" },
  "vbg-pvco2":          { name: "VBG PvCO2",          loinc: "2021-4",  defaultUnit: "mmHg",     panel: "Blood Gas & Acute Care" },
  "vbg-pvo2":           { name: "VBG PvO2",           loinc: "2705-2",  defaultUnit: "mmHg",     panel: "Blood Gas & Acute Care" },
  "vbg-hco3":           { name: "VBG HCO3",           loinc: "1960-4",  defaultUnit: "mEq/L",    panel: "Blood Gas & Acute Care" },
  "lactate":            { name: "Lactate",            loinc: "2524-7",  defaultUnit: "mmol/L",   panel: "Blood Gas & Acute Care" },

  // ── 9. Physiological & Fluid Status ──────────────────────────────────────
  "phase-angle":        { name: "Phase Angle",        loinc: "59477-3", defaultUnit: "deg",      panel: "Physiological & Fluid" },
  "ecw":                { name: "ECW",                loinc: "73707-9", defaultUnit: "L",         panel: "Physiological & Fluid" },
  "icw":                { name: "ICW",                loinc: "73709-5", defaultUnit: "L",         panel: "Physiological & Fluid" },
  "ecw-icw-ratio":      { name: "ECW/ICW Ratio",      loinc: "73708-7", defaultUnit: "",          panel: "Physiological & Fluid" },
  "bcm":                { name: "Body Cell Mass (BCM)", loinc: "73706-1", defaultUnit: "kg",      panel: "Physiological & Fluid" },
  "tbw":                { name: "Total Body Water",   loinc: "73706-1", defaultUnit: "L",         panel: "Physiological & Fluid" },
};

// ── Default active keys per sub-domain panel ─────────────────────────────────
// Used to seed activeLabKeys when a user has no saved preset.
// Keys match the panel string in CatalogEntry above.

export const DEFAULT_PANEL_KEYS: Record<string, string[]> = {
  "Endocrine & Metabolic":      ["hba1c","glucose","total-cholesterol","ldl-c","hdl-c","triglycerides","hs-crp","tsh"],
  "Renal & Urinary":            ["bun","creatinine","egfr","uun","urine-sodium","uric-acid","cystatin-c"],
  "Chemistry & Electrolytes":   ["sodium","potassium","chloride","bicarb","calcium-total","magnesium","phosphorus","anion-gap"],
  "Hematology & Iron":          ["hgb","hct","wbc","platelets","serum-iron","ferritin","tibc","transferrin-sat"],
  "Hepatobiliary & Proteins":   ["albumin","prealbumin","total-protein","ast","alt","alk-phos","total-bilirubin","pt-inr"],
  "Micronutrient Status":       ["vit-d","vit-b12","folate","homocysteine","zinc","copper","selenium"],
  "Digestive & Pancreatic":     ["lipase","amylase","fecal-elastase","fecal-calprotectin","anti-ttg-iga"],
  "Blood Gas & Acute Care":     ["abg-ph","abg-paco2","abg-pao2","abg-hco3","lactate"],
  "Physiological & Fluid":      ["phase-angle","ecw","icw","ecw-icw-ratio","tbw"],
};

// ── Runtime merge helper ──────────────────────────────────────────────────────
// Called by LabSearchBar when a clinician selects a result sourced from the
// NLM LOINC API. The entry is added for the current session only; it is NOT
// written back to the static file.
//
// IMPORTANT: This always overwrites an existing runtime entry (no guard).
// This ensures the unit/name is always current from the most recent API
// response, and prevents stale empty-unit skeletons from persisting when a
// clinician removes then re-adds the same test.

export function registerRuntimeEntry(
  slug: string,
  entry: CatalogEntry
): void {
  // Always overwrite — do not guard with `if (!GLOBAL_LAB_CATALOG[slug])`.
  // Rationale: the static catalog slugs use kebab-case names (not "loinc-XXXXX"),
  // so runtime entries never collide with static ones. Always writing ensures
  // the unit and display name are current from the latest API response.
  (GLOBAL_LAB_CATALOG as Record<string, CatalogEntry>)[slug] = entry;
}