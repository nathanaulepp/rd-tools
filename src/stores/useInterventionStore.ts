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

  // ── Leaf selection helpers ────────────────────────────────────────────────
  /** Toggle a leaf label in/out of ndImplementation.selected.
   *  When deselected, its note entry is also removed. */
  toggleLeaf: (label: string) => void;

  /** Set the free-text note for a selected leaf. */
  setLeafNote: (label: string, note: string) => void;
}

export const useInterventionStore = create<InterventionState>((set, get) => ({
  intervention: defaultIntervention,

  setIntervention: (updates) =>
    set((state) => ({ intervention: { ...state.intervention, ...updates } })),

  updateInterventionField: (field, value) =>
    set((state) => ({
      intervention: { ...state.intervention, [field]: value },
    })),

  toggleLeaf: (label) =>
    set((state) => {
      const impl = state.intervention.ndImplementation;
      const isSelected = impl.selected.includes(label);

      if (isSelected) {
        // Deselect: remove from selected, drop its note
        const nextNotes = { ...impl.notes };
        delete nextNotes[label];
        return {
          intervention: {
            ...state.intervention,
            ndImplementation: {
              selected: impl.selected.filter((l) => l !== label),
              notes: nextNotes,
            },
          },
        };
      } else {
        // Select: add to selected, initialise note as empty string
        return {
          intervention: {
            ...state.intervention,
            ndImplementation: {
              selected: [...impl.selected, label],
              notes: { ...impl.notes, [label]: "" },
            },
          },
        };
      }
    }),

  setLeafNote: (label, note) =>
    set((state) => ({
      intervention: {
        ...state.intervention,
        ndImplementation: {
          ...state.intervention.ndImplementation,
          notes: {
            ...state.intervention.ndImplementation.notes,
            [label]: note,
          },
        },
      },
    })),
}));

registerDomainReset("intervention", (raw) => {
  const parsed = raw ? tryParse(raw, defaultIntervention) : defaultIntervention;
  // Guard: if old shape (pre-tree) is detected, migrate to new shape
  const intervention = parsed as any;
  if (!intervention.ndImplementation) {
    intervention.ndImplementation = { selected: [], notes: {} };
  }
  useInterventionStore.setState({ intervention });
});

registerDomainGetter("intervention", () => useInterventionStore.getState().intervention);