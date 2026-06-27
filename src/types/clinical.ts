// src/types/clinical.ts

export type NFPESeverity = "Normal" | "Mild" | "Moderate" | "Severe" | "";
export type EdemaGrade = "None" | "+1" | "+2" | "+3" | "+4" | "";
export type AscitesSeverity = "None" | "Mild" | "Moderate" | "Severe" | "";
export type GripStrengthStatus = "WNL" | "Measurably Reduced" | "";
export type PedalEdema = "Yes" | "No" | "";

export interface Clinical {
  // C1 — Medical Context
  allergiesIntolerances: string;
  medicalDevices: string;
  medications: string;

  // C2 — Vital Signs
  temp: string;
  hr: string;
  spo2: string;
  bp: string;
  rr: string;
  screenings: string;

  // C4 — GI & Systemic
  giDistress: string;
  oralHygiene: string;
  fev1: string;    // FEV₁ % predicted — used in CF equation; cross-domain
  tbsa: string;    // Total body surface area burned — used in Curreri; cross-domain
  giSymptoms: string[];
  stoolType: string;
  dentition: string;
  swallowChewConcerns: string[];
  nicheConditionFlags: string[];

  // C2 (formerly C3) — GI expanded inputs
  nauseaVas: string;                    // "0"–"10"
  vomitingEpisodes: string;
  vomitingDuration: string;
  diarrheaEpisodes: string;
  diarrheaDuration: string;
  constipationDuration: string;
  bloatingDuration: string;
  abdominalPainType: string;            // "episodic" | "continuous" | ""
  abdominalPainEpisodes: string;
  abdominalPainDuration: string;
  abdominalPainVas: string;
  bmFrequency: string;
  giComments: string;

  // Mouth
  dentitionStatus: string;              // single-select dropdown
  dentitionModifiers: string[];         // multi-select
  chewFunctionality: string;            // single-select dropdown
  swallowFunctionality: string[];       // multi-select
  mouthComments: string;

  // Oral Hygiene structured
  hasToothbrush: string;                // "yes" | "no" | ""
  brushingFrequency: string;            // "BID" | "daily" | "some days" | "no" | ""
  flossingFrequency: string;            // "daily" | "weekly" | "no" | ""
  usesMouthwash: string;                // "yes" | "no" | ""
  removesAppliances: string;            // "yes" | "no" | ""
  cleansAppliances: string;             // "yes" | "no" | ""
  fluorideToothpaste: string;           // "yes" | "no" | ""
  spitsToothpaste: string;              // "yes" | "no" | ""
  oralHygieneComments: string;

  // C5 — NFPE: Muscle wasting
  temples: NFPESeverity;
  clavicles: NFPESeverity;
  shoulders: NFPESeverity;
  scapula: NFPESeverity;
  interosseous: NFPESeverity;
  thighs: NFPESeverity;
  calves: NFPESeverity;

  // C5 — NFPE: Subcutaneous fat
  orbital: NFPESeverity;
  cheek: NFPESeverity;
  tricepsFat: NFPESeverity;
  midAxillary: NFPESeverity;

  // C5 — NFPE: Micronutrient signs (multi-select chip arrays)
  hair: string[];
  eyes: string[];
  mouthLips: string[];
  tongue: string[];
  teethGums: string[];
  headNeck: string[];
  nails: string[];
  skin: string[];

  // C5 — NFPE: Fluid accumulation
  pittingEdema: EdemaGrade;
  pedalEdema: PedalEdema;
  ascites: AscitesSeverity;
  edemaDescription: string;

  // C5 — Functional
  gripStrength: GripStrengthStatus;

  // C6 — Imaging / Radiology
  imaging_smi: string;
  imaging_muscleArea: string;
  imaging_muscleAttenuation: string;
  imaging_imat: string;
  imaging_vat: string;
  imaging_notes: string;

  // PSU 2003b cross-domain inputs (written back from Standards domain)
  tempMax: string;   // Max temp past 24h (°F)
  ve: string;        // Minute ventilation (L/min)

  // General
  clinicalNotes: string;
}