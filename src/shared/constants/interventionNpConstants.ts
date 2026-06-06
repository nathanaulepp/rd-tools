// src/shared/constants/interventionNpConstants.ts
// Pure data — no imports from stores, hooks, or features.
// Consumed by: NpOralSection, NpEnteralSection, NpParenteralSection, NpIvFluidSection.

// ── Nutrients available for dynamic NutrientModifier rows (NP-1.1.2) ──────────
// Ordered: macros first, then electrolytes, then vitamins, then trace minerals.

export const NP_NUTRIENT_OPTIONS: string[] = [
  // Macronutrients
  "Energy",
  "Protein",
  "Carbohydrate",
  "Fat",
  "Fiber",
  "Fluid",
  // Electrolytes
  "Sodium",
  "Potassium",
  "Phosphorus",
  "Calcium",
  "Magnesium",
  "Chloride",
  // Fat subtypes
  "Saturated Fat",
  "Omega-3 Fatty Acids",
  "Medium Chain Triglycerides",
  // Carbohydrate subtypes
  "Simple Carbohydrates",
  "Complex Carbohydrates",
  "Lactose",
  "Fructose",
  // Protein subtypes
  "Essential Amino Acids",
  "Branched Chain Amino Acids (BCAA)",
  // Fat-soluble vitamins
  "Vitamin A",
  "Vitamin D",
  "Vitamin E",
  "Vitamin K",
  // Water-soluble vitamins
  "Vitamin C",
  "Thiamin (B1)",
  "Riboflavin (B2)",
  "Niacin (B3)",
  "Vitamin B6",
  "Folate",
  "Vitamin B12",
  "Biotin",
  "Pantothenic Acid",
  // Trace minerals
  "Iron",
  "Zinc",
  "Copper",
  "Selenium",
  "Iodine",
  "Manganese",
  "Chromium",
  "Molybdenum",
];

// ── Per-nutrient unit options for the unit <select> in NutrientModifier ───────
// Keys must match entries in NP_NUTRIENT_OPTIONS exactly.
// Falls back to ["g"] for any nutrient not listed here.

export const NP_NUTRIENT_UNITS: Record<string, string[]> = {
  "Energy":                        ["kcal", "kJ"],
  "Protein":                       ["g", "g/kg"],
  "Carbohydrate":                  ["g", "g/kg"],
  "Fat":                           ["g", "g/kg"],
  "Fiber":                         ["g"],
  "Fluid":                         ["mL", "L", "oz"],
  "Sodium":                        ["mg", "mEq", "g"],
  "Potassium":                     ["mg", "mEq", "g"],
  "Phosphorus":                    ["mg", "mmol"],
  "Calcium":                       ["mg", "mEq"],
  "Magnesium":                     ["mg", "mEq"],
  "Chloride":                      ["mg", "mEq"],
  "Saturated Fat":                 ["g"],
  "Omega-3 Fatty Acids":           ["g", "mg"],
  "Medium Chain Triglycerides":    ["g", "mL"],
  "Simple Carbohydrates":          ["g"],
  "Complex Carbohydrates":         ["g"],
  "Lactose":                       ["g"],
  "Fructose":                      ["g"],
  "Essential Amino Acids":         ["g"],
  "Branched Chain Amino Acids (BCAA)": ["g"],
  "Vitamin A":                     ["µg", "IU", "RE"],
  "Vitamin D":                     ["µg", "IU"],
  "Vitamin E":                     ["mg", "IU"],
  "Vitamin K":                     ["µg"],
  "Vitamin C":                     ["mg"],
  "Thiamin (B1)":                  ["mg"],
  "Riboflavin (B2)":               ["mg"],
  "Niacin (B3)":                   ["mg"],
  "Vitamin B6":                    ["mg"],
  "Folate":                        ["µg", "µg DFE"],
  "Vitamin B12":                   ["µg"],
  "Biotin":                        ["µg"],
  "Pantothenic Acid":              ["mg"],
  "Iron":                          ["mg"],
  "Zinc":                          ["mg"],
  "Copper":                        ["µg", "mg"],
  "Selenium":                      ["µg"],
  "Iodine":                        ["µg"],
  "Manganese":                     ["mg"],
  "Chromium":                      ["µg"],
  "Molybdenum":                    ["µg"],
};

// ── IDDSI texture levels for NP-1.1.4 and ND-1 ───────────────────────────────
// Short labels only — full definitions shown via Tooltip on the IDDSI icon.

export const NP_TEXTURE_OPTIONS: string[] = [
  "Level 7 Regular",
  "Level 7 Easy to Chew",
  "Level 6 Soft & Bite-Sized",
  "Level 5 Minced & Moist",
  "Level 4 Pureed",
  "Level 4 Extremely Thick",
  "Level 3 Liquidized",
  "Level 3 Moderately Thick",
  "Level 2 Mildly Thick",
  "Level 1 Slightly Thick",
  "Level 0 Thin",
];

// ── Common IV fluid solution names for NP-1.4.3 ──────────────────────────────

export const NP_SOLUTION_OPTIONS: string[] = [
  "0.9% Normal Saline (NS)",
  "0.45% Half Normal Saline (½NS)",
  "0.225% Quarter Normal Saline (¼NS)",
  "Lactated Ringer's (LR)",
  "D5W (5% Dextrose in Water)",
  "D5NS (5% Dextrose in Normal Saline)",
  "D5½NS (5% Dextrose in Half Normal Saline)",
  "D5LR (5% Dextrose in Lactated Ringer's)",
  "D10W (10% Dextrose in Water)",
  "D10NS",
  "3% Hypertonic Saline",
  "Plasma-Lyte A",
  "Plasma-Lyte 148",
  "Normosol-R",
  "Sterile Water for Injection",
];

// ── Common enteral administration method presets for NP-1.2.4 ────────────────

export const NP_EN_ADMIN_OPTIONS: string[] = [
  "Continuous enteral nutrition via nasogastric (NG) tube",
  "Continuous enteral nutrition via nasoduodenal (ND) tube",
  "Continuous enteral nutrition via nasojejunal (NJ) tube",
  "Continuous enteral nutrition via percutaneous endoscopic gastrostomy (PEG)",
  "Continuous enteral nutrition via gastrojejunostomy (GJ) tube",
  "Continuous enteral nutrition via jejunostomy (J) tube",
  "Intermittent bolus via syringe — gastric",
  "Intermittent bolus via gravity drip — gastric",
  "Cyclic enteral nutrition (nocturnal)",
];

// ── Common PN solution/compounding types for NP-1.3.3.1 ──────────────────────

export const NP_PN_SOLUTION_OPTIONS: string[] = [
  "Custom 3-in-1 admixture (TNA) — central",
  "Custom 2-in-1 admixture — central",
  "Custom 3-in-1 admixture (TNA) — peripheral (PPN)",
  "Custom 2-in-1 admixture — peripheral (PPN)",
  "Standardized commercial PN bag — central",
  "Standardized commercial PN bag — peripheral",
];
