// src/types/dietary.ts

export interface RecallMeal {
  label: string;
  value: string;
}

export interface Dietary {
  // D2 — 24-Hour Recall
  recall: RecallMeal[];
  macroAdequacy: string;
  mealPatterns: string;
  currentDiets: string;
  fluidIntake: string;
  eeiPercent: string;
  eeiTimeframe: string;

  // D1 — Oral Nutrition Rx (written by D1NutritionRx)
  dietOrder: string;
  oralCalories: string;
  oralProtein: string;
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

  // D8 — Supplements / Drug-Nutrient Interactions
  herbalCAM: string;
  supplements: string;

  // D9 — Patient-Centered Measures
  perception: string;
  qolGoals: string;

  // EN/PN state — typed loosely here; D1NutritionRx owns the full shape
  enState?: unknown;
  pnState?: unknown;
  savedFormulas?: string[];

  // Total Intakes (calculated sums)
  totalKcal: string;
  totalProtein: string;
  totalFat: string;
  totalCho: string;
}