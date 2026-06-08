// src/stores/useRefeedingStore.ts
// Zustand store for the RD2B Refeeding Risk Screen tool.
// Follows the exact decoupled registration pattern from useClinicalStore.ts.

import { create } from "zustand";
import type { RefeedingScreen } from "../types/refeedingScreen";
import { defaultRefeedingScreen } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface RefeedingState {
  refeedingScreen: RefeedingScreen;
  setRefeedingScreen: (updates: Partial<RefeedingScreen>) => void;
  updateRefeedingField: <K extends keyof RefeedingScreen>(
    field: K,
    value: RefeedingScreen[K]
  ) => void;
  resetScreen: () => void;
}

export const useRefeedingStore = create<RefeedingState>((set) => ({
  refeedingScreen: defaultRefeedingScreen,

  setRefeedingScreen: (updates) =>
    set((state) => ({
      refeedingScreen: { ...state.refeedingScreen, ...updates },
    })),

  updateRefeedingField: (field, value) =>
    set((state) => ({
      refeedingScreen: { ...state.refeedingScreen, [field]: value },
    })),

  resetScreen: () => set({ refeedingScreen: defaultRefeedingScreen }),
}));

// ── Domain registration (autosave pipeline) ───────────────────────────────────

registerDomainReset("refeeding_screen", (raw) => {
  const parsed = raw
    ? tryParse(raw, defaultRefeedingScreen)
    : defaultRefeedingScreen;
  useRefeedingStore.setState({ refeedingScreen: parsed });
});

registerDomainGetter(
  "refeeding_screen",
  () => useRefeedingStore.getState().refeedingScreen
);