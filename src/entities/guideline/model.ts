export interface PracticeGuideline {
  id: string;
  conditionName: string;
  lastUpdatedYear: number;
  evidenceGrade?: "Grade I" | "Grade II" | "Grade III" | "Consensus";
  source: string;
  isCustomExtension?: boolean;
  assessment: {
    history: string[];
    anthropometrics: string[];
    biochemical: string[];
    nfpe: string[];
  };
  diagnosis: string[];
  intervention: {
    prescription: string;
    goals: string[];
    faqs?: string[];
  };
  monitoringEvaluation: string[];
}

export interface ClinicalField {
  id: string;
  fieldName: string;
  icon: string;
  conditions: PracticeGuideline[];
}

export const CLINICAL_LIBRARY_DATA: ClinicalField[] = [
  {
    id: "MNT-REN",
    fieldName: "Renal / Nephrology",
    icon: "🫘",
    conditions: [
      {
        id: "ckd-non-dialysis",
        conditionName: "Chronic Kidney Disease (Non-Dialysis)",
        lastUpdatedYear: 2020,
        evidenceGrade: "Grade I",
        source: "KDOQI / NCM Core",
        assessment: {
          history: ["Evaluation of comorbid diabetes, hypertension", "Glomerular Filtration Rate (GFR) staging trends"],
          anthropometrics: ["Dry weight baseline stabilization", "Edema tracking adjustments"],
          biochemical: ["Serum Potassium", "Serum Phosphorus", "eGFR", "BUN / Creatinine ratio"],
          nfpe: ["Muscle wasting in temporal and clavicular regions due to chronic uremia"]
        },
        diagnosis: [
          "Inadequate bioactive substance intake (NC-1.1)",
          "Excessive fluid intake (NI-5.1)",
          "Altered nutrition-related laboratory values (NC-2.2)"
        ],
        intervention: {
          prescription: "Protein: 0.55–0.60 g/kg/day for stage 3-5. Phosphorus: 800–1000 mg/day if serum levels elevated. Sodium: <2,300 mg/day.",
          goals: ["Delay progression to ESRD", "Maintain normalized blood pressure", "Prevent renal osteodystrophy"]
        },
        monitoringEvaluation: ["Serum electrolytes every 1-3 months", "Stability of somatic protein stores via dry weight checking"]
      },
      {
        id: "nephrotic-syndrome",
        conditionName: "Nephrotic Syndrome",
        lastUpdatedYear: 2025,
        evidenceGrade: "Consensus",
        source: "KDIGO Specialist Extension",
        isCustomExtension: true, // Highlights our custom expanded library additions!
        assessment: {
          history: ["Proteinuria onset tracking", "Lipid panel overview"],
          anthropometrics: ["Severe fluid shift tracking", "Abdominal girth variations"],
          biochemical: ["Albumin (<3.0 g/dL common)", "Total Cholesterol & Triglycerides", "24-hour urine protein extraction"],
          nfpe: ["Anasarca / Severe pitting edema in lower extremities", "Periorbital puffiness"]
        },
        diagnosis: ["Altered nutrient utilization (NC-2.1)", "Excessive sodium intake (NI-5.10.2)"],
        intervention: {
          prescription: "Protein: 0.8 g/kg/day (plus 1g for every 1g of urinary protein loss if massive). Energy: 35 kcal/kg/day. Sodium: 1.5–2.0 g/day to minimize fluid shifts.",
          goals: ["Manage profound edema", "Minimize hyperlipidemia cascade", "Replace urinary protein losses safely"]
        },
        monitoringEvaluation: ["Daily weights at identical times", "Serum albumin monitoring", "Fluid volume tracking sheets"]
      }
    ]
  },
  {
    id: "MNT-CRIT",
    fieldName: "Critical Care & Support",
    icon: "🏥",
    conditions: [
      {
        id: "vbf-protocol",
        conditionName: "Volume-Based Feeding Protocol (Trauma/ICU)",
        lastUpdatedYear: 2025,
        evidenceGrade: "Grade II",
        source: "ASPEN / Custom Extension",
        isCustomExtension: true,
        assessment: {
          history: ["Mechanical ventilation status", "Vasopressor stability profiles"],
          anthropometrics: ["Fluid resuscitation weight distortion corrections"],
          biochemical: ["Lactate clearance metrics", "Arterial blood gases (ABG)", "Refeeding panel (Phos, Mg, K)"],
          nfpe: ["Fluid retention lines", "Grip test baseline evaluations"]
        },
        diagnosis: ["Increased nutrient needs (NI-5.1)", "Inadequate enteral nutrition infusion (NI-2.3)"],
        intervention: {
          prescription: "Calculate total 24-hour goal volume instead of standard hourly rates. Permit target adjustments by nursing staff to compensate for surgical holds or gastric residual downtimes.",
          goals: ["Achieve >85% of target caloric/protein delivery inside first 72 hours", "Prevent long-term hypofeed dependency"]
        },
        monitoringEvaluation: ["Daily cumulative volume logs", "Gastric residual evaluation only if emesis presents", "Serum phosphorus mapping every 12 hours initially"]
      }
    ]
  }
];