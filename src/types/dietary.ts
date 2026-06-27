// src/types/dietary.ts

export interface RecallMeal {
  label: string;
  value: string;
}

export interface Dietary {
  // D2 — 24-Hour Recall
  recall: RecallMeal[];
  mealPatterns: string;
  currentDiets: string;
  fluidIntake: string;
  eeiPercent: string;
  eeiTimeframe: string;

  // D1 — Oral Nutrition Rx (written by D1NutritionRx)
  dietOrder: string[];
  oralCalories: string;
  oralProtein: string;
  oralCho: string;
  oralFat: string;
  oralWater: string;

  // D3 — Physical Activity & Function
  physicalLevel: string;
  adls: string;
  feedingTasks: string;

  // D4 — Knowledge, Beliefs & Attitudes
  understanding: string;
  readiness: string;  // "1"–"10"
  psychTies: string;

  // D5 — Behavior
  mealPrep: string;
  eatingOut: string;
  bingePurge: string;

  // D6 — Access Factors
  foodSecurity: string;
  foodSupplies: string;
  transport: string;

  // D7 — Cultural & Social Food Context
  culturalReligious: string;
  socialDynamics: string;
  eatingEnv: string;

  // D8 — Patient-Centered Measures
  perception: string;
  qolGoals: string;

  // D9 — Supplements & DNI
  herbalCAM: string;
  supplements: string;

  // EN/PN state — typed loosely here; D1NutritionRx owns the full shape
  enState?: unknown;
  pnState?: unknown;
  savedFormulas?: string[];

  ivOrders: IVOrder[];
  ivNextId: number;
  verifiedRxDiet?: boolean;
}

export type IVOrderType =
  | "Dextrose 5% (D5W)"
  | "Dextrose 10% (D10W)"
  | "Dextrose 20% (D20W)"
  | "Dextrose 40% (D40W)"
  | "Dextrose 50% (D50W)"
  | "Dextrose 70% (D70W)"
  | "Propofol 1% (10mg/mL)"
  | "Clevidipine 0.5mg/mL (lipid emulsion)"
  | "Trisodium Citrate (4% solution)";

export interface IVOrder {
  id: number;
  type: IVOrderType | "";
  totalVolumeMl: string;
  rateMlHr: string;
  hrsPerDay: string;
}
