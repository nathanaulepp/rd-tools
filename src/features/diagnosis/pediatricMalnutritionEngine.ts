// src/features/diagnosis/pediatricMalnutritionEngine.ts
import { Severity, MalnutritionDiagnosis } from "./malnutritionEngine";

export interface PediatricMalnutritionCriteria {
  // Z-Score Indicators
  wtForLengthZ: Severity;
  bmiForAgeZ: Severity;
  lengthHtZ: Severity;
  muacZ: Severity;
  
  // Growth & Velocity Indicators
  wtForAgeDeltaZ: Severity;
  wtGainVelocityZ: Severity;
  wtGainVelocityPct: Severity;
  decelerationZ: Severity;
  
  // Weight Loss (2-20 years)
  weightLossPct: Severity;

  // Other Indicators
  nutrientIntake: Severity;
  physicalAssessment: Severity;
  functionalCapacity: Severity;
}

export function diagnosePediatricMalnutrition(
  criteria: PediatricMalnutritionCriteria
): MalnutritionDiagnosis {
  const values = Object.values(criteria);
  const severeCount = values.filter(v => v === "Severe").length;
  const moderateCount = values.filter(v => v === "Moderate").length;
  const mildCount = values.filter(v => v === "Mild").length; // User mentioned "Mild" in thresholds

  let finalDiagnosis: "None" | "Moderate Malnutrition" | "Severe Malnutrition" = "None";
  const reasoning: string[] = [];

  // ASPEN Pediatric Diagnosis usually requires 1 or more criteria for diagnosis, 
  // but let's follow a similar "Rule of Two" for consistency if implied, 
  // or at least identify the highest severity.
  // Actually, for Pediatrics, often ONE criterion is enough for a diagnosis level.
  // "A z-score of -1 to -1.99 is mild, -2 to -2.99 is moderate, and -3 or less is severe."
  
  if (severeCount >= 1) {
    finalDiagnosis = "Severe Malnutrition";
  } else if (moderateCount >= 1) {
    finalDiagnosis = "Moderate Malnutrition";
  } else if (mildCount >= 1) {
    // UI might not have "Mild Malnutrition" in its enum yet, so we stay at "None" 
    // but note it in reasoning.
    reasoning.push("Mild malnutrition criteria met (Z-score -1 to -1.9), but diagnosis level starts at Moderate.");
  }

  if (finalDiagnosis === "None" && values.some(v => v !== "None" && v !== "Not Applicable")) {
      reasoning.push("Criteria present but insufficient for Moderate/Severe diagnosis.");
  }

  // Need to map PediatricMalnutritionCriteria to MalnutritionCriteria for the UI return type
  // This is a bit of a hack to satisfy the return type requirement
  const mappedCriteria: any = {
    weightLoss: criteria.weightLossPct,
    eei: criteria.nutrientIntake,
    muscleWasting: criteria.physicalAssessment,
    fatLoss: criteria.physicalAssessment,
    fluidAccumulation: "None",
    gripStrength: criteria.functionalCapacity
  };

  return {
    diagnosis: finalDiagnosis,
    criteria: mappedCriteria,
    reasoning
  };
}

/**
 * Helper to evaluate a Z-score against standard pediatric thresholds.
 */
export function evaluateZScoreSeverity(z: number | null): Severity {
  if (z === null) return "None";
  if (z <= -3) return "Severe";
  if (z <= -2) return "Moderate";
  if (z <= -1) return "Mild" as any; // Cast because Severity enum in adult engine lacks 'Mild'
  return "None";
}

/**
 * Helper for length/height Z-score (only moderate/severe)
 */
export function evaluateLengthHtZ(z: number | null): Severity {
  if (z === null) return "None";
  if (z <= -3) return "Severe";
  if (z <= -2) return "Moderate";
  return "None";
}
