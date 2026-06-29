// src/stores/useEnteralFormulaStore.ts
// Global formulary store — NOT registered with useNoteStore.
// This data lives at the user/installation level, not the note level.

import { create } from "zustand";
import type { EnteralFormula, EnteralFormulaInput } from "../types/enteralFormula";

interface EnteralFormulaState {
  formulas: EnteralFormula[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFormulas: () => Promise<void>;
  addFormula: (input: EnteralFormulaInput) => Promise<EnteralFormula | null>;
  updateFormula: (id: string, input: Partial<EnteralFormulaInput>) => Promise<boolean>;
  deleteFormula: (id: string) => Promise<boolean>;

  // Convenience: find by id
  getFormulaById: (id: string) => EnteralFormula | undefined;
}

export const useEnteralFormulaStore = create<EnteralFormulaState>((set, get) => ({
  formulas: [],
  isLoading: false,
  error: null,

  loadFormulas: async () => {
    set({ isLoading: true, error: null });
    try {
      const { getAllFormulas } = await import("../shared/api/db.commands");
      const formulas = await getAllFormulas();
      set({ formulas, isLoading: false });
    } catch (e) {
      console.error("[EnteralFormulaStore] loadFormulas failed:", e);
      set({ error: "Failed to load formulary.", isLoading: false });
    }
  },

  addFormula: async (input) => {
    try {
      const { createFormula } = await import("../shared/api/db.commands");
      const formula = await createFormula(input);
      set((state) => ({ formulas: [...state.formulas, formula] }));
      return formula;
    } catch (e) {
      console.error("[EnteralFormulaStore] addFormula failed:", e);
      set({ error: "Failed to save formula." });
      return null;
    }
  },

  updateFormula: async (id, input) => {
    try {
      const { updateFormula: dbUpdate } = await import("../shared/api/db.commands");
      await dbUpdate(id, input);
      set((state) => ({
        formulas: state.formulas.map((f) =>
          f.id === id ? { ...f, ...input } : f
        ),
      }));
      return true;
    } catch (e) {
      console.error("[EnteralFormulaStore] updateFormula failed:", e);
      set({ error: "Failed to update formula." });
      return false;
    }
  },

  deleteFormula: async (id) => {
    try {
      const { deleteFormula: dbDelete } = await import("../shared/api/db.commands");
      await dbDelete(id);
      set((state) => ({
        formulas: state.formulas.filter((f) => f.id !== id),
      }));
      return true;
    } catch (e) {
      console.error("[EnteralFormulaStore] deleteFormula failed:", e);
      set({ error: "Failed to delete formula." });
      return false;
    }
  },

  getFormulaById: (id) => get().formulas.find((f) => f.id === id),
}));