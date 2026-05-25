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
export const AMOUNT_UNITS: string[] = ["%", "mcg", "mg", "g", "mL", "L", "mEq", "mmol"];
export const RATE_UNITS: string[] = ["per hour", "per day"];
export const DEXT_CONC_OPTIONS = ["5","10","20","25","30","50","70"];
export const AA_CONC_OPTIONS = ["5","8.5","10","11.4","15"];


export const LIPID_CONCS = [
  { pct: "10", gPerMl: 0.10, kcalPerMl: 1.1,  note: "Ready-to-infuse" },
  { pct: "20", gPerMl: 0.20, kcalPerMl: 2.0,  note: "Most common (adult PN)" },
  { pct: "30", gPerMl: 0.30, kcalPerMl: 3.0,  note: "Compounding / admixture only" },
];

export const ELECTROLYTES: { key: string; label: string }[] = [
  { key: "na", label: "Na (Sodium)" }, { key: "k", label: "K (Potassium)" },
  { key: "cl", label: "Cl (Chloride)" }, { key: "acetate", label: "Acetate" },
  { key: "mg", label: "Mg (Magnesium)" }, { key: "phos", label: "Phos (Phosphate)" },
  { key: "ca", label: "Ca (Calcium)" }, { key: "zn", label: "Zn (Zinc)" },
  { key: "cu", label: "Cu (Copper)" }, { key: "se", label: "Se (Selenium)" },
  { key: "mn", label: "Mn (Manganese)" }, { key: "cr", label: "Cr (Chromium)" },
  { key: "fe", label: "Fe (Iron)" }, { key: "i", label: "I (Iodine)" },
  { key: "mo", label: "Mo (Molybdenum)" },
];

export const VITAMINS: { key: string; label: string }[] = [
  { key: "b1", label: "B1 – Thiamine" }, { key: "b2", label: "B2 – Riboflavin" },
  { key: "b3", label: "B3 – Niacin" }, { key: "b5", label: "B5 – Pantothenic Acid" },
  { key: "b6", label: "B6 – Pyridoxine" }, { key: "b7", label: "B7 – Biotin" },
  { key: "b9", label: "B9 – Folic Acid" }, { key: "b12", label: "B12 – Cobalamin" },
  { key: "vitC", label: "Vit C – Ascorbic Acid" }, { key: "vitA", label: "Vit A – Retinol" },
  { key: "vitD", label: "Vit D – Cholecalciferol" }, { key: "vitE", label: "Vit E – Tocopherol" },
  { key: "vitK", label: "Vit K" },
];

export const getLipidMeta = (pct: string) => LIPID_CONCS.find(c => c.pct === pct) ?? LIPID_CONCS[1];