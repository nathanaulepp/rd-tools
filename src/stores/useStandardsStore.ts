// src/stores/useStandardsStore.ts
//
// Milestone 1 additions:
//   - Standards interface now contains a `snapshot` field (EvaluationSnapshot | null).
//   - setSnapshot() is exposed so NutritionStandardsDomain can write the
//     computed EvaluationSnapshot without touching the UI parameters.
//     The existing autosave pipeline (saveDomain("standards", ...)) picks it
//     up automatically because the snapshot lives inside the same JSON blob.
//   - defaultStandards initialises snapshot to null; it is populated on the
//     first evaluation run and persisted via the standard saveDomain cycle.

import { create } from "zustand";
import type { Standards, EvaluationSnapshot } from "../types";
import { defaultStandards } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";

interface StandardsState {
  standards: Standards;
  setStandards: (updates: Partial<Standards>) => void;
  updateStandardsField: <K extends keyof Standards>(
    field: K,
    value: Standards[K]
  ) => void;
  /** Write the evaluation snapshot into the standards blob without touching UI params. */
  setSnapshot: (snapshot: EvaluationSnapshot) => void;
}

export const useStandardsStore = create<StandardsState>((set) => ({
  standards: defaultStandards,

  setStandards: (updates) =>
    set((state) => ({ standards: { ...state.standards, ...updates } })),

  updateStandardsField: (field, value) =>
    set((state) => ({ standards: { ...state.standards, [field]: value } })),

  setSnapshot: (snapshot) =>
    set((state) => ({ standards: { ...state.standards, snapshot } })),
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