// src/shared/utils/dateValidation.ts

interface DateValidationParams {
  field: string;
  value: string;
  dob: string;
  noteDate: string;
  admissionDate: string;
}

/**
 * Validates clinical date boundaries.
 * Returns an error string or empty string if valid.
 */
export function validateDateBoundaries({
  field,
  value,
  dob,
  noteDate,
  admissionDate,
}: DateValidationParams): string {
  if (!value || !dob) return "";

  const dVal = new Date(value);
  const dDob = new Date(dob);

  // General rule: nothing before birth
  if (dVal < dDob) return "Date cannot be before birth.";

  // Context-specific rules
  if (field === "noteDate") {
    if (admissionDate) {
      const dAdm = new Date(admissionDate);
      if (dVal < dAdm) return "Note date cannot be before admission.";
    }
  }

  if (field === "admissionDate") {
    if (noteDate) {
      const dNote = new Date(noteDate);
      if (dVal > dNote) return "Admission date cannot be after note date.";
    }
  }

  return "";
}
