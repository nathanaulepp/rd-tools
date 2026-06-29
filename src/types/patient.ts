// src/types/patient.ts
// Strong types for patient identity and note metadata.
// Mirrors the DB schema in src/shared/api/db.commands.ts — keep in sync.

export interface PatientData {
  lastName: string;
  firstName: string;
  dob: string;
  sex: string;
  mrn: string;
  admissionDate: string;
  noteDate: string;
  languages: string;
}