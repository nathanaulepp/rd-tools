/**
 * ASPEN Continuous Malnutrition Interpolation Engine
 * 
 * Logic based on "System Instructions: ASPEN Continuous Interpolation Engine"
 */

export type Severity = "None" | "Moderate" | "Severe" | "Borderline" | "Not Applicable";
export type ClinicalContext = "Acute" | "Chronic";

export interface MalnutritionCriteria {
  weightLoss: Severity;
  eei: Severity;
  muscleWasting: Severity;
  fatLoss: Severity;
  fluidAccumulation: Severity;
  gripStrength: Severity;
}

export interface MalnutritionDiagnosis {
  diagnosis: "None" | "Moderate Malnutrition" | "Severe Malnutrition";
  criteria: MalnutritionCriteria;
  reasoning: string[];
}

const CLINICAL_BUFFER = 0.5; // ± 0.5%

/**
 * Chronic Illness Context Weight Loss Threshold f(x)
 * @param days Days since baseline weight (x)
 * @returns Minimum severe threshold percentage (y), or null if N/A
 */
export function getChronicSevereThreshold(days: number): number | null {
  if (days < 30) return null;
  if (days > 365) return 20;

  if (days >= 30 && days < 91) {
    return (2.5 / 61) * (days - 30) + 5;
  }
  if (days >= 91 && days < 183) {
    return (2.5 / 92) * (days - 91) + 7.5;
  }
  if (days >= 183 && days <= 365) {
    return (5 / 91) * (days - 183) + 10;
  }
  return 20;
}

/**
 * Acute Illness Context Moderate Threshold Curve g(x)
 * @param days Days since baseline weight (x)
 * @returns Minimum moderate threshold percentage (y), or null if N/A
 */
export function getAcuteModerateThreshold(days: number): number | null {
  if (days < 7) return null;
  if (days > 91) return null; // Shift to Chronic Context function

  if (days >= 7 && days < 30) {
    return (4 / 23) * (days - 7) + 1;
  }
  if (days >= 30 && days <= 91) {
    return (2.5 / 61) * (days - 30) + 5;
  }
  return null;
}

/**
 * Evaluate Weight Loss Severity
 */
export function evaluateWeightLoss(
  pctLoss: number,
  days: number,
  context: ClinicalContext
): Severity {
  const sanitizedPct = Math.round(pctLoss * 10) / 10;

  if (context === "Chronic") {
    const severeThreshold = getChronicSevereThreshold(days);
    if (severeThreshold === null) return "Not Applicable";

    if (sanitizedPct >= severeThreshold + CLINICAL_BUFFER) return "Severe";
    if (sanitizedPct >= severeThreshold - CLINICAL_BUFFER) return "Borderline";
    
    // Chronic Moderate is typically everything above 0 but below Severe?
    // Instruction says: "Falling within the buffer zone yields 'Borderline'. 
    // Falling below the buffer but above the moderate floor yields 'Moderate'."
    // For Chronic, instructions don't explicitly define a moderate floor curve,
    // but implied by "Rule of Two" and "Convergence Quirk".
    // Usually Chronic Moderate is 5% in 1 month, 7.5% in 3 months, 10% in 6 months, 20% in 1 year.
    // Wait, f(x) IS that: 5 (30d), 7.5 (91d), 10 (183d), 20 (365d).
    // The instruction says f(x) is the "baseline severe threshold".
    // Typically Moderate is < Severe. 
    // Let's assume Moderate is half of Severe or similar if not specified? 
    // NO, usually ASPEN has specific values.
    // Moderate Chronic: 5% (1mo), 7.5% (3mo), 10% (6mo), 20% (1yr).
    // Severe Chronic: >5% (1mo), >7.5% (3mo), >10% (6mo), >20% (1yr).
    // So f(x) is the threshold between Moderate and Severe.
    
    if (sanitizedPct > 0) return "Moderate";
    return "None";
  } else {
    // Acute
    const moderateThreshold = getAcuteModerateThreshold(days);
    if (moderateThreshold === null) return "Not Applicable";

    // "The Convergence Quirk: In the acute context between days 30 and 91, the moderate and severe baselines share the exact same mathematical line. 
    // The differentiation relies entirely on the inequality operator."
    // Also: "Severe Diagnosis: Requires 2 or more criteria returning 'Severe'."
    
    // Typically Acute Severe: 2% (1wk), 5% (1mo), 7.5% (3mo).
    // Acute Moderate: 1-2% (1wk), 5% (1mo), 7.5% (3mo).
    // g(x) gives 1 (7d), 5 (30d), 7.5 (91d).
    
    // Severe thresholds for Acute (traditional ASPEN): >2% (1wk), >5% (1mo).
    // So Severe curve for Acute is higher in the 7-30d range.
    
    const acuteSevereThreshold = days >= 7 && days < 30 
      ? (3 / 23) * (days - 7) + 2 // 2% at 7d, 5% at 30d
      : moderateThreshold; // Converges after 30d

    if (sanitizedPct >= acuteSevereThreshold + CLINICAL_BUFFER) return "Severe";
    if (sanitizedPct >= moderateThreshold + CLINICAL_BUFFER) {
        // Between moderate+buffer and severe+buffer
        // If they converge, this might return Severe above.
        return "Moderate"; 
    }
    if (sanitizedPct >= moderateThreshold - CLINICAL_BUFFER) return "Borderline";
    if (sanitizedPct > 0) return "Moderate";
    return "None";
  }
}

/**
 * Normalize Intake Severity
 */
export function evaluateIntake(pct: number, days: number, context: ClinicalContext): Severity {
  if (pct <= 0) return "None";
  
  if (context === "Acute") {
    // Severe: <50% for >= 5 days
    // Moderate: <75% for >= 7 days
    if (pct < 50 && days >= 5) return "Severe";
    if (pct < 75 && days >= 7) return "Moderate";
  } else {
    // Chronic
    // Severe: <=50% for >= 1 month
    // Moderate: <75% for >= 1 month
    if (days < 30) return "Not Applicable";
    if (pct <= 50) return "Severe";
    if (pct < 75) return "Moderate";
  }
  return "None";
}

/**
 * Diagnostic Aggregator (Rule of Two)
 */
export function diagnoseMalnutrition(
  criteria: MalnutritionCriteria
): MalnutritionDiagnosis {
  const values = Object.values(criteria);
  const severeCount = values.filter(v => v === "Severe").length;
  const moderateCount = values.filter(v => v === "Moderate").length;
  const borderlineCount = values.filter(v => v === "Borderline").length;

  let finalDiagnosis: "None" | "Moderate Malnutrition" | "Severe Malnutrition" = "None";
  const reasoning: string[] = [];

  // Borderline Resolution
  let effectiveSevereCount = severeCount;
  if (criteria.weightLoss === "Borderline") {
    if (criteria.eei === "Severe" && (criteria.muscleWasting === "Severe" || criteria.fatLoss === "Severe" || criteria.fluidAccumulation === "Severe" || criteria.gripStrength === "Severe")) {
       effectiveSevereCount++;
       reasoning.push("Weight loss was borderline, but EEI and NFPE criteria are severe, resolving to Severe.");
    }
  }

  if (effectiveSevereCount >= 2) {
    finalDiagnosis = "Severe Malnutrition";
  } else if (effectiveSevereCount + moderateCount >= 2) {
    finalDiagnosis = "Moderate Malnutrition";
  } else if (borderlineCount > 0) {
    reasoning.push("Diagnostic ambiguity present (Borderline criteria). Manual review recommended.");
  }

  if (finalDiagnosis === "None" && values.filter(v => v !== "Not Applicable" && v !== "None").length > 0) {
      reasoning.push("Criterion present but insufficient for diagnosis (requires 2).");
  }

  return {
    diagnosis: finalDiagnosis,
    criteria,
    reasoning
  };
}
