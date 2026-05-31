// src/stores/useClinicalStore.ts

import { create } from "zustand";
import type { Clinical } from "../types";
import { defaultClinical } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";

interface ClinicalState {
  clinical: Clinical;
  setClinical: (updates: Partial<Clinical>) => void;
  updateClinicalField: <K extends keyof Clinical>(
    field: K,
    value: Clinical[K]
  ) => void;
}

export const useClinicalStore = create<ClinicalState>((set) => ({
  clinical: defaultClinical,

  setClinical: (updates) =>
    set((state) => ({ clinical: { ...state.clinical, ...updates } })),

  updateClinicalField: (field, value) =>
    set((state) => ({ clinical: { ...state.clinical, [field]: value } })),
}));

registerDomainReset("clinical", (raw) => {
  const parsed = raw ? tryParse(raw, defaultClinical) : defaultClinical;
  useClinicalStore.setState({ clinical: parsed });
});

registerDomainGetter("clinical", () => useClinicalStore.getState().clinical);

function tryParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}