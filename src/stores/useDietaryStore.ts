// src/stores/useDietaryStore.ts

import { create } from "zustand";
import type { Dietary } from "../types";
import { defaultDietary } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface DietaryState {
  dietary: Dietary;
  setDietary: (updates: Partial<Dietary>) => void;
  updateDietaryField: <K extends keyof Dietary>(
    field: K,
    value: Dietary[K]
  ) => void;
}

export const useDietaryStore = create<DietaryState>((set) => ({
  dietary: defaultDietary,

  setDietary: (updates) =>
    set((state) => ({ dietary: { ...state.dietary, ...updates } })),

  updateDietaryField: (field, value) =>
    set((state) => ({ dietary: { ...state.dietary, [field]: value } })),
}));

registerDomainReset("dietary", (raw) => {
  const parsed = raw ? tryParse(raw, defaultDietary) : defaultDietary;
  useDietaryStore.setState({ dietary: { ...defaultDietary, ...parsed } });
});

registerDomainGetter("dietary", () => useDietaryStore.getState().dietary);