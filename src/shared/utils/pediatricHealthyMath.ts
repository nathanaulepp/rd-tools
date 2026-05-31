/**
 * Pediatric Healthy DRI/EER Calculations
 * 
 * This utility provides the mathematical logic for the 'Healthy' pediatric path.
 * Equations derived from DRI standards.
 */

/** 
 * Map pediatric PAL value (1.0 to 2.5) to discrete PA coefficients for ages >= 3 years.
 * For infants < 36 months, PA is typically bypassed or set to 1.0.
 */
export function mapPediatricPA(pal: number): number {
  if (pal < 1.40) return 1.00; // Sedentary
  if (pal < 1.60) return 1.13; // Low Active
  if (pal < 1.90) return 1.26; // Active
  return 1.42;               // Very Active (1.90 to 2.50)
}

/**
 * Calculate Energy Needs (EER/TEE) for healthy pediatric patients.
 */
export function calculatePediatricHealthyEER(opts: {
  ageDays: number;
  weightKg: number;
  heightCm: number;
  sex: "M" | "F";
  pal: number;
  isOverweight: boolean;
}): number {
  const { ageDays, weightKg, heightCm, sex, pal, isOverweight } = opts;
  const ageYears = ageDays / 365.25;
  const heightM = heightCm / 100;

  // 0 to 3.00 months
  if (ageDays <= 91.3125) { // 3 * 30.4375 approx
    return (89 * weightKg) + 75;
  }
  // 3.01 to 6.00 months
  if (ageDays <= 182.625) {
    return (89 * weightKg) - 44;
  }
  // 6.01 to 12.00 months
  if (ageDays <= 365.25) {
    return (89 * weightKg) - 78;
  }
  // 12.01 to 35.999 months
  if (ageDays < 1095.75) { // 3 years
    return (89 * weightKg) + 20;
  }

  // Ages 3.00 to 17.99 years
  const pa = mapPediatricPA(pal);
  const isMale = sex === "M";

  if (isOverweight) {
    if (isMale) {
      // Overweight Boys (3-18y): TEE = 114 - (50.9 x age[yrs]) + PA x (19.5 x weight[kg] + 1161.4 x height[m])
      return 114 - (50.9 * ageYears) + pa * (19.5 * weightKg + 1161.4 * heightM);
    } else {
      // Overweight Girls (3-18y): TEE = 389 - (41.2 x age[yrs]) + PA x (15 x weight[kg] + 701.6 x height[m])
      return 389 - (41.2 * ageYears) + pa * (15 * weightKg + 701.6 * heightM);
    }
  } else {
    const growthEnergy = ageYears < 9 ? 20 : 25;
    if (isMale) {
      // Normal Weight Boys: EER = 88.5 - (61.9 x age[yrs]) + PA x (26.7 x weight[kg] + 903 x height[m]) + Growth
      return 88.5 - (61.9 * ageYears) + pa * (26.7 * weightKg + 903 * heightM) + growthEnergy;
    } else {
      // Normal Weight Girls: EER = 135.3 - (30.8 x age[yrs]) + PA x (10 x weight[kg] + 934 x height[m]) + Growth
      return 135.3 - (30.8 * ageYears) + pa * (10 * weightKg + 934 * heightM) + growthEnergy;
    }
  }
}

/**
 * Calculate Protein Requirements (RDA) for healthy pediatric patients.
 */
export function calculatePediatricHealthyProtein(ageDays: number, weightKg: number): number {
  const ageYears = ageDays / 365.25;
  
  let gPerKg = 0.85; // Default for 14-18y

  if (ageDays <= 182.625) { // 0-6 months
    gPerKg = 1.52;
  } else if (ageDays <= 365.25) { // 6-12 months
    gPerKg = 1.20;
  } else if (ageDays < 1461) { // 12 months to 4 years (approx 4 * 365.25)
    gPerKg = 1.05;
  } else if (ageYears < 14) { // 4-14 years
    gPerKg = 0.95;
  }
  
  return weightKg * gPerKg;
}

/**
 * Calculate Fluid Requirements (Holliday-Segar) for pediatric patients.
 */
export function calculateHollidaySegar(weightKg: number): number {
  if (weightKg <= 10) {
    return weightKg * 100;
  }
  if (weightKg <= 20) {
    return 1000 + (weightKg - 10) * 50;
  }
  return 1500 + (weightKg - 20) * 20;
}
