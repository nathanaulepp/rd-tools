// src/entities/note/defaults.ts
// Phase 6: Added defaultDiagnosis, defaultIntervention, defaultMonitorEval

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

/**
 * D (Nutrition Diagnosis) domain defaults.
 * Stores PES statements (Problem, Etiology, Signs/Symptoms).
 */
export const defaultDiagnosis = {
  // Primary diagnosis
  problem: "",            // IDNT term, e.g. "Inadequate energy intake (NI-1.2)"
  etiology: "",           // Related to / due to
  signsSymptoms: "",      // As evidenced by

  // Additional diagnoses
  additionalDiagnoses: [] as Array<{
    id: number;
    problem: string;
    etiology: string;
    signsSymptoms: string;
  }>,

  // Supporting narrative
  nutritionDxNarrative: "",
  priorityRanking: "",    // e.g. "Primary: energy; Secondary: protein"
};

/**
 * I (Intervention) domain defaults.
 * Covers ND (Nutrition Delivery), E (Nutrition Education),
 * C (Nutrition Counseling), CC (Coordination of Care).
 */
export const defaultIntervention = {
  // ND: Nutrition Delivery
  nd_mealsSnacks: "",
  nd_supplementalFeeding: "",
  nd_feedingAssistance: "",
  nd_feedingEnvironment: "",
  nd_nutritionRelatedMedMgmt: "",

  // E: Nutrition Education
  ed_purpose: "",
  ed_content: [] as string[],   // multi-select topics
  ed_application: "",
  ed_other: "",

  // C: Nutrition Counseling
  c_theory: "",               // Motivational interviewing, CBT, etc.
  c_strategy: [] as string[], // multi-select strategies
  c_other: "",

  // CC: Coordination of Care
  cc_teamMembers: "",
  cc_referrals: "",
  cc_dischargeRecommendations: "",
  cc_followUpPlan: "",

  // Goals
  goalStatement: "",
  goalTimeframe: "",
  goalMeasurable: "",

  interventionNotes: "",
};

/**
 * ME (Monitor & Evaluate) domain defaults.
 * Tracks what is being monitored, criteria, and outcomes.
 */
export const defaultMonitorEval = {
  // What to monitor
  monitoredIndicators: [] as string[],  // multi-select
  monitorFrequency: "",
  monitoredBy: "",

  // Evaluation criteria / expected outcomes
  criteria_anthropo: "",
  criteria_labs: "",
  criteria_dietary: "",
  criteria_clinical: "",
  criteria_functional: "",

  // Outcomes (filled on follow-up)
  outcome_progress: "" as "" | "improved" | "no-change" | "worsened" | "met" | "not-met",
  outcome_narrative: "",
  outcome_nextSteps: "",

  // Discharge / transition
  dischargeRecs: "",
  transitionPlan: "",

  meNotes: "",
};

/**
 * S (Comparative Standards) domain defaults.
 * Stores settings for evaluation.
 */
export const defaultStandards = {
  condition: "" as any,
  variant: "",
  currentKcal: "",
  currentProtein: "",
  currentFluid: "",
  icKcal: "",
  dryWt: "",
  renalDryWeight: "",
  extraInputs: {} as Record<string, string>,
};