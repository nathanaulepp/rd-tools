import type { Patient, Note } from '../api/db';

export interface PatientHeaderProps {
  patient: Patient | null;
  note: Note | null;
  patientData: any;          // still used for noteDate / admissionDate edits
  setPatientData: (d: any) => void;
  clinical: any;
}

export interface MicroNutrientParams {
  amount?: string | number;
  unit?: string;
  rate?: string;
}

export interface ENFeed {
  id: number;
  label: string;
  route: string;
  type: string;
  formula: string;
  bolusMl: string | number;
  bolusTimesPerDay: string | number;
  bolusEveryHrs: string | number;
  continuousRate: string | number;
  continuousHrs: string | number;
  flushMl: string | number;
  flushTimesPerDay: string | number;
  flushEveryHrs: string | number;
  calPerMl: string | number;
  protGPerL: string | number;
  fwPct: string | number;
  /** g carbohydrate per L of formula — populated via formula search */
  choGPerL?: string | number;
  /** g fat per L of formula — populated via formula search */
  fatGPerL?: string | number;
  expanded: boolean;
}

export interface PNFeed {
  id: number;
  label: string;
  indication: string;
  route: string;
  access: string;
  delivery: string;
  goal: string;
  startDate: string;
  startTime: string;
  // Dextrose
  dextHrs: string | number;
  dextAmount: string | number;   // g/day (manual override)
  dextAmountUnit: string;
  dextDuration: string;
  dextRate: string | number;     // mL/hr
  dextConc: string;              // D% e.g. "10", "20", "50"
  // Amino Acids
  aaHrs: string | number;
  aaAmount: string | number;     // g/day
  aaAmountUnit: string;
  aaDuration: string;
  aaRate: string | number;       // mL/hr
  aaConc: string;                // % solution
  // Lipids
  lipidHrs: string | number;
  lipidOil: string;
  lipidAmount: string | number;  // g/day
  lipidDuration: string;
  lipidRate: string | number;    // mL/hr
  lipidConc: "10" | "20" | "30";
  lipidFreq?: string;            // e.g. "3x"
  lipidCustomOil: string;
  // Combined rate for TNA / 2-in-1
  combinedRate: string | number;
  insulinUnits: string | number;
  electrolytes: Record<string, MicroNutrientParams>;
  vitamins: Record<string, MicroNutrientParams>;
  expanded: boolean;
  electroExpanded: boolean;
  vitExpanded: boolean;
}

export interface ENState {
  feeds: ENFeed[];
  savedFormulas: string[];
  nextId: number;
}

export interface PNState {
  bags: PNFeed[];
  nextId: number;
}