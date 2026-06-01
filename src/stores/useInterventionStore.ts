// src/stores/useInterventionStore.ts

import { create } from "zustand";
import type { Intervention } from "../types";
import { defaultIntervention } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface InterventionState {
  intervention: Intervention;
  setIntervention: (updates: Partial<Intervention>) => void;
  updateInterventionField: <K extends keyof Intervention>(
    field: K,
    value: Intervention[K]
  ) => void;
}

export const useInterventionStore = create<InterventionState>((set) => ({
  intervention: defaultIntervention,

  setIntervention: (updates) =>
    set((state) => ({ intervention: { ...state.intervention, ...updates } })),

  updateInterventionField: (field, value) =>
    set((state) => ({
      intervention: { ...state.intervention, [field]: value },
    })),
}));

registerDomainReset("intervention", (raw) => {
  const parsed = raw ? tryParse(raw, defaultIntervention) : defaultIntervention;
  useInterventionStore.setState({ intervention: parsed });
});

registerDomainGetter("intervention", () => useInterventionStore.getState().intervention);