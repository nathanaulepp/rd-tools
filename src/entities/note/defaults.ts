// src/entities/note/defaults.ts
// Typed default values for every domain.
// All defaults now satisfy the strict interfaces in src/types/.
// Phase 9: Extended defaultIntervention with full NCP taxonomy sub-objects.

import { getLocalIsoDate } from "../../shared/utils/date";
import type {
  PatientData,
  Anthro,
  DexaScan,
  Labs,
  Clinical,
  Dietary,
  Diagnosis,
  Intervention,
  MonitorEval,
  Standards,
} from "../../types";
import type {
  NpOralNutrition,
  NpEnteralNutrition,
  NpParenteralNutrition,
  NpIvFluid,
  NdMealsSnacks,
  NdEnPnManagement,
  NdSupplementTherapy,
  NdFeedingAssistance,
  NdFeedingEnvironment,
  NdMedManagement,
  NdInfantFeeding,
  NcpEducation,
  NcpCounseling,
  NcpCoordination,
} from "../../types";

export const defaultPatientData: PatientData = {
  lastName: "",
  firstName: "",
  dob: "",
  sex: "",
  mrn: "",
  admissionDate: getLocalIsoDate(),
  noteDate: getLocalIsoDate(),
  languages: "",
};

export const defaultAnthro: Anthro = {
  ht: "",
  htUnit: "cm",
  wt: "",
  wtUnit: "kg",
  ubw: "",
  ubwDate: "",
  isFluidShift: false,
  edw: "",
  edwUnit: "kg",
  amputations: [],
  waist: "",
  mac: "",
  calf: "",
  head: "",
  circUnit: "cm",
  triceps: "",
  subscapular: "",
  suprailiac: "",
  thigh: "",
  skinfoldUnit: "mm",
  past_ht: "",
  past_htUnit: "cm",
  past_wt: "",
  past_wtUnit: "kg",
  past_head: "",
  past_headUnit: "cm",
  past_htDate: "",
  past_wtDate: "",
  past_headDate: "",
};

export const defaultDexaScans: DexaScan[] = [];

export const defaultLabs: Labs = {};

export const defaultClinical: Clinical = {
  // C1
  chiefComplaint: "",
  medHx: "",
  familyHx: "",
  socialHx: "",
  allergiesIntolerances: "",
  medicalDevices: "",
  medications: "",

  // C2
  temp: "",
  hr: "",
  spo2: "",
  bp: "",
  rr: "",
  screenings: "",

  // C4
  giDistress: "",
  chewing: "",
  oralHygiene: "",
  swallowing: "",
  fev1: "",
  tbsa: "",

  // C5 — Muscle wasting
  temples: "",
  clavicles: "",
  shoulders: "",
  scapula: "",
  interosseous: "",
  thighs: "",
  calves: "",

  // C5 — Fat
  orbital: "",
  cheek: "",
  tricepsFat: "",
  midAxillary: "",

  // C5 — Micronutrient signs
  hair: [],
  eyes: [],
  mouthLips: [],
  tongue: [],
  teethGums: [],
  headNeck: [],
  nails: [],
  skin: [],

  // C5 — Fluid
  pittingEdema: "",
  pedalEdema: "",
  ascites: "",
  edemaDescription: "",

  // C5 — Functional
  gripStrength: "",

  // C6 — Imaging
  imaging_smi: "",
  imaging_muscleArea: "",
  imaging_muscleAttenuation: "",
  imaging_imat: "",
  imaging_vat: "",
  imaging_notes: "",

  // Cross-domain (written by Standards domain)
  tempMax: "",
  ve: "",

  // General
  clinicalNotes: "",
};

export const defaultDietary: Dietary = {
  recall: [{ label: "Meal 1", value: "" }],
  macroAdequacy: "",
  mealPatterns: "",
  currentDiets: "",
  fluidIntake: "",
  eeiPercent: "",
  eeiTimeframe: "",
  dietOrder: "",
  oralCalories: "",
  oralProtein: "",
  oralWater: "",
  physicalLevel: "",
  adls: "",
  feedingTasks: "",
  understanding: "",
  readiness: "5",
  psychTies: "",
  mealPrep: "",
  eatingOut: "",
  bingePurge: "",
  foodSecurity: "",
  foodSupplies: "",
  transport: "",
  culturalReligious: "",
  socialDynamics: "",
  eatingEnv: "",
  herbalCAM: "",
  supplements: "",
  perception: "",
  qolGoals: "",
  totalKcal: "",
  totalProtein: "",
  totalFat: "",
  totalCho: "",
};

export const defaultDiagnosis: Diagnosis = {
  problem: "",
  etiology: "",
  signsSymptoms: "",
  additionalDiagnoses: [],
  nutritionDxNarrative: "",
  priorityRanking: "",
};

// ── NP sub-object defaults ────────────────────────────────────────────────────

const defaultNpOral: NpOralNutrition = {
  energyKcal: "",
  nutrientModifiers: [],
  foodsAndPatterns: [],
  textureModification: "",
  oralSupplements: "",
  isNpo: false,
  valuesInclusion: "",
};

const defaultNpEnteral: NpEnteralNutrition = {
  kcalLow: "",
  kcalHigh: "",
  proteinLow: "",
  proteinHigh: "",
  fluidLow: "",
  fluidHigh: "",
  formulaName: "",
  dailyVolumeMl: "",
  infusionRateMlHr: "",
  adminMethod: "",
  bodyPosition: "",
  other: "",
};

const defaultNpParenteral: NpParenteralNutrition = {
  energyKcal: "",
  aminoAcidsG: "",
  dextroseG: "",
  lipidsG: "",
  sodiumMeq: "",
  potassiumMeq: "",
  magnesiumMeq: "",
  calciumMeq: "",
  phosphorusMmol: "",
  mviMl: "",
  mteMl: "",
  solutionType: "",
  totalFluidVolumeMl: "",
  adminMethod: "",
  valuesInclusion: "",
};

const defaultNpIvFluid: NpIvFluid = {
  energyKcal: "",
  dextroseG: "",
  electrolyteAdditives: "",
  solution: "",
  adminMethod: "",
  valuesInclusion: "",
};

// ── ND/E/C/RC sub-object defaults ─────────────────────────────────────────────

const defaultNdMealsSnacks: NdMealsSnacks = {
  selectedDietTypes: [], textureLevel: "", proteinMods: [],
  aminoAcidMods: [], carbMods: [], fatMods: [], fiberMods: [],
  fluidMods: [], mineralMods: [], vitaminMods: [], foodGroupMods: [],
  specificFoodMods: [], intakeTiming: [], other: [], notes: "",
};

const defaultNdEnPnManagement: NdEnPnManagement = { enActions: [], pnActions: [], notes: "" };
const defaultNdSupplementTherapy: NdSupplementTherapy = {
  medicalFoodActions: [], vitaminSupplements: [], mineralSupplements: [], bioactiveActions: [], notes: "",
};
const defaultNdFeedingAssistance: NdFeedingAssistance = { actions: [], notes: "" };
const defaultNdFeedingEnvironment: NdFeedingEnvironment = { actions: [], notes: "" };
const defaultNdMedManagement: NdMedManagement = { actions: [], notes: "" };
const defaultNdInfantFeeding: NdInfantFeeding = { breastmilkActions: [], formulaActions: [], notes: "" };
const defaultEducation: NcpEducation = { contentActions: [], applicationActions: [], notes: "" };
const defaultCounseling: NcpCounseling = { theoreticalBasis: [], strategies: [], notes: "" };
const defaultCoordination: NcpCoordination = { collaborationActions: [], dischargeActions: [], notes: "" };

export const defaultIntervention: Intervention = {
  // ── NP ───────────────────────────────────────────────────────────────────────
  npActiveModes:   [],
  npOral:          defaultNpOral,
  npEnteral:       defaultNpEnteral,
  npParenteral:    defaultNpParenteral,
  npIvFluid:       defaultNpIvFluid,

  // ── ND/E/C/RC ────────────────────────────────────────────────────────────────
  ndMealsSnacks:        defaultNdMealsSnacks,
  ndEnPnManagement:     defaultNdEnPnManagement,
  ndSupplementTherapy:  defaultNdSupplementTherapy,
  ndFeedingAssistance:  defaultNdFeedingAssistance,
  ndFeedingEnvironment: defaultNdFeedingEnvironment,
  ndMedManagement:      defaultNdMedManagement,
  ndInfantFeeding:      defaultNdInfantFeeding,
  education:            defaultEducation,
  counseling:           defaultCounseling,
  coordination:         defaultCoordination,

  // ── Retained ─────────────────────────────────────────────────────────────────
  goalStatement:     "",
  goalTimeframe:     "",
  goalMeasurable:    "",
  interventionNotes: "",
};

export const defaultMonitorEval: MonitorEval = {
  monitoredIndicators: [],
  monitorFrequency: "",
  monitoredBy: "",
  criteria_anthropo: "",
  criteria_labs: "",
  criteria_dietary: "",
  criteria_clinical: "",
  criteria_functional: "",
  outcome_progress: "",
  outcome_narrative: "",
  outcome_nextSteps: "",
  dischargeRecs: "",
  transitionPlan: "",
  meNotes: "",
};

export const defaultStandards: Standards = {
  condition: "",
  variant: "",
  currentKcal: "",
  currentProtein: "",
  currentFat: "",
  currentCho: "",
  currentFluid: "",
  icKcal: "",
  icCaf: "1.0",
  extraInputs: {},
  snapshot: null,
};
