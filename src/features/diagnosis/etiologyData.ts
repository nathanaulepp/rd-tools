// AUTO-GENERATED from RD2B_Tools_-_PES_Builder.csv
// Do not edit manually — regenerate from the source CSV if needed.

export interface EtiologyEntry {
  category: string;
  etiology: string;
}

export interface DiagnosisEntry {
  group: string;
  etiologies: EtiologyEntry[];
}

// ── Persistence & Custom Etiologies ───────────────────────────────────────────
const CUSTOM_ETIOLOGIES_KEY = "rd-tools-custom-etiologies";

export function getCustomEtiologies(): Record<string, EtiologyEntry[]> {
  if (typeof localStorage === "undefined") return {};
  const stored = localStorage.getItem(CUSTOM_ETIOLOGIES_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse custom etiologies", e);
    return {};
  }
}

export function addCustomEtiology(problem: string, etiology: string, category: string) {
  const allCustom = getCustomEtiologies();
  if (!allCustom[problem]) {
    allCustom[problem] = [];
  }
  // Avoid duplicates
  if (!allCustom[problem].some((e) => e.etiology === etiology)) {
    allCustom[problem].push({ etiology, category });
    localStorage.setItem(CUSTOM_ETIOLOGIES_KEY, JSON.stringify(allCustom));
  }
}

export function getAllEtiologiesForProblem(problem: string): EtiologyEntry[] {
  const premade = ETIOLOGY_MAP[problem]?.etiologies || [];
  const custom = getCustomEtiologies()[problem] || [];
  return [...premade, ...custom];
}

export const ETIOLOGY_DOMAINS = [
  "Physiologic-Metabolic",
  "Beliefs & Attitudes",
  "Knowledge",
  "Behavior",
  "Treatment",
  "Psychological",
  "Cultural",
  "Access",
  "Social-Personal",
  "Physical function",
];

/**
 * Scans diagnosis data and adds any "new" etiologies to the custom store.
 * Assumes etiologies are formatted as "Some text (Category Name)".
 * Only stores if the category matches one of the official ETIOLOGY_DOMAINS.
 */
export function processNoteEtiologies(diagnosisData: any) {
  if (!diagnosisData) return;
  const processStr = (problem: string, etioStr: string) => {
    if (!problem || !etioStr) return;
    const premade = ETIOLOGY_MAP[problem]?.etiologies || [];

    // Regex to match "Text (Category)" where (Category) is at the very end
    const match = etioStr.trim().match(/^(.*)\s*\(([^)]+)\)$/);
    if (match) {
      const etiology = match[1].trim();
      const category = match[2].trim();

      // Only add if category is recognized AND it's not already premade
      if (ETIOLOGY_DOMAINS.includes(category) && !premade.some((p) => p.etiology === etiology)) {
        addCustomEtiology(problem, etiology, category);
      }
    }
  };

  // Primary
  processStr(diagnosisData.problem, diagnosisData.etiology);

  // Additional
  if (Array.isArray(diagnosisData.additionalDiagnoses)) {
    for (const dx of diagnosisData.additionalDiagnoses) {
      processStr(dx.problem, dx.etiology);
    }
  }
}

/**
 * Validates that every PES statement has an etiology with a recognized domain
 * at the very end of the string.
 * Returns an array of error messages (empty if valid).
 */
export function validatePES(diagnosisData: any): string[] {
  const errors: string[] = [];
  if (!diagnosisData) return errors;

  const check = (problem: string, etiology: string, signs: string, label: string) => {
    if (!problem) return; // Skip if no diagnosis entered
    const trimmedEtiology = etiology.trim();
    
    if (!trimmedEtiology) {
      errors.push(`${label}: Missing etiology statement`);
      return;
    }

    // This regex captures:
    // Group 1: Everything before the last parentheses
    // Group 2: The content inside the LAST parentheses at the end of the string
    const match = trimmedEtiology.match(/^(.*)\s*\(([^)]+)\)$/);
    
    if (!match) {
      errors.push(`${label}: Etiology statement is missing a category domain in parentheses at the end.`);
      return;
    }

    const category = match[2].trim();
    if (!ETIOLOGY_DOMAINS.includes(category)) {
      errors.push(`${label}: "${category}" is not a recognized etiology domain.`);
    }

    if (!signs.trim()) {
      errors.push(`${label}: Missing signs & symptoms (S)`);
    }
  };

  check(diagnosisData.problem, diagnosisData.etiology || "", diagnosisData.signsSymptoms || "", "Primary Diagnosis");

  if (Array.isArray(diagnosisData.additionalDiagnoses)) {
    diagnosisData.additionalDiagnoses.forEach((dx: any, i: number) => {
      check(dx.problem, dx.etiology || "", dx.signsSymptoms || "", `Additional Diagnosis ${i + 1}`);
    });
  }

  return errors;
}

export const ETIOLOGY_MAP: Record<string, DiagnosisEntry> = {
  "Altered GI function (NC-1.4)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Change in GI tract motility" },
      { category: "Physiologic-Metabolic", etiology: "Change in GI related organ function" },
      { category: "Treatment", etiology: "Changes in GI tract motility" },
    ],
  },
  "Altered Gl function (NC-1.4)": {
    group: "Other",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
    ],
  },
  "Altered nutrition related laboratory values (NC-2.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Kidney, liver, cardiac, endocrine, neurologic, and/or pulmonary dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Inborn errors of metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Other organ dysfunction that leads to biochemical changes" },
      { category: "Physiologic-Metabolic", etiology: "Prematurity" },
      { category: "Behavior", etiology: "Suboptimal insulin coverage for meals/snacks" },
    ],
  },
  "Attitude finding that hinders food and/or nutrition behavior change (NB-1.9)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Emotional response to adopting the food and/or nutrition behavior..." },
      { category: "Beliefs & Attitudes", etiology: "Beliefs about the outcome of adopting the food and/or nutrition behavior..." },
    ],
  },
  "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Disbelief in science-based food and nutrition information" },
      { category: "Beliefs & Attitudes", etiology: "Limited confidence in ability to change" },
      { category: "Beliefs & Attitudes", etiology: "Limited motivation and/or readiness to apply or support systems change" },
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Beliefs & Attitudes", etiology: "Perceived risk of a disease" },
      { category: "Beliefs & Attitudes", etiology: "Perceived benefits of adopting a food and/or nutrition behavior" },
      { category: "Beliefs & Attitudes", etiology: "Perceived barriers to adopting a food and/or nutrition behavior (eg, personal, social, cultural, environmental, economic)" },
      { category: "Beliefs & Attitudes", etiology: "Perceived cues to action to adopt a food and/or nutrition behavior..." },
      { category: "Beliefs & Attitudes", etiology: "Perceived control about adopting the food and/or nutrition behavior..." },
      { category: "Beliefs & Attitudes", etiology: "Perceived norms about the approval or disapproval of the client's food and/or nutrition behavior..." },
      { category: "Beliefs & Attitudes", etiology: "Belief that supportive individuals... do or do not adopt the food and/or nutrition behavior..." },
      { category: "Beliefs & Attitudes", etiology: "Craving for nonfood item" },
      { category: "Knowledge", etiology: "Limited prior exposure or exposure to misinformation, disinformation, and/or contradictory nutrition related information" },
      { category: "Knowledge", etiology: "Limited literacy" },
      { category: "Knowledge", etiology: "Limited numeracy" },
    ],
  },
  "Breastfeeding difficulty (NC-1.3)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Irritability" },
      { category: "Beliefs & Attitudes", etiology: "Perception of inadequate milk supply" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Breastfeed" },
      { category: "Physical function", etiology: "Irritability" },
      { category: "Physiologic-Metabolic", etiology: "Breast tissue with lactating capability or nipple abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Difficulty latching on" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate milk supply" },
      { category: "Physiologic-Metabolic", etiology: "Lethargy, sleepiness" },
      { category: "Physiologic-Metabolic", etiology: "Malnutrition/malabsorption" },
      { category: "Physiologic-Metabolic", etiology: "Mastitis and/or painful breast tissue with lactating capability, nipples" },
      { category: "Physiologic-Metabolic", etiology: "Oral pain" },
      { category: "Physiologic-Metabolic", etiology: "Poor sucking ability" },
      { category: "Physiologic-Metabolic", etiology: "Swallowing difficulty, and altered suck and breathing patterns in infants" },
      { category: "Social-Personal", etiology: "Limited role models" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Behavior", etiology: "Feeding via bottle or other route that may affect breastfeeding" },
    ],
  },
  "Decreased nutrient needs (NI-5.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Altered cholesterol metabolism/regulation" },
      { category: "Physiologic-Metabolic", etiology: "Food intolerances" },
      { category: "Physiologic-Metabolic", etiology: "Heart failure" },
      { category: "Physiologic-Metabolic", etiology: "Liver dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Renal dysfunction" },
      { category: "Treatment", etiology: "Food intolerances" },
      { category: "Treatment", etiology: "Renal dysfunction" },
    ],
  },
  "Difficulty chewing (NC-1.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Craniofacial malformations" },
      { category: "Physiologic-Metabolic", etiology: "Kidney, liver, cardiac, endocrine, neurologic, and/or pulmonary dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Mechanical issues such as inflammation, surgery, stricture, or oral, pharyngeal and esophageal tumors, mechanical ventilation" },
      { category: "Physiologic-Metabolic", etiology: "Partial or complete edentulism" },
      { category: "Physiologic-Metabolic", etiology: "Soft tissue disease (primary or oral manifestations of a systemic disease)" },
      { category: "Physiologic-Metabolic", etiology: "Xerostomia" },
      { category: "Treatment", etiology: "Mechanical issues such as inflammation, surgery, stricture, or oral, pharyngeal and esophageal tumors, mechanical ventilation" },
      { category: "Treatment", etiology: "Xerostomia" },
    ],
  },
  "Disordered eating pattern (NB-1.5)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Obsessive desire to be healthy or have a specific body shape" },
      { category: "Beliefs & Attitudes", etiology: "Cultural, societal, biological/genetic, and/or environmental related to fear of body weight gain" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Body weight regulation/preoccupation" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes that put emphasis on food, body weight, or shape" },
      { category: "Psychological", etiology: "Personality characteristics or temperament associated with eating disorders" },
      { category: "Psychological", etiology: "Psychological causes that put emphasis on food, body weight, or shape" },
      { category: "Social-Personal", etiology: "Traumatic event(s) that causes a physical or psychological stress reaction" },
    ],
  },
  "Enteral nutrition administration inconsistent with needs (NI-2.6)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "End-of-life care if client or supportive individuals do not desire nutrition support" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: On the part of the caregiver" },
      { category: "Treatment", etiology: "Improvement in client status, allowing return to total or partial oral diet; changes in the course of disease resulting in changes in nutrient requirements" },
    ],
  },
  "Enteral nutrition composition inconsistent with needs (NI-2.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "End-of-life care if client or supportive individuals do not desire nutrition support" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: On the part of the caregiver" },
      { category: "Treatment", etiology: "Improvement in client status, allowing return to total or partial oral diet; changes in the course of disease resulting in changes in nutrient requirements" },
    ],
  },
  "Excessive alcohol intake (NI-4.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Psychological", etiology: "Alcohol or drug addiction" },
    ],
  },
  "Excessive bioactive substance intake (NI-4.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Access", etiology: "Limited access to: Safe and/or clear and accurately labeled food supply" },
      { category: "Behavior", etiology: "Frequent intake of foods containing bioactive substances" },
    ],
  },
  "Excessive carbohydrate intake (NI-5.8.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Reduce carbohydrate intake" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount and types of dietary carbohydrate" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Physiological causes requiring use of modified carbohydrate intake" },
      { category: "Physiologic-Metabolic", etiology: "Physiologic causes requiring modified amount or timing of carbohydrate intake" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Food and nutrition adherence limitations" },
    ],
  },
  "Excessive energy intake (NI-1.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Reducing energy intake" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Correct amount of enteral/parenteral formula" },
      { category: "Knowledge", etiology: "Limited adjustment for lifestyle changes or restricted mobility and decreased metabolism" },
      { category: "Treatment", etiology: "Calories/kcal/kJ unaccounted for from intravenous (IV) infusion and/or medications" },
      { category: "Treatment", etiology: "Medications that increase appetite" },
      { category: "Treatment", etiology: "Overfeeding of parenteral/enteral nutrition (PN/EN)" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity and/or variety of culturally appropriate healthful food" },
    ],
  },
  "Excessive enteral nutrition infusion (NI-2.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: On the part of the caregiver" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
    ],
  },
  "Excessive fat intake (NI-5.5.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food preference" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or type of dietary fat" },
      { category: "Physiologic-Metabolic", etiology: "Changes in taste, appetite" },
      { category: "Physiologic-Metabolic", etiology: "Decreased total fat need or recommendation" },
      { category: "Treatment", etiology: "Changes in taste, appetite" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity and/or variety of culturally appropriate healthful food" },
    ],
  },
  "Excessive fiber intake (NI-5.8.6)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Desirable quantities of fiber" },
      { category: "Behavior", etiology: "Food preparation or eating patterns that involve only high-fiber foods to the exclusion of other nutrient-dense foods" },
    ],
  },
  "Excessive fluid intake (NI-3.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Kidney, liver, cardiac, endocrine, neurologic, and/or pulmonary dysfunction" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
    ],
  },
  "Excessive growth rate (NC-3.6)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Treatment", etiology: "Chronic use of medications known to cause body weight gain, such as use of certain antidepressants, antipsychotics, corticosteroids, certain HIV medications" },
    ],
  },
  "Excessive intake of biotin (NI-5.9.2.13)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of boron (NI-5.10.2.17)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of calcium (NI-5.10.2.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of chloride (NI-5.10.2.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of chromium (NI-5.10.2.15)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of cobalt (NI-5.10.2.18)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of copper (NI-5.10.2.11)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of fluoride (NI-5.10.2.10)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of folate (NI-5.9.2.9)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of iodine (NI-5.10.2.12)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of iron (NI-5.10.2.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of magnesium (NI-5.10.2.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of manganese (NI-5.10.2.14)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of molybdenum (NI-5.10.2.16)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of niacin (NI-5.9.2.8)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of pantothenic acid (NI-5.9.2.12)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of phosphorus (NI-5.10.2.6)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of potassium (NI-5.10.2.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of riboflavin (NI-5.9.2.7)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of selenium (NI-5.10.2.13)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of sodium (NI-5.10.2.7)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of sulfate (NI-5.10.2.9)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive intake of thiamin (NI-5.9.2.6)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin A (NI-5.9.2.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin B12 (NI-5.9.2.11)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin B6 (NI-5.9.2.10)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin C (NI-5.9.2.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin D (NI-5.9.2.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin E (NI-5.9.2.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of vitamin K (NI-5.9.2.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Access to foods and supplements in excess of needs" },
    ],
  },
  "Excessive intake of zinc (NI-5.10.2.8)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of an appropriate variety of foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosis requiring mineral restriction" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Management of diagnosed genetic disorder altering mineral homeostasis" },
      { category: "Treatment", etiology: "Accidental vitamin and/or mineral overdose from oral, enteral or parenteral sources" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Behavior", etiology: "Over consumption of a limited variety of foods" },
    ],
  },
  "Excessive oral intake (NI-2.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Reducing intake" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Loss of appetite awareness" },
      { category: "Psychological", etiology: "Mental illness, confusion, or altered awareness" },
      { category: "Treatment", etiology: "Medications that increase appetite" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity and/or variety of culturally appropriate healthful food" },
      { category: "Behavior", etiology: "Inability to limit or refuse offered foods" },
      { category: "Behavior", etiology: "Poor food planning, purchasing and preparation practices" },
    ],
  },
  "Excessive parenteral nutrition infusion (NI-2.8)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Correct amount of enteral/parenteral formula" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: On the part of the caregiver" },
      { category: "Physiologic-Metabolic", etiology: "Decreased nutrient needs related to low activity levels due to chronic disease or organ failure" },
    ],
  },
  "Excessive physical activity (NB-2.2)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Psychological", etiology: "Addictive personality" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Addictive behavior" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Excessive protein intake (NI-5.6.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Liver dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Renal dysfunction" },
      { category: "Treatment", etiology: "Renal dysfunction" },
      { category: "Access", etiology: "Limited access to: Specialized protein products" },
    ],
  },
  "Food Medication Interaction (NC-2.3)": {
    group: "Other",
    etiologies: [
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
    ],
  },
  "Food and nutrition related knowledge deficit (NB-1.1)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited self efficacy for making change or demoralization from previous challenges associated with change" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Learn information/apply skill" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Infant/child hunger cues" },
      { category: "Knowledge", etiology: "Limited prior exposure or exposure to misinformation, disinformation, and/or contradictory nutrition related information" },
      { category: "Knowledge", etiology: "Limited literacy" },
      { category: "Knowledge", etiology: "Limited numeracy" },
      { category: "Knowledge", etiology: "Limited access to sources of reliable food and nutrition information" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Recent medical diagnosis or change in health or disease status" },
      { category: "Social-Personal", etiology: "Change in life- course stage or responsibility for self or others" },
    ],
  },
  "Food and nutrition related skill (NB-1.8)": {
    group: "Other",
    etiologies: [
      { category: "Access", etiology: "Limited access to: Resources" },
    ],
  },
  "Food insecurity (NB-3.2)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Diminished ability to shop" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Physical disability" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Caregiver intentionally or unintentionally not providing access to food or nutrition related supplies" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Exposure to contaminated water or food (eg, community outbreak of illness documented by surveillance and/or response agency)" },
      { category: "Access", etiology: "Reluctance to participate in federal food programs such as women and children food program, school breakfast and/or lunch program, supplemental food resources" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity and/or variety of culturally appropriate healthful food" },
      { category: "Access", etiology: "Limited access to: Resources" },
      { category: "Access", etiology: "Limited participation in community supplemental food programs such as food pantries, emergency kitchens, or shelters, with a sufficient variety of culturally appropriate healthful foods or nutrition related supplies" },
      { category: "Access", etiology: "Schools lacking nutrition/wellness policies or application of policies ensuring convenient, appetizing, competitively priced culturally appropriate healthful foods and/or water at meals, snacks, and school sponsored activities" },
      { category: "Access", etiology: "Limited health care coverage" },
      { category: "Access", etiology: "Disruption of food production, processing, and/or distribution network" },
      { category: "Access", etiology: "Limited food outlet options or one that has abundance of food outlets lacking nutrient rich foods" },
      { category: "Behavior", etiology: "Poor food planning, purchasing and preparation practices" },
    ],
  },
  "Food medication interaction (NC-2.3)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food drug interactions" },
    ],
  },
  "Growth rate below expected (NC-3.5)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Physiologic-Metabolic", etiology: "Age-related demands" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Change in GI related organ function" },
      { category: "Physiologic-Metabolic", etiology: "Compromised endocrine function" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Kidney, liver, cardiac, endocrine, neurologic, and/or pulmonary dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Limited food acceptance" },
      { category: "Physiologic-Metabolic", etiology: "Malnutrition/malabsorption" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Maintenance of body temperature" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Physiologic-Metabolic", etiology: "Poor sucking ability" },
      { category: "Physiologic-Metabolic", etiology: "Prematurity" },
      { category: "Physiologic-Metabolic", etiology: "Small for gestational age, intrauterine growth retardation/restriction and/or Lack of or limited progress/appropriate body weight gain per day" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Limited food acceptance due to behavioral issues" },
    ],
  },
  "Imbalance of nutrients (NI-5.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Recommended dose of vitamin and mineral supplements" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Consumption of highdose-nutrient supplements" },
      { category: "Treatment", etiology: "Insufficient electrolyte replacement when initiating feeding (PN/EN, including oral)" },
      { category: "Behavior", etiology: "Consumption of high-dose nutrient supplements" },
    ],
  },
  "Impaired nutrient utilization (NC-2.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Compromised endocrine function" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic disorders" },
      { category: "Psychological", etiology: "Alcohol or drug addiction" },
      { category: "Treatment", etiology: "Medications that affect nutrient metabolism" },
    ],
  },
  "Inability to manage self care (NB-2.3)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Beliefs & Attitudes", etiology: "Perception that lack of or limited resources (eg, time, financial, or interpersonal) prevent: Self monitoring" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Manage self care" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Limited prior exposure or exposure to misinformation, disinformation, and/or contradictory nutrition related information" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Limited developmental readiness to perform self management tasks" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Access", etiology: "Limited access to: Self management tools or decision guides or other nutrition related supplies" },
    ],
  },
  "Inadequate bioactive substance intake (NI-4.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Access", etiology: "Limited access to: Food that contains a bioactive substance" },
    ],
  },
  "Inadequate carbohydrate intake (NI-5.8.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate energy intake (NI-1.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate enteral nutrition infusion (NI-2.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Correct enteral formula needed" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate/correct access for delivering EN/PN" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Treatment", etiology: "Infusion volume not reached or schedule for infusion interrupted" },
      { category: "Treatment", etiology: "Lack of or limited, compromised, or incorrect access for delivering EN/PN" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
    ],
  },
  "Inadequate fat intake (NI-5.5.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Make food choices consistent with reference intake standards..." },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or type of dietary fat" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate fiber intake (NI-5.8.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Unwillingness to purchase or consume fiber-containing foods" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Desirable quantities of fiber" },
      { category: "Physiologic-Metabolic", etiology: "Difficulty chewing or swallowing high-fiber foods" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Difficulty chewing or swallowing high-fiber foods" },
      { category: "Treatment", etiology: "Prolonged adherence to a low-fiber or low-residue diet" },
      { category: "Access", etiology: "Limited access to: Fluid" },
      { category: "Access", etiology: "Limited access to: Fiber-containing foods" },
      { category: "Behavior", etiology: "Poor food planning, purchasing and preparation practices" },
    ],
  },
  "Inadequate fluid intake (NI-3.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Conditions leading to excess fluid loss" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Maintenance of body temperature" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Medications that increase fluid needs or decrease thirst" },
      { category: "Access", etiology: "Limited access to: Fluid" },
    ],
  },
  "Inadequate intake of biotin (NI-5.9.1.13)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of boron (NI-5.10.1.17)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of calcium (NI-5.10.1.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Misdiagnosis of lactose intolerance/lactase deficiency" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of chloride (NI-5.10.1.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of chromium (NI-5.10.1.15)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of cobalt (NI-5.10.1.18)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of copper (NI-5.10.1.11)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of fluoride (NI-5.10.1.10)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of folate (NI-5.9.1.9)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of iodine (NI-5.10.1.12)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of iron (NI-5.10.1.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of magnesium (NI-5.10.1.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Misdiagnosis of lactose intolerance/lactase deficiency" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of manganese (NI-5.10.1.14)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of molybdenum (NI-5.10.1.16)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of niacin (NI-5.9.1.8)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of pantothenic acid (NI-5.9.1.12)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of phosphorus (NI-5.10.1.6)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Misdiagnosis of lactose intolerance/lactase deficiency" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of potassium (NI-5.10.1.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Misdiagnosis of lactose intolerance/lactase deficiency" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of riboflavin (NI-5.9.1.7)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of selenium (NI-5.10.1.13)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of sodium (NI-5.10.1.7)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of sulfate (NI-5.10.1.9)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of thiamin (NI-5.9.1.6)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin A (NI-5.9.1.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin B12 (NI-5.9.1.11)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin B6 (NI-5.9.1.10)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin C (NI-5.9.1.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin D (NI-5.9.1.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin E (NI-5.9.1.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of vitamin K (NI-5.9.1.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of vitamins" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate intake of zinc (NI-5.10.1.8)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food and supplemental sources of minerals" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
      { category: "Access", etiology: "Environmental causes (eg, inadequately tested nutrient bioavailability of fortified foods, beverages, and supplements; marketing of fortified foods, beverages, supplements as a substitute for natural food source of nutrient(s))" },
      { category: "Access", etiology: "Limited access to: Fortified foods and beverages" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate oral intake (NI-2.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Limited food acceptance due to food aversion" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Sufficient oral food/beverage intake" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Limited food acceptance" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Limited food acceptance due to behavioral issues" },
    ],
  },
  "Inadequate parenteral nutrition infusion (NI-2.7)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Correct parenteral nutrition components or administration" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate/correct access for delivering EN/PN" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Treatment", etiology: "Infusion volume not reached or schedule for infusion interrupted" },
      { category: "Treatment", etiology: "Lack of or limited, compromised, or incorrect access for delivering EN/PN" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
    ],
  },
  "Inadequate protein energy intake (NI-5.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inadequate protein intake (NI-5.6.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or types of dietary protein or amino acids" },
      { category: "Physiologic-Metabolic", etiology: "Age-related demands" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Inconsistent carbohydrate intake (NI-5.8.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Regulate timing of carbohydrate consumption" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate timing of carbohydrate intake" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Physiological causes requiring careful timing and consistency in the amount of carbohydrate" },
      { category: "Physiologic-Metabolic", etiology: "Physiologic causes requiring modified amount or timing of carbohydrate intake" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Food and nutrition adherence limitations" },
    ],
  },
  "Increased energy expenditure (NI-1.1)": {
    group: "Other",
    etiologies: [
      { category: "Physical function", etiology: "Voluntary or involuntary physical activity/movement" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Maintenance of body temperature" },
    ],
  },
  "Increased nutrient needs (NI-5.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Change in GI related organ function" },
      { category: "Physiologic-Metabolic", etiology: "Malnutrition/malabsorption" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Accelerated growth or anabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Treatment", etiology: "Medications that increase nutrient needs" },
    ],
  },
  "Intake of types of amino acids inconsistent with needs (NI-5.7.2)": {
    group: "Other",
    etiologies: [
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Intake of types of carbohydrate inconsistent with needs (NI-5.8.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Regulate types of carbohydrate consumed" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount and types of dietary carbohydrate" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Physiological causes altering carbohydrate digestion or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiologic causes requiring modified amount or timing of carbohydrate intake" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Food and nutrition adherence limitations" },
    ],
  },
  "Intake of types of fats inconsistent with needs (NI-5.5.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food preference" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or type of dietary fat" },
      { category: "Physiologic-Metabolic", etiology: "Changes in taste, appetite" },
      { category: "Physiologic-Metabolic", etiology: "Altered fatty acid need or recommendation" },
      { category: "Treatment", etiology: "Changes in taste, appetite" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity and/or variety of culturally appropriate healthful food" },
    ],
  },
  "Intake of types of proteins inconsistent with needs (NI-5.6.3)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food faddism" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Modify protein or amino acid intake" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Regulate types of protein or amino acids consumed" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or types of dietary protein or amino acids" },
      { category: "Physiologic-Metabolic", etiology: "Liver dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Inborn errors of metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Renal dysfunction" },
      { category: "Treatment", etiology: "Misused specialized protein products" },
      { category: "Treatment", etiology: "Renal dysfunction" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Intake of unsafe food (NB-3.1)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Potentially unsafe food" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Proper infant feeding, food/feeding preparation and storage" },
      { category: "Psychological", etiology: "Mental illness, confusion, or altered awareness" },
      { category: "Access", etiology: "Exposure to contaminated water or food (eg, community outbreak of illness documented by surveillance and/or response agency)" },
      { category: "Access", etiology: "Limited access to: Safe and/or clear and accurately labeled food supply" },
      { category: "Access", etiology: "Limited access to: Food storage equipment/facilities" },
    ],
  },
  "Intake types of amino acids inconsistent with needs (NI-5.7.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Modify protein or amino acid intake" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Regulate types of protein or amino acids consumed" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or types of dietary protein or amino acids" },
      { category: "Physiologic-Metabolic", etiology: "Liver dysfunction" },
      { category: "Physiologic-Metabolic", etiology: "Inborn errors of metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic disorders" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Renal dysfunction" },
      { category: "Treatment", etiology: "Misused specialized amino acid products" },
      { category: "Treatment", etiology: "Renal dysfunction" },
    ],
  },
  "Limited ability to prepare food for eating (NB-2.4)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "New skill requirement due to recent medical diagnosis or change in health or disease status" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Injury, condition, physical disability or limitation that reduces physical activity or activities of daily living" },
      { category: "Physiologic-Metabolic", etiology: "Physical disability" },
      { category: "Treatment", etiology: "High level of fatigue or other side effect of therapy" },
      { category: "Treatment", etiology: "Impacting physical activity level" },
    ],
  },
  "Limited access to nutrition related supplies (NB-3.3)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Diminished ability to shop" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Caregiver intentionally or unintentionally not providing access to food or nutrition related supplies" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Limited access to: Self management tools or decision guides or other nutrition related supplies" },
      { category: "Access", etiology: "Limited participation in community supplemental food programs such as food pantries, emergency kitchens, or shelters, with a sufficient variety of culturally appropriate healthful foods or nutrition related supplies" },
    ],
  },
  "Limited access to potable water (NB-3.4)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Diminished ability to shop" },
      { category: "Physiologic-Metabolic", etiology: "Physical disability" },
      { category: "Access", etiology: "Caregiver intentionally or unintentionally not providing access to food or nutrition related supplies" },
      { category: "Access", etiology: "Community and geographical constraints" },
      { category: "Access", etiology: "Exposure to contaminated water or food (eg, community outbreak of illness documented by surveillance and/or response agency)" },
      { category: "Access", etiology: "Reluctance to participate in federal food programs such as women and children food program, school breakfast and/or lunch program, supplemental food resources" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity of potable water" },
      { category: "Access", etiology: "Limited participation in community supplemental food programs such as food pantries, emergency kitchens, or shelters, with a sufficient variety of culturally appropriate healthful foods or nutrition related supplies" },
      { category: "Access", etiology: "Schools lacking nutrition/wellness policies or application of policies ensuring convenient, appetizing, competitively priced culturally appropriate healthful foods and/or water at meals, snacks, and school sponsored activities" },
    ],
  },
  "Limited adherence to nutrition related recommendations (NB-1.6)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited self efficacy for making change or demoralization from previous challenges associated with change" },
      { category: "Beliefs & Attitudes", etiology: "Limited confidence in ability to change" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Beliefs & Attitudes", etiology: "Perception that lack of or limited resources (eg, time, financial, or interpersonal) prevent: Changes" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: How to make nutrition related changes" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
    ],
  },
  "Limited food acceptance (NB-1.7)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food preference" },
      { category: "Beliefs & Attitudes", etiology: "Limited food acceptance due to food aversion" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited motivation and/or readiness to apply or support systems change" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Beliefs & Attitudes", etiology: "Attitude finding that hinders food and/or nutrition behavior change" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Learn information/apply skill" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Developmental delay" },
      { category: "Physiologic-Metabolic", etiology: "Food allergies and aversions impeding food choices consistent with guidelines" },
      { category: "Physiologic-Metabolic", etiology: "Food intolerances" },
      { category: "Physiologic-Metabolic", etiology: "Kidney, liver, cardiac, endocrine, neurologic, and/or pulmonary dysfunction" },
      { category: "Behavior", etiology: "Eating behavior serves a purpose other than nourishment" },
    ],
  },
  "Limited food and nutrition related skill (NB-1.8)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Beliefs & Attitudes", etiology: "Limited emotional ability" },
      { category: "Beliefs & Attitudes", etiology: "Limited self-efficacy for applying skill" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Learn information/apply skill" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Perform skill" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Infant/child hunger cues" },
      { category: "Knowledge", etiology: "Limited prior exposure or exposure to misinformation, disinformation, and/or contradictory nutrition related information" },
      { category: "Knowledge", etiology: "Limited literacy" },
      { category: "Knowledge", etiology: "Limited numeracy" },
      { category: "Knowledge", etiology: "Limited prior application of skill" },
      { category: "Knowledge", etiology: "New skill requirement due to recent medical diagnosis or change in health or disease status" },
      { category: "Knowledge", etiology: "New skill requirement due to change in life- course stage or responsibility for self or others" },
      { category: "Physical function", etiology: "Limited physical ability" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Psychological", etiology: "Limited psychological ability" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Treatment", etiology: "Limited training availability" },
    ],
  },
  "Mild illness related pediatric malnutrition (undernutrition) (NC-4.1.5.)": {
    group: "Other",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Injury, condition, physical disability or limitation that reduces physical activity or activities of daily living" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Physiologic-Metabolic", etiology: "Inborn errors of metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic disorders" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Physiologic-Metabolic", etiology: "Prematurity" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Mild illness related pediatric malnutrition (undernutrition) (NC-4.1.5.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
    ],
  },
  "Mild non illness related pediatric malnutrition (undernutrition) (NC-4.1.4.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or types of dietary protein or amino acids" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Moderate acute disease or injury related malnutrition (undernutrition) (NC-4.1.3.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate energy intake" },
    ],
  },
  "Moderate chronic disease or condition related malnutrition (undernutrition) (NC-4.1.2.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate energy intake" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
    ],
  },
  "Moderate illness related pediatric malnutrition (NC-4.1.5.2)": {
    group: "Other",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
    ],
  },
  "Moderate illness related pediatric malnutrition (undernutrition) (NC-4.1.5.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Injury, condition, physical disability or limitation that reduces physical activity or activities of daily living" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Physiologic-Metabolic", etiology: "Inborn errors of metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic disorders" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Physiologic-Metabolic", etiology: "Prematurity" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Moderate non illness related pediatric malnutrition (undernutrition) (NC-4.1.4.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or types of dietary protein or amino acids" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Moderate starvation related malnutrition (undernutrition) (NC-4.1.1.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Soft tissue disease (primary or oral manifestations of a systemic disease)" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Non illness related pediatric malnutrition (undernutrition) (NC-4.1.4)": {
    group: "Other",
    etiologies: [
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
    ],
  },
  "Not ready for nutrition related behavior change (NB-1.3)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Limited acceptance need to change" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited self efficacy for making change or demoralization from previous challenges associated with change" },
      { category: "Beliefs & Attitudes", etiology: "Perception that lack of or limited resources (eg, time, financial, or interpersonal) prevent: Changes" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
    ],
  },
  "Obesity Class I (NC-3.3.2.2)": {
    group: "Other",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Treatment", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Obesity Class II (NC-3.3.2.3)": {
    group: "Other",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Treatment", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Obesity Class III (NC-3.3.2.4)": {
    group: "Other",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Treatment", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Obesity, adult or pediatric (NC-3.3.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Treatment", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Obesity, pediatric (NC-3.3.2.1)": {
    group: "Other",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Treatment", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Overweight, adult or pediatric (NC-3.3.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Decreased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Excessive energy intake" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Treatment", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Excessive energy intake" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Parenteral nutrition administration inconsistent with needs (NI-2.10)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "End-of-life care if client or supportive individuals do not desire nutrition support" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Correct parenteral nutrition components or administration" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate/correct access for delivering EN/PN" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: On the part of the caregiver" },
      { category: "Treatment", etiology: "Improvement in client status, allowing return to total or partial oral diet; changes in the course of disease resulting in changes in nutrient requirements" },
    ],
  },
  "Parenteral nutrition composition inconsistent with needs (NI-2.9)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "End-of-life care if client or supportive individuals do not desire nutrition support" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Correct parenteral nutrition components or administration" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: On the part of the caregiver" },
      { category: "Treatment", etiology: "Improvement in client status, allowing return to total or partial oral diet; changes in the course of disease resulting in changes in nutrient requirements" },
    ],
  },
  "Physical inactivity (NB-2.1)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Beliefs & Attitudes", etiology: "Perception that lack of or limited resources (eg, time, financial, or interpersonal) prevent: Sufficient level of activity" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Health benefits of physical activity" },
      { category: "Knowledge", etiology: "Limited prior exposure to accurate information regarding physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Injury, condition, physical disability or limitation that reduces physical activity or activities of daily living" },
      { category: "Social-Personal", etiology: "Limited role models" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Access", etiology: "Financial constraints that may prevent sufficient level of activity (eg, to address cost of equipment or shoes or club membership to gain access)" },
      { category: "Access", etiology: "Limited access to: Available and safe physical activity environment and/or equipment" },
      { category: "Behavior", etiology: "Lifestyle change that reduces physical activity or activities of daily living" },
    ],
  },
  "Poor food and/or nutrition quality of life (NB-2.5)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Altered body image" },
      { category: "Beliefs & Attitudes", etiology: "Limited self efficacy for making change or demoralization from previous challenges associated with change" },
      { category: "Beliefs & Attitudes", etiology: "Perceived negative impact of current or previous medical nutrition therapy (MNT)" },
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Food or activity behavior-related difficulty" },
    ],
  },
  "Predicted breastfeeding difficulty (NC-1.5)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Perception of inadequate milk supply" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Breastfeed" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Breast tissue with lactating capability or nipple abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Malnutrition/malabsorption" },
      { category: "Physiologic-Metabolic", etiology: "Mastitis and/or painful breast tissue with lactating capability, nipples" },
      { category: "Physiologic-Metabolic", etiology: "Poor sucking ability" },
      { category: "Physiologic-Metabolic", etiology: "Swallowing difficulty, and altered suck and breathing patterns in infants" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Social-Personal", etiology: "Change in living situation" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to hinder breastfeeding" },
      { category: "Behavior", etiology: "Feeding via bottle or other route that may affect breastfeeding" },
    ],
  },
  "Predicted excessive energy intake (NI-1.5)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Culture of overeating" },
      { category: "Physical function", etiology: "Change in physical activity anticipated" },
      { category: "Physiologic-Metabolic", etiology: "Genetic predisposition to overweight/obesity" },
      { category: "Physiologic-Metabolic", etiology: "Altered metabolism" },
      { category: "Social-Personal", etiology: "Family or social history of overeating" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Social-Personal", etiology: "Change in living situation" },
      { category: "Treatment", etiology: "Planned therapy or medication predicted to reduce energy/nutrient need or metabolic rate/metabolism" },
    ],
  },
  "Predicted excessive nutrient intake (NI-5.11.2)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Altered metabolism" },
      { category: "Treatment", etiology: "Planned therapy or medication predicted to reduce energy/nutrient need or metabolic rate/metabolism" },
    ],
  },
  "Predicted food medication interaction (NC-2.4)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Food drug interactions" },
      { category: "Treatment", etiology: "Nutrient/nutrient interaction and/or drug/nutrient interaction" },
    ],
  },
  "Predicted inadequate energy intake (NI-1.4)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Physical function", etiology: "Change in physical activity anticipated" },
      { category: "Social-Personal", etiology: "Increased psychological/life stress" },
      { category: "Social-Personal", etiology: "Change in living situation" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to increase energy expenditure or nutrient need" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to decrease ability to consume sufficient energy or nutrients" },
    ],
  },
  "Predicted inadequate nutrient intake (NI-5.11.1)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Practices that affect nutrient intake" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Social-Personal", etiology: "Change in living situation" },
      { category: "Social-Personal", etiology: "Living in a geographic location with danger for environmental emergency" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to increase energy expenditure or nutrient need" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to decrease ability to consume sufficient energy or nutrients" },
    ],
  },
  "Sarcopenia (NC-1.6)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Beliefs and/or attitudes leading to inadequate intake and/or limited physical activity" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physical function", etiology: "Limited physical ability" },
      { category: "Physical function", etiology: "Diminished ability to shop" },
      { category: "Physical function", etiology: "Limited physical strength or range of motion" },
      { category: "Physical function", etiology: "Limited physical activity" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate energy intake" },
      { category: "Physiologic-Metabolic", etiology: "Injury, condition, physical disability or limitation that reduces physical activity or activities of daily living" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Physiologic-Metabolic", etiology: "Loss of muscle mass, decreased strength, and/or decreased physical performance related to aging, hormonal balance, and/or inflammation" },
      { category: "Psychological", etiology: "Psychological factors leading to inadequate intake and/or limited physical activity" },
      { category: "Social-Personal", etiology: "Social-Personal factors leading to inadequate intake and/or limited physical activity" },
      { category: "Treatment", etiology: "Inadequate energy intake" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to increase energy expenditure or nutrient need" },
      { category: "Treatment", etiology: "Planned procedure, therapy or medication predicted to decrease ability to consume sufficient energy or nutrients" },
      { category: "Treatment", etiology: "Prolonged hospitalization" },
      { category: "Treatment", etiology: "Impacting physical activity level" },
      { category: "Access", etiology: "Factors leading to inadequate intake and/or limited physical activity" },
      { category: "Behavior", etiology: "Limited physical activity" },
    ],
  },
  "Self feeding difficulty (NB-2.6)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Physical function", etiology: "Inability to physically: Bend elbow at wrist" },
      { category: "Physical function", etiology: "Inability to physically: Grasp cups and utensils" },
      { category: "Physical function", etiology: "Inability to physically: Sit with hips square and back straight" },
      { category: "Physical function", etiology: "Inability to physically: Support neck and/or control head and neck" },
      { category: "Physical function", etiology: "Inability to physically: Coordinate hand movement to mouth" },
      { category: "Physical function", etiology: "Limited physical strength or range of motion" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Limited vision" },
      { category: "Access", etiology: "Limited access to: Adaptive foods or eating devices conducive for self feeding" },
      { category: "Behavior", etiology: "Reluctance or avoidance of self feeding" },
    ],
  },
  "Self monitoring deficit (NB-1.4)": {
    group: "Behavioral-Environmental Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Limited value for behavior change or competing values" },
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Beliefs & Attitudes", etiology: "Perception that lack of or limited resources (eg, time, financial, or interpersonal) prevent: Self monitoring" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Tracking progress" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Track personal progress" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Knowledge", etiology: "Limited prior exposure or exposure to misinformation, disinformation, and/or contradictory nutrition related information" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Behavior", etiology: "Limited focus and attention to detail, difficulty with time management and/or organization" },
    ],
  },
  "Severe acute disease or injury related malnutrition (undernutrition) (NC-4.1.3.2)": {
    group: "Other",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate energy intake" },
    ],
  },
  "Severe chronic disease or condition related malnutrition (NC-4.1.2.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate energy intake" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
    ],
  },
  "Severe illness related pediatric malnutrition (NC-4.1.5.3)": {
    group: "Other",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
    ],
  },
  "Severe illness related pediatric malnutrition (undernutrition) (NC-4.1.5.3)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Injury, condition, physical disability or limitation that reduces physical activity or activities of daily living" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Physiologic-Metabolic", etiology: "Inborn errors of metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic abnormality" },
      { category: "Physiologic-Metabolic", etiology: "Metabolic disorders" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Physiologic-Metabolic", etiology: "Prematurity" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Severe non illness related pediatric malnutrition (undernutrition) (NC-4.1.4.3)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Appropriate amount or types of dietary protein or amino acids" },
      { category: "Physiologic-Metabolic", etiology: "Intolerance of enteral nutrition (EN)/parenteral nutrition (PN)" },
      { category: "Social-Personal", etiology: "Limited social support for implementing changes" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
    ],
  },
  "Severe starvation related malnutrition (undernutrition) (NC-4.1.1.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal tract: Decreased functional length of GI tract" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in gastrointestinal (GI) anatomical structure" },
      { category: "Physiologic-Metabolic", etiology: "Alteration in GI function" },
      { category: "Physiologic-Metabolic", etiology: "Limited cognitive ability, including learning disabilities, neurological or sensory impairment, and dementia" },
      { category: "Physiologic-Metabolic", etiology: "Soft tissue disease (primary or oral manifestations of a systemic disease)" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
  "Swallowing difficulty (NC-1.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Physiologic-Metabolic", etiology: "Mechanical issues such as inflammation, surgery, stricture, or oral, pharyngeal and esophageal tumors, mechanical ventilation" },
      { category: "Physiologic-Metabolic", etiology: "Motor causes related to neurological or muscular disorders" },
      { category: "Physiologic-Metabolic", etiology: "Swallowing difficulty, and altered suck and breathing patterns in infants" },
      { category: "Treatment", etiology: "Mechanical issues such as inflammation, surgery, stricture, or oral, pharyngeal and esophageal tumors, mechanical ventilation" },
    ],
  },
  "Unbalanced diet pattern (NI-2.11)": {
    group: "Intake Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Food preference" },
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Beliefs & Attitudes", etiology: "Limited motivation and/or readiness to apply or support systems change" },
      { category: "Beliefs & Attitudes", etiology: "Perception that lack of or limited resources (eg, time, financial, or interpersonal) prevent: Selection/food choices consistent with recommendations" },
      { category: "Beliefs & Attitudes", etiology: "Limited interest/motivation/prioritization: Learning information/applying skill" },
      { category: "Beliefs & Attitudes", etiology: "Attitude finding that hinders food and/or nutrition behavior change" },
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Learn information/apply skill" },
      { category: "Knowledge", etiology: "Limited prior exposure or exposure to misinformation, disinformation, and/or contradictory nutrition related information" },
      { category: "Physiologic-Metabolic", etiology: "Food allergies and aversions impeding food choices consistent with guidelines" },
      { category: "Physiologic-Metabolic", etiology: "Food intolerances" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Changes in GI tract motility" },
      { category: "Treatment", etiology: "High level of fatigue or other side effect of therapy" },
      { category: "Access", etiology: "Limited access to: Sufficient quantity and/or variety of culturally appropriate healthful food" },
      { category: "Access", etiology: "Limited participation in community supplemental food programs such as food pantries, emergency kitchens, or shelters, with a sufficient variety of culturally appropriate healthful foods or nutrition related supplies" },
      { category: "Access", etiology: "Limited food outlet options or one that has abundance of food outlets lacking nutrient rich foods" },
      { category: "Behavior", etiology: "Eating behavior serves a purpose other than nourishment" },
    ],
  },
  "Underweight (NC-3.1)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Belief finding that hinders food and/or nutrition behavior change (NB-1.2)" },
      { category: "Knowledge", etiology: "Food and nutrition knowledge deficit concerning: Adequate energy intake" },
      { category: "Physiologic-Metabolic", etiology: "Inadequate energy intake" },
      { category: "Physiologic-Metabolic", etiology: "Increased energy needs" },
      { category: "Physiologic-Metabolic", etiology: "Small for gestational age, intrauterine growth retardation/restriction and/or Lack of or limited progress/appropriate body weight gain per day" },
      { category: "Treatment", etiology: "Inadequate energy intake" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
      { category: "Behavior", etiology: "Excessive physical activity" },
      { category: "Behavior", etiology: "Disordered eating pattern" },
      { category: "Behavior", etiology: "Inadequate energy intake" },
    ],
  },
  "Unintended weight gain (NC-3.4)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Beliefs & Attitudes", etiology: "Not ready for nutrition related behavior change" },
      { category: "Physiologic-Metabolic", etiology: "Illness causing unexpected body weight gain because of head trauma, immobility, paralysis or related condition" },
      { category: "Treatment", etiology: "Chronic use of medications known to cause body weight gain, such as use of certain antidepressants, antipsychotics, corticosteroids, certain HIV medications" },
    ],
  },
  "Unintended weight loss (NC-3.2)": {
    group: "Clinical Nutrition",
    etiologies: [
      { category: "Cultural", etiology: "Cultural beliefs that may affect ability to and receptivity to: Access to food, fluid, nutrients" },
      { category: "Physical function", etiology: "Limited self feeding ability" },
      { category: "Physiologic-Metabolic", etiology: "Decreased ability to consume sufficient energy, nutrients" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Altered absorption or metabolism" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Disease/condition" },
      { category: "Physiologic-Metabolic", etiology: "Physiological causes increasing nutrient needs due to: Prolonged catabolic illness" },
      { category: "Psychological", etiology: "Psychological causes such as depression and disordered eating" },
      { category: "Treatment", etiology: "Prolonged hospitalization" },
      { category: "Access", etiology: "Limited access to: Food or artificial nutrition" },
    ],
  },
};

// All unique diagnosis names for the combobox, grouped
export const DIAGNOSIS_GROUPS: { group: string; diagnoses: string[] }[] = (() => {
  const map: Record<string, string[]> = {};
  for (const [dx, v] of Object.entries(ETIOLOGY_MAP)) {
    if (!map[v.group]) map[v.group] = [];
    map[v.group].push(dx);
  }
  const ORDER = ['Intake Nutrition', 'Clinical Nutrition', 'Behavioral-Environmental Nutrition', 'Other'];
  return ORDER.filter(g => map[g]).map(g => ({ group: g, diagnoses: map[g].sort() }));
})();