// src/types/diagnosis.ts

export interface PESStatement {
  id: number;
  problem: string;
  etiology: string;
  signsSymptoms: string;
}

export interface Diagnosis {
  // Primary PES
  problem: string;
  etiology: string;
  signsSymptoms: string;

  // Additional PES statements
  additionalDiagnoses: PESStatement[];

  // Narrative & Priority
  nutritionDxNarrative: string;
  priorityRanking: string;
}