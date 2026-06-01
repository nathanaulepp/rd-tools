// src/stores/useDiagnosisStore.ts

import { create } from "zustand";
import type { Diagnosis } from "../types";
import { defaultDiagnosis } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface DiagnosisState {
  diagnosis: Diagnosis;
  setDiagnosis: (updates: Partial<Diagnosis>) => void;
  updateDiagnosisField: <K extends keyof Diagnosis>(
    field: K,
    value: Diagnosis[K]
  ) => void;
}

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  diagnosis: defaultDiagnosis,

  setDiagnosis: (updates) =>
    set((state) => ({ diagnosis: { ...state.diagnosis, ...updates } })),

  updateDiagnosisField: (field, value) =>
    set((state) => ({ diagnosis: { ...state.diagnosis, [field]: value } })),
}));

registerDomainReset("diagnosis", (raw) => {
  const parsed = raw ? tryParse(raw, defaultDiagnosis) : defaultDiagnosis;
  useDiagnosisStore.setState({ diagnosis: parsed });
});

registerDomainGetter("diagnosis", () => useDiagnosisStore.getState().diagnosis);