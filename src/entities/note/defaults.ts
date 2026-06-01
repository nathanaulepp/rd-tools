// src/entities/note/defaults.ts
// Typed default values for every domain.
// All defaults now satisfy the strict interfaces in src/types/.
// Phase 8: Added tempMax, ve, fev1, tbsa to defaultClinical.

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
  eatingEnv: "",
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
  herbalCAM: "",
  supplements: "",
  perception: "",
  qolGoals: "",
};

export const defaultDiagnosis: Diagnosis = {
  problem: "",
  etiology: "",
  signsSymptoms: "",
  additionalDiagnoses: [],
  nutritionDxNarrative: "",
  priorityRanking: "",
};

export const defaultIntervention: Intervention = {
  goalStatement: "",
  goalTimeframe: "",
  goalMeasurable: "",
  nd_mealsSnacks: "",
  nd_supplementalFeeding: "",
  nd_feedingAssistance: "",
  nd_feedingEnvironment: "",
  nd_nutritionRelatedMedMgmt: "",
  ed_purpose: "",
  ed_content: [],
  ed_application: "",
  ed_other: "",
  c_theory: "",
  c_strategy: [],
  c_other: "",
  cc_teamMembers: "",
  cc_referrals: "",
  cc_dischargeRecommendations: "",
  cc_followUpPlan: "",
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
  currentFluid: "",
  icKcal: "",
  icCaf: "1.0",
  extraInputs: {},
  snapshot: null,
};