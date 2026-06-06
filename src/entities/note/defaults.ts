// src/entities/note/defaults.ts
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
  NdImplementation,
} from "../../types/intervention";

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
  ht: "", htUnit: "cm", wt: "", wtUnit: "kg",
  ubw: "", ubwDate: "",
  isFluidShift: false, edw: "", edwUnit: "kg",
  amputations: [],
  waist: "", mac: "", calf: "", head: "", circUnit: "cm",
  triceps: "", subscapular: "", suprailiac: "", thigh: "", skinfoldUnit: "mm",
  past_ht: "", past_htUnit: "cm", past_wt: "", past_wtUnit: "kg",
  past_head: "", past_headUnit: "cm",
  past_htDate: "", past_wtDate: "", past_headDate: "",
};

export const defaultDexaScans: DexaScan[] = [];

export const defaultLabs: Labs = {};

export const defaultClinical: Clinical = {
  chiefComplaint: "", medHx: "", familyHx: "", socialHx: "",
  allergiesIntolerances: "", medicalDevices: "", medications: "",
  temp: "", hr: "", spo2: "", bp: "", rr: "", screenings: "",
  giDistress: "", chewing: "", oralHygiene: "", swallowing: "", fev1: "", tbsa: "",
  temples: "", clavicles: "", shoulders: "", scapula: "", interosseous: "", thighs: "", calves: "",
  orbital: "", cheek: "", tricepsFat: "", midAxillary: "",
  hair: [], eyes: [], mouthLips: [], tongue: [], teethGums: [], headNeck: [], nails: [], skin: [],
  pittingEdema: "", pedalEdema: "", ascites: "", edemaDescription: "",
  gripStrength: "",
  imaging_smi: "", imaging_muscleArea: "", imaging_muscleAttenuation: "",
  imaging_imat: "", imaging_vat: "", imaging_notes: "",
  tempMax: "", ve: "",
  clinicalNotes: "",
};

export const defaultDietary: Dietary = {
  recall: [{ label: "Meal 1", value: "" }],
  macroAdequacy: "", mealPatterns: "", currentDiets: "", fluidIntake: "",
  eeiPercent: "", eeiTimeframe: "",
  dietOrder: "", oralCalories: "", oralProtein: "", oralWater: "",
  physicalLevel: "", adls: "", feedingTasks: "",
  understanding: "", readiness: "5", psychTies: "",
  mealPrep: "", eatingOut: "", bingePurge: "",
  foodSecurity: "", foodSupplies: "", transport: "",
  culturalReligious: "", socialDynamics: "", eatingEnv: "",
  herbalCAM: "", supplements: "",
  perception: "", qolGoals: "",
  totalKcal: "", totalProtein: "", totalFat: "", totalCho: "",
};

export const defaultDiagnosis: Diagnosis = {
  problem: "", etiology: "", signsSymptoms: "",
  additionalDiagnoses: [],
  nutritionDxNarrative: "", priorityRanking: "",
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
  kcalLow: "", kcalHigh: "",
  proteinLow: "", proteinHigh: "",
  fluidLow: "", fluidHigh: "",
  formulaName: "", dailyVolumeMl: "", infusionRateMlHr: "",
  adminMethod: "", bodyPosition: "", other: "",
};

const defaultNpParenteral: NpParenteralNutrition = {
  energyKcal: "", aminoAcidsG: "", dextroseG: "", lipidsG: "",
  sodiumMeq: "", potassiumMeq: "", magnesiumMeq: "", calciumMeq: "", phosphorusMmol: "",
  mviMl: "", mteMl: "",
  solutionType: "", totalFluidVolumeMl: "",
  adminMethod: "", valuesInclusion: "",
};

const defaultNpIvFluid: NpIvFluid = {
  energyKcal: "", dextroseG: "", electrolyteAdditives: "",
  solution: "", adminMethod: "", valuesInclusion: "",
};

const defaultNdImplementation: NdImplementation = {
  selected: [],
  notes: {},
};

export const defaultIntervention: Intervention = {
  npActiveModes:    [],
  npOral:           defaultNpOral,
  npEnteral:        defaultNpEnteral,
  npParenteral:     defaultNpParenteral,
  npIvFluid:        defaultNpIvFluid,
  ndImplementation: defaultNdImplementation,
  goalStatement:    "",
  goalTimeframe:    "",
  goalMeasurable:   "",
  interventionNotes: "",
};

export const defaultMonitorEval: MonitorEval = {
  monitoredIndicators: [], monitorFrequency: "", monitoredBy: "",
  criteria_anthropo: "", criteria_labs: "", criteria_dietary: "",
  criteria_clinical: "", criteria_functional: "",
  outcome_progress: "", outcome_narrative: "", outcome_nextSteps: "",
  dischargeRecs: "", transitionPlan: "", meNotes: "",
};

export const defaultStandards: Standards = {
  condition: "", variant: "",
  currentKcal: "", currentProtein: "", currentFat: "", currentCho: "", currentFluid: "",
  icKcal: "", icCaf: "1.0",
  extraInputs: {},
  snapshot: null,
};