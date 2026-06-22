export interface LabColumn {
  id: string;
  date: string; // YYYY-MM-DD, bound to <input type="date">
  time: string; // HH:MM (24h), bound to <input type="time">
}

export interface LabEntry {
  unit: string;
  loincCode: string;
  loincName: string;
  values: Record<string, string>; // keyed by LabColumn.id -> user value
}

export type Labs = Record<string, LabEntry>; // keyed by catalog slug

export interface LabsDomainState {
  entries: Labs;
  notes: string;
}

export interface LabPreset {
  id: string;
  name: string;
  labKeys: string[];
}
