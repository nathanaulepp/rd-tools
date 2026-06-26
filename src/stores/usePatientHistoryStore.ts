import { create } from "zustand";
import type { PatientHistory } from "../types";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

const defaultPatientHistory: PatientHistory = {
  purposeOfVisit: "",
  chiefComplaint: "",
  medHx:          "",
  familyHx:       "",
  socialHx:       "",
};

interface PatientHistoryState {
  patientHistory: PatientHistory;
  setPatientHistory: (updates: Partial<PatientHistory>) => void;
}

export const usePatientHistoryStore = create<PatientHistoryState>((set) => ({
  patientHistory: defaultPatientHistory,

  setPatientHistory: (updates) =>
    set((state) => ({
      patientHistory: { ...state.patientHistory, ...updates },
    })),
}));

registerDomainReset("patient_history", (raw) => {
  const parsed = raw ? tryParse(raw, defaultPatientHistory) : defaultPatientHistory;
  usePatientHistoryStore.setState({ patientHistory: parsed });
});

registerDomainGetter(
  "patient_history",
  () => usePatientHistoryStore.getState().patientHistory
);
