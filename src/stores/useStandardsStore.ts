// src/stores/useStandardsStore.ts

import { create } from "zustand";
import type { Standards } from "../types";
import { defaultStandards } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";

interface StandardsState {
  standards: Standards;
  setStandards: (updates: Partial<Standards>) => void;
  updateStandardsField: <K extends keyof Standards>(
    field: K,
    value: Standards[K]
  ) => void;
}

export const useStandardsStore = create<StandardsState>((set) => ({
  standards: defaultStandards,

  setStandards: (updates) =>
    set((state) => ({ standards: { ...state.standards, ...updates } })),

  updateStandardsField: (field, value) =>
    set((state) => ({ standards: { ...state.standards, [field]: value } })),
}));

registerDomainReset("standards", (raw) => {
  const parsed = raw ? tryParse(raw, defaultStandards) : defaultStandards;
  useStandardsStore.setState({ standards: parsed });
});

registerDomainGetter("standards", () => useStandardsStore.getState().standards);

function tryParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}