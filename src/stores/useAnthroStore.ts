// src/stores/useAnthroStore.ts

import { create } from "zustand";
import type { Anthro, DexaScan } from "../types";
import { defaultAnthro, defaultDexaScans } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface AnthroState {
  anthro: Anthro;
  dexaScans: DexaScan[];

  setAnthro: (updates: Partial<Anthro>) => void;
  setDexaScans: (scans: DexaScan[]) => void;

  // Fine-grained field update — mirrors the old handleUpdate pattern
  updateAnthroField: <K extends keyof Anthro>(field: K, value: Anthro[K]) => void;
}

export const useAnthroStore = create<AnthroState>((set, get) => ({
  anthro: defaultAnthro,
  dexaScans: defaultDexaScans,

  setAnthro: (updates) =>
    set((state) => ({ anthro: { ...state.anthro, ...updates } })),

  setDexaScans: (scans) => set({ dexaScans: scans }),

  updateAnthroField: (field, value) =>
    set((state) => ({ anthro: { ...state.anthro, [field]: value } })),
}));

// Register with the note store so openNote() and saveAllDomains() work automatically

registerDomainReset("anthro", (raw) => {
  const parsed = raw ? tryParse(raw, defaultAnthro) : defaultAnthro;
  useAnthroStore.setState({ anthro: parsed });
});

registerDomainReset("dexa_scans", (raw) => {
  const parsed = raw ? tryParse(raw, defaultDexaScans) : defaultDexaScans;
  useAnthroStore.setState({ dexaScans: parsed });
});

registerDomainGetter("anthro", () => useAnthroStore.getState().anthro);
registerDomainGetter("dexa_scans", () => useAnthroStore.getState().dexaScans);