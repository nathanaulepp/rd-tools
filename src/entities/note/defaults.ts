// src/entities/note/defaults.ts
// Phase 6: Added defaultDiagnosis, defaultIntervention, defaultMonitorEval
// Phase 8: Added tempMax, ve, fev1, tbsa to defaultClinical

import { getLocalIsoDate } from "../../shared/utils/date";

export const defaultPatientData = {
  lastName: "",
  firstName: "",
  dob: "",
  sex: "",
  mrn: "",
  admissionDate: getLocalIsoDate(),
  noteDate: getLocalIsoDate(),
  languages: "",
};

export const defaultAnthro = {
  ht: "",
  htUnit: "cm",
  wt: "",
  wtUnit: "kg",
  ubw: "",
  ubwDate: "",
  isFluidShift: false,
  edw: "",
  edwUnit: "kg",
  amputations: [] as string[],
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

export const defaultDexaScans = [] as any[];

export const defaultLabs = {} as Record<string, { current: string; historical: string }>;

export const defaultClinical = {
  chiefComplaint: "",
  medHx: "",
  familyHx: "",
  socialHx: "",
  allergiesIntolerances: "",
  medicalDevices: "",
  medications: "",
  temples: "",
  clavicles: "",
  shoulders: "",
  scapula: "",
  interosseous: "",
  thighs: "",
  calves: "",
  orbital: "",
  cheek: "",
  tricepsFat: "",
  midAxillary: "",
  hair: [] as string[],
  eyes: [] as string[],
  mouthLips: [] as string[],
  tongue: [] as string[],
  teethGums: [] as string[],
  headNeck: [] as string[],
  nails: [] as string[],
  skin: [] as string[],
  pittingEdema: "",
  pedalEdema: "",
  ascites: "",
  edemaDescription: "",
  temp: "",
  hr: "",
  spo2: "",
  bp: "",
  rr: "",
  screenings: "",
  gripStrength: "",
  giDistress: "",
  chewing: "",
  oralHygiene: "",
  swallowing: "",
  imaging_smi: "",
  imaging_muscleArea: "",
  imaging_muscleAttenuation: "",
  imaging_imat: "",
  imaging_vat: "",
  imaging_notes: "",
  clinicalNotes: "",
  // Phase 8: Cross-domain inputs for nutrition standards equations
  tempMax: "",        // Max temp past 24h (°F) — used in PSU 2003b
  ve: "",             // Minute ventilation (L/min) — used in PSU 2003b
  fev1: "",           // FEV₁ % predicted — used in CF equation
  tbsa: "",           // Total body surface area burned (%) — used in Curreri formula
};

export const defaultDietary = {
  recall: [{ label: "Meal 1", value: "" }],
  macroAdequacy: "",
  mealPatterns: "",
  currentDiets: "",
  fluidIntake: "",
  eatingEnv: "",
  culturalReligious: "",
  socialDynamics: "",
  dietOrder: "",
  oralCalories: "",
  oralProtein: "",
  oralWater: "",
  eeiPercent: "",
  eeiTimeframe: "",
  herbalCAM: "",
  supplements: "",
  understanding: "",
  readiness: "5",
  psychTies: "",
  mealPrep: "",
  eatingOut: "",
  bingePurge: "",
  foodSecurity: "",
  foodSupplies: "",
  transport: "",
  physicalLevel: "",
  adls: "",
  feedingTasks: "",
  perception: "",
  qolGoals: "",
};

// ─── Phase 6: New ADIME domain defaults ──────────────────────────────────────

export const defaultDiagnosis = {
  problem: "",
  etiology: "",
  signsSymptoms: "",
  additionalDiagnoses: [] as Array<{
    id: number;
    problem: string;
    etiology: string;
    signsSymptoms: string;
  }>,
  nutritionDxNarrative: "",
  priorityRanking: "",
};

export const defaultIntervention = {
  nd_mealsSnacks: "",
  nd_supplementalFeeding: "",
  nd_feedingAssistance: "",
  nd_feedingEnvironment: "",
  nd_nutritionRelatedMedMgmt: "",
  ed_purpose: "",
  ed_content: [] as string[],
  ed_application: "",
  ed_other: "",
  c_theory: "",
  c_strategy: [] as string[],
  c_other: "",
  cc_teamMembers: "",
  cc_referrals: "",
  cc_dischargeRecommendations: "",
  cc_followUpPlan: "",
  goalStatement: "",
  goalTimeframe: "",
  goalMeasurable: "",
  interventionNotes: "",
};

export const defaultMonitorEval = {
  monitoredIndicators: [] as string[],
  monitorFrequency: "",
  monitoredBy: "",
  criteria_anthropo: "",
  criteria_labs: "",
  criteria_dietary: "",
  criteria_clinical: "",
  criteria_functional: "",
  outcome_progress: "" as "" | "improved" | "no-change" | "worsened" | "met" | "not-met",
  outcome_narrative: "",
  outcome_nextSteps: "",
  dischargeRecs: "",
  transitionPlan: "",
  meNotes: "",
};

export const defaultStandards = {
  condition: "" as any,
  variant: "",
  currentKcal: "",
  currentProtein: "",
  currentFluid: "",
  icKcal: "",
  icCaf: "1.0",
  extraInputs: {} as Record<string, string>,
};