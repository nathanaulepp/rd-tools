// ─── Constants ───────────────────────────────────────────────────────────────

export const EN_ROUTES: string[] = [
  "NG (Nasogastric)", "NJ (Nasojejunal)", "ND (Nasoduodenal)",
  "OG (Orogastric)", "OJ (Orojejunal)",
  "PEG (Percutaneous Endoscopic Gastrostomy)",
  "PEG-J (PEG with Jejunal Extension)",
  "PRG (Percutaneous Radiologic Gastrostomy)",
  "PRG-J (PRG with Jejunal Extension)",
  "Low-Profile G (Button)", "Low-Profile G-J (Button with Jejunal Ext.)",
  "PEJ (Percutaneous Endoscopic Jejunostomy)",
  "Surgical Gastrostomy (Open/Laparoscopic)",
  "Surgical Jejunostomy (Open/Laparoscopic)",
  "PICC-NJ (PICC-guided Nasojejunal)",
  "Other (specify in notes)",
];

export const PN_ROUTES: string[] = ["Central", "Peripheral"];
export const PN_ACCESS: string[] = ["PICC", "CVC (Central Venous Catheter)", "Port-a-Cath", "PIV (Peripheral IV)", "Multi-lumen (specify lumen)", "Tunneled CVC", "Other"];
export const PN_GOALS: string[] = ["Full (sole source)", "Supplemental", "Bridging"];
export const PN_DELIVERY: string[] = ["3-in-1 (TNA)", "2-in-1 + Separate Lipid Infusion", "3 Fully Separated Macros", "Module-Based", "Transitioning (Define Phases)"];
export const PN_DURATIONS: string[] = ["Continuous", "Cyclic", "Taper"];
export const MACRO_TYPES: string[] = ["Premade", "Compounded"];
export const LIPID_OILS: string[] = ["Soybean (SO)", "SMOF (Soy/MCT/Olive/Fish)", "Custom (specify)"];
export const AMOUNT_UNITS: string[] = ["%", "mcg", "mg", "g", "mL", "L", "mEq", "mmol", "IU"];
export const RATE_UNITS: string[] = ["per hour", "per day"];
export const DEXT_CONC_OPTIONS = ["5","10","20","25","30","50","70"];
export const AA_CONC_OPTIONS = ["5","8.5","10","11.4","15"];

// ─── EN Modular Types ────────────────────────────────────────────────────────
export interface ENModular {
  id: number;
  type: string;
  product: string;
  amount: string | number;
  unit: string;
  frequency: string;
  kcal: string | number;
  protein: string | number;
  notes: string;
}

export const EN_MODULAR_TYPES: string[] = [
  "Protein Powder",
  "Carbohydrate Powder (Polycose/Duocal)",
  "Fat / MCT Oil",
  "Fiber Supplement",
  "Probiotic",
  "Omega-3 / Fish Oil",
  "Vitamin/Mineral Supplement",
  "Elemental/Peptide Add-in",
  "Other",
];

export const EN_MODULAR_UNITS: string[] = ["g", "mL", "tsp", "tbsp", "scoop", "packet", "capsule", "IU", "mcg", "mg"];
export const EN_MODULAR_FREQ: string[] = ["per feeding", "per day", "BID", "TID", "QID", "PRN"];

export function makeENModular(id: number): ENModular {
  return {
    id, type: "", product: "", amount: "", unit: "g",
    frequency: "per day", kcal: "", protein: "", notes: "",
  };
}

export const LIPID_CONCS = [
  { pct: "10", gPerMl: 0.10, kcalPerMl: 1.1,  note: "Ready-to-infuse" },
  { pct: "20", gPerMl: 0.20, kcalPerMl: 2.0,  note: "Most common (adult PN)" },
  { pct: "30", gPerMl: 0.30, kcalPerMl: 3.0,  note: "Compounding / admixture only" },
];

// ─── Electrolytes with US-standard default units ─────────────────────────────
// US clinical practice (ASPEN / ASHP standards):
//   Na, K, Cl, Acetate, Ca  → mEq
//   Mg                       → mEq  (PN standard; mg used less often)
//   Phos                     → mmol (phosphate is ALWAYS ordered in mmol in US PN)
//   Zn, Fe                   → mg
//   Cu, Se, Mn, Cr, I, Mo    → mcg
export const ELECTROLYTES: { key: string; label: string; defaultUnit: string }[] = [
  { key: "na",      label: "Na (Sodium)",      defaultUnit: "mEq"  },
  { key: "k",       label: "K (Potassium)",    defaultUnit: "mEq"  },
  { key: "cl",      label: "Cl (Chloride)",    defaultUnit: "mEq"  },
  { key: "acetate", label: "Acetate",          defaultUnit: "mEq"  },
  { key: "mg",      label: "Mg (Magnesium)",   defaultUnit: "mEq"  },
  { key: "phos",    label: "Phos (Phosphate)", defaultUnit: "mmol" },
  { key: "ca",      label: "Ca (Calcium)",     defaultUnit: "mEq"  },
  { key: "zn",      label: "Zn (Zinc)",        defaultUnit: "mg"   },
  { key: "cu",      label: "Cu (Copper)",      defaultUnit: "mcg"  },
  { key: "se",      label: "Se (Selenium)",    defaultUnit: "mcg"  },
  { key: "mn",      label: "Mn (Manganese)",   defaultUnit: "mcg"  },
  { key: "cr",      label: "Cr (Chromium)",    defaultUnit: "mcg"  },
  { key: "fe",      label: "Fe (Iron)",        defaultUnit: "mg"   },
  { key: "i",       label: "I (Iodine)",       defaultUnit: "mcg"  },
  { key: "mo",      label: "Mo (Molybdenum)",  defaultUnit: "mcg"  },
];

// ─── Vitamins with US-standard default units ──────────────────────────────────
// US PN practice (AMA/FDA multivitamin formulations, ASPEN guidelines):
//   B1, B2, B3, B5, B6, Vit C, Vit E → mg
//   B7, B9, B12, Vit K, Vit A, Vit D  → mcg
//   (Vit A and D historically reported in IU; mcg is the current ASPEN/FDA standard)
export const VITAMINS: { key: string; label: string; defaultUnit: string }[] = [
  { key: "b1",   label: "B1 – Thiamine",          defaultUnit: "mg"  },
  { key: "b2",   label: "B2 – Riboflavin",         defaultUnit: "mg"  },
  { key: "b3",   label: "B3 – Niacin",             defaultUnit: "mg"  },
  { key: "b5",   label: "B5 – Pantothenic Acid",   defaultUnit: "mg"  },
  { key: "b6",   label: "B6 – Pyridoxine",         defaultUnit: "mg"  },
  { key: "b7",   label: "B7 – Biotin",             defaultUnit: "mcg" },
  { key: "b9",   label: "B9 – Folic Acid",         defaultUnit: "mcg" },
  { key: "b12",  label: "B12 – Cobalamin",         defaultUnit: "mcg" },
  { key: "vitC", label: "Vit C – Ascorbic Acid",   defaultUnit: "mg"  },
  { key: "vitA", label: "Vit A – Retinol",         defaultUnit: "mcg" },
  { key: "vitD", label: "Vit D – Cholecalciferol", defaultUnit: "mcg" },
  { key: "vitE", label: "Vit E – Tocopherol",      defaultUnit: "mg"  },
  { key: "vitK", label: "Vit K",                   defaultUnit: "mcg" },
];

export const getLipidMeta = (pct: string) => LIPID_CONCS.find(c => c.pct === pct) ?? LIPID_CONCS[1];