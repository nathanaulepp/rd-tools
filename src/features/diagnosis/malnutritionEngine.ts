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

    // Moderate floor = 80% of the severe threshold (0.8 × f(x)).
    // Band structure:
    //   >= sevThresh + 0.5                       → Severe
    //   [sevThresh - 0.5, sevThresh + 0.5)        → Borderline (severe edge)
    //   [0.8 × sevThresh, sevThresh - 0.5)        → Moderate
    //   [0.8 × sevThresh - 0.5, 0.8 × sevThresh) → Borderline (moderate edge)
    //   < 0.8 × sevThresh - 0.5                  → None
    const chronicModerateFloor = 0.8 * severeThreshold;

    if (sanitizedPct >= severeThreshold + CLINICAL_BUFFER) return "Severe";
    if (sanitizedPct >= severeThreshold - CLINICAL_BUFFER) return "Borderline";
    if (sanitizedPct >= chronicModerateFloor) return "Moderate";
    if (sanitizedPct >= chronicModerateFloor - CLINICAL_BUFFER) return "Borderline";
    return "None";
  } else {
    // Acute
    const moderateThreshold = getAcuteModerateThreshold(days);
    if (moderateThreshold === null) return "Not Applicable";

    // Severe threshold runs higher than moderate in days 7-30 (2%→5%),
    // then converges with the moderate line after day 30.
    const acuteSevereThreshold = days >= 7 && days < 30
      ? (3 / 23) * (days - 7) + 2  // 2% at 7d, 5% at 30d
      : moderateThreshold;          // Converges after 30d

    // Moderate floor = 80% of the severe threshold.
    // Band structure:
    //   >= sevThresh + 0.5                       → Severe
    //   [sevThresh - 0.5, sevThresh + 0.5)        → Borderline (severe edge)
    //   [0.8 × sevThresh, sevThresh - 0.5)        → Moderate
    //   [0.8 × sevThresh - 0.5, 0.8 × sevThresh) → Borderline (moderate edge)
    //   < 0.8 × sevThresh - 0.5                  → None
    //
    // Collapse guard: on days 7-10 the 0.8× floor falls inside the severe
    // buffer zone (mod_floor >= sevThresh - 0.5). In that case the Moderate
    // band has zero width and is skipped; Borderline extends from
    // (mod_floor - 0.5) up to the severe buffer ceiling.
    const acuteModerateFloor = 0.8 * acuteSevereThreshold;
    const moderateBandCollapses = acuteModerateFloor >= acuteSevereThreshold - CLINICAL_BUFFER;

    if (sanitizedPct >= acuteSevereThreshold + CLINICAL_BUFFER) return "Severe";
    if (sanitizedPct >= acuteSevereThreshold - CLINICAL_BUFFER) return "Borderline";

    if (moderateBandCollapses) {
      // Moderate band absent; extend borderline down to mod_floor - 0.5
      if (sanitizedPct >= acuteModerateFloor - CLINICAL_BUFFER) return "Borderline";
      return "None";
    }

    if (sanitizedPct >= acuteModerateFloor) return "Moderate";
    if (sanitizedPct >= acuteModerateFloor - CLINICAL_BUFFER) return "Borderline";
    return "None";
  }
}

/**
 * Normalize Intake Severity
 */
export function evaluateIntake(pct: number, days: number, context: ClinicalContext): Severity {
  if (pct <= 0) return "None";
  
  if (context === "Acute") {
    // Severe deficit: intake drops below 50% (deficit > 50pts from 100%).
    // Moderate band = 0.8 × severe deficit: deficit 40-50pts → intake 50-60%.
    // Borderline: 5pt buffer below moderate floor → intake 60-65%.
    // >= 65%: None.
    //
    // Day thresholds preserved from original (severe: >= 5d, moderate: >= 5d).
    if (pct < 50 && days >= 5) return "Severe";
    if (pct < 60 && days >= 5) return "Moderate";
    if (pct < 65 && days >= 5) return "Borderline";
  } else {
    // Chronic
    // Severe deficit: intake <= 50% (deficit >= 50pts).
    // Moderate band = 0.8 × severe deficit: deficit 40-50pts → intake 50-60%.
    // Borderline: 5pt buffer below moderate floor → intake 60-65%.
    // >= 65%: None.
    if (days < 30) return "Not Applicable";
    if (pct <= 50) return "Severe";
    if (pct <= 60) return "Moderate";
    if (pct <= 65) return "Borderline";
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
