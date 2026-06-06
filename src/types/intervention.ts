// src/types/intervention.ts

export interface Intervention {
  // Goals
  goalStatement: string;
  goalTimeframe: string;
  goalMeasurable: string;

  // ND — Nutrition Delivery
  nd_mealsSnacks: string;
  nd_supplementalFeeding: string;
  nd_feedingAssistance: string;
  nd_feedingEnvironment: string;
  nd_nutritionRelatedMedMgmt: string;

  // E — Education
  ed_purpose: string;
  ed_content: string;
  ed_application: string;
  ed_other: string;

  // C — Counseling
  c_theory: string;
  c_strategy: string[];
  c_other: string;

  // CC — Coordination of Care
  cc_teamMembers: string;
  cc_referrals: string;
  cc_dischargeRecommendations: string;
  cc_followUpPlan: string;

  // General
  interventionNotes: string;
}