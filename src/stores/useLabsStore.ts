// src/stores/useLabsStore.ts

import { create } from "zustand";
import type { Labs } from "../types";
import { defaultLabs } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface LabsState {
  labs: Labs;
  setLabs: (labs: Labs) => void;
  updateLabField: (
    field: string,
    type: "current" | "historical",
    value: string
  ) => void;
}

export const useLabsStore = create<LabsState>((set, get) => ({
  labs: defaultLabs,

  setLabs: (labs) => set({ labs }),

  updateLabField: (field, type, value) =>
    set((state) => ({
      labs: {
        ...state.labs,
        [field]: { ...state.labs[field], [type]: value },
      },
    })),
}));

registerDomainReset("labs", (raw) => {
  const parsed = raw ? tryParse(raw, defaultLabs) : defaultLabs;
  useLabsStore.setState({ labs: parsed });
});

registerDomainGetter("labs", () => useLabsStore.getState().labs);