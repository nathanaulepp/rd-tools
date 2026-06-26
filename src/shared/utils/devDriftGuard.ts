import { MASTER_DOMAINS } from "../constants/masterFieldRegistry";

/**
 * Hardcoded list of keys currently validated in src/shared/api/db.ts -> submitNote.
 * Update this whenever fieldValues in db.ts is modified.
 */
const VALIDATED_KEYS = [
  "first_name", "last_name", "dob", "sex", "mrn", "languages",
  "note_date", "admission_date",
  "ht", "wt", "ubw", "ubwDate", "waist", "mac", "calf", "head", "triceps", "subscapular", "suprailiac", "thigh", "edw", "circUnit", "past_ht", "past_wt", "past_head", "past_htDate", "past_wtDate", "past_headDate", "amputations", "ampSegments", "dexaScans",
  "chiefComplaint", "medHx", "familyHx", "socialHx", "allergiesIntolerances", "medicalDevices", "medications", "temp", "hr", "spo2", "bp", "rr", "temples", "clavicles", "shoulders", "scapula", "interosseous", "thighs", "calves", "orbital", "cheek", "tricepsFat", "midAxillary", "pittingEdema", "pedalEdema", "ascites", "gripStrength", "giDistress", "giSymptoms", "stoolType", "dentition", "swallowChewConcerns", "nicheConditionFlags", "imaging_smi", "tempMax", "ve", "fev1", "tbsa", "clinicalNotes", "screenings", "oralHygiene", "edemaDescription", "imaging_muscleAttenuation", "imaging_imat", "imaging_vat", "imaging_notes", "hair", "eyes", "mouthLips", "tongue", "teethGums", "headNeck", "nails", "skin",
  "dietOrder", "oralCalories", "oralProtein", "oralWater", "fluidIntake", "mealPatterns", "eeiPercent", "eeiTimeframe", "herbalCAM", "supplements", "understanding", "readiness", "foodSecurity", "physicalLevel", "adls", "currentDiets", "feedingTasks", "psychTies", "mealPrep", "eatingOut", "bingePurge", "foodSupplies", "transport", "culturalReligious", "socialDynamics", "eatingEnv", "perception", "qolGoals", "enState", "pnState", "recall", "ivOrders",
  "problem", "etiology", "signsSymptoms", "nutritionDxNarrative", "priorityRanking", "additionalDiagnoses",
  "goalStatement", "interventionNotes", "nd_mealsSnacks", "nd_supplementalFeeding", "ed_purpose", "c_theory", "cc_followUpPlan", "npOral_energyKcal", "npOral_textureModification", "npOral_oralSupplements", "npOral_isNpo", "npEnteral_formulaName", "npEnteral_adminMethod", "npEnteral_kcalLow", "npEnteral_kcalHigh", "npParenteral_energyKcal", "npParenteral_solutionType", "npIvFluid_solution", "goalTimeframe", "goalMeasurable", "npActiveModes", "ndImplementation",
  "monitorFrequency", "monitoredBy", "outcome_progress", "dischargeRecs", "meNotes", "criteria_anthropo", "criteria_labs", "criteria_dietary", "criteria_clinical", "criteria_functional", "outcome_nextSteps", "transitionPlan", "monitoredIndicators",
  "diagnosis"
];

/**
 * Development-only utility to catch drift between the Master Field Registry
 * and the Submission Validator in db.ts.
 */
export function checkRegistryDrift(): void {
  if (import.meta.env.PROD) return;

  const registryKeys = MASTER_DOMAINS.flatMap(domain => 
    domain.fields
      .filter(f => !f.locked)
      .map(f => f.key)
  );

  // Note: first_name, last_name, dob, note_date are locked in registry but present in fieldValues.
  // 'problem' is registry key 'diagnosis' in fieldValues.
  // 'diagnosis' in fieldValues is raw blob.
  
  const inRegistryNotValidated = registryKeys.filter(k => {
    // Exception: 'diagnosis' in registry maps to 'problem' in validator
    if (k === "diagnosis") return !VALIDATED_KEYS.includes("problem");
    return !VALIDATED_KEYS.includes(k);
  });

  const inValidatorNotRegistry = VALIDATED_KEYS.filter(k => {
    // Exceptions: fields that are locked in registry or map to different names
    if (["first_name", "last_name", "dob", "note_date"].includes(k)) return false;
    if (k === "problem") return !registryKeys.includes("diagnosis");
    if (k === "diagnosis") return false; // raw blob
    return !registryKeys.includes(k);
  });

  if (inRegistryNotValidated.length > 0 || inValidatorNotRegistry.length > 0) {
    console.warn("[DriftGuard] Registry/Validator mismatch:", {
      inRegistryNotValidated,
      inValidatorNotRegistry,
    });
  } else {
    console.log("[DriftGuard] Registry sync: OK");
  }
}
