// src/types/monitorEval.ts

export type OutcomeProgress =
  | ""
  | "improved"
  | "no-change"
  | "worsened"
  | "met"
  | "not-met";

export interface MonitorEval {
  // ME-1 — Indicators
  monitoredIndicators: string[];
  monitorFrequency: string;
  monitoredBy: string;

  // ME-2 — Evaluation Criteria
  criteria_anthropo: string;
  criteria_labs: string;
  criteria_dietary: string;
  criteria_clinical: string;
  criteria_functional: string;

  // ME-3 — Outcome Evaluation
  outcome_progress: OutcomeProgress;
  outcome_narrative: string;
  outcome_nextSteps: string;

  // Discharge & Transition
  dischargeRecs: string;
  transitionPlan: string;

  // Narrative
  meNarrative: string;

  // General
  meNotes: string;
}