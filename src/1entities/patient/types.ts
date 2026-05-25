export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex?: string;
  admissionDate?: string;
  languages?: string; 
}