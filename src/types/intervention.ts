// src/types/intervention.ts

// ── NP-1.1: Oral Nutrition ────────────────────────────────────────────────────

export interface NutrientModifier {
  id: number;
  nutrient: string;
  amount: string;
  unit: string;
  direction: "increased" | "decreased" | "consistent" | "";
}

export interface NpOralNutrition {
  energyKcal: string;                    // NP-1.1.1
  nutrientModifiers: NutrientModifier[]; // NP-1.1.2
  foodsAndPatterns: string[];            // NP-1.1.3
  textureModification: string;           // NP-1.1.4
  oralSupplements: string;               // NP-1.1.5
  isNpo: boolean;                        // NP-1.1.6
  valuesInclusion: string;               // NP-1.1.7
}

// ── NP-1.2: Enteral Nutrition ─────────────────────────────────────────────────

export interface NpEnteralNutrition {
  kcalLow: string;          // NP-1.2.2.1
  kcalHigh: string;
  proteinLow: string;       // NP-1.2.2.2
  proteinHigh: string;
  fluidLow: string;         // NP-1.2.2.3
  fluidHigh: string;
  formulaName: string;      // NP-1.2.3.1
  dailyVolumeMl: string;    // NP-1.2.3.2
  infusionRateMlHr: string; // NP-1.2.3.3
  adminMethod: string;      // NP-1.2.4
  bodyPosition: string;     // NP-1.2.5
  other: string;            // NP-1.2.6
}

// ── NP-1.3: Parenteral Nutrition ──────────────────────────────────────────────

export interface NpParenteralNutrition {
  energyKcal: string;         // NP-1.3.1
  aminoAcidsG: string;        // NP-1.3.2.1.1
  dextroseG: string;          // NP-1.3.2.1.2
  lipidsG: string;            // NP-1.3.2.1.3
  sodiumMeq: string;          // NP-1.3.2.2.1
  potassiumMeq: string;       // NP-1.3.2.2.2
  magnesiumMeq: string;       // NP-1.3.2.2.3
  calciumMeq: string;         // NP-1.3.2.2.4
  phosphorusMmol: string;     // NP-1.3.2.2.5
  mviMl: string;              // NP-1.3.2.3.1
  mteMl: string;              // NP-1.3.2.3.2
  solutionType: string;       // NP-1.3.3.1
  totalFluidVolumeMl: string; // NP-1.3.3.2
  adminMethod: string;        // NP-1.3.4
  valuesInclusion: string;    // NP-1.3.5
}

// ── NP-1.4: IV Fluid ──────────────────────────────────────────────────────────

export interface NpIvFluid {
  energyKcal: string;           // NP-1.4.1
  dextroseG: string;            // NP-1.4.2.1
  electrolyteAdditives: string; // NP-1.4.2.2
  solution: string;             // NP-1.4.3
  adminMethod: string;          // NP-1.4.4
  valuesInclusion: string;      // NP-1.4.5
}

// ── ND-1: Meals and Snacks ────────────────────────────────────────────────────

export interface NdMealsSnacks {
  selectedDietTypes: string[];
  textureLevel: string;
  proteinMods: string[];
  aminoAcidMods: string[];
  carbMods: string[];
  fatMods: string[];
  fiberMods: string[];
  fluidMods: string[];
  mineralMods: string[];
  vitaminMods: string[];
  foodGroupMods: string[];
  specificFoodMods: string[];
  intakeTiming: string[];
  other: string[];
  notes: string;
}

// ── ND-2: EN/PN Management ────────────────────────────────────────────────────

export interface NdEnPnManagement {
  enActions: string[];
  pnActions: string[];
  notes: string;
}

// ── ND-3: Supplement Therapy ──────────────────────────────────────────────────

export interface NdSupplementTherapy {
  medicalFoodActions: string[];
  vitaminSupplements: string[];
  mineralSupplements: string[];
  bioactiveActions: string[];
  notes: string;
}

// ── ND-4: Feeding Assistance ──────────────────────────────────────────────────

export interface NdFeedingAssistance {
  actions: string[];
  notes: string;
}

// ── ND-5: Feeding Environment ─────────────────────────────────────────────────

export interface NdFeedingEnvironment {
  actions: string[];
  notes: string;
}

// ── ND-6: Medication Management ──────────────────────────────────────────────

export interface NdMedManagement {
  actions: string[];
  notes: string;
}

// ── ND-7: Infant Feeding (age-gated) ─────────────────────────────────────────

export interface NdInfantFeeding {
  breastmilkActions: string[];
  formulaActions: string[];
  notes: string;
}

// ── E: Nutrition Education ────────────────────────────────────────────────────

export interface NcpEducation {
  contentActions: string[];
  applicationActions: string[];
  notes: string;
}

// ── C: Nutrition Counseling ───────────────────────────────────────────────────

export interface NcpCounseling {
  theoreticalBasis: string[];
  strategies: string[];
  notes: string;
}

// ── RC: Coordination of Care ──────────────────────────────────────────────────

export interface NcpCoordination {
  collaborationActions: string[];
  dischargeActions: string[];
  notes: string;
}

// ── Root Interface ────────────────────────────────────────────────────────────

export interface Intervention {
  // ── Section 1: Nutrition Prescription (NP) ──────────────────────────────────
  npActiveModes: Array<"oral" | "enteral" | "parenteral" | "ivfluid">;
  npOral:        NpOralNutrition;
  npEnteral:     NpEnteralNutrition;
  npParenteral:  NpParenteralNutrition;
  npIvFluid:     NpIvFluid;

  // ── Section 2: NCP Intervention Implementation ───────────────────────────────
  ndMealsSnacks:        NdMealsSnacks;
  ndEnPnManagement:     NdEnPnManagement;
  ndSupplementTherapy:  NdSupplementTherapy;
  ndFeedingAssistance:  NdFeedingAssistance;
  ndFeedingEnvironment: NdFeedingEnvironment;
  ndMedManagement:      NdMedManagement;
  ndInfantFeeding:      NdInfantFeeding;
  education:            NcpEducation;
  counseling:           NcpCounseling;
  coordination:         NcpCoordination;

  // ── Retained from existing UI ────────────────────────────────────────────────
  goalStatement:     string;
  goalTimeframe:     string;
  goalMeasurable:    string;
  interventionNotes: string;
}
