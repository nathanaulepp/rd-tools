// src/stores/useMonitorEvalStore.ts

import { create } from "zustand";
import type { MonitorEval } from "../types";
import { defaultMonitorEval } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";

interface MonitorEvalState {
  monitorEval: MonitorEval;
  setMonitorEval: (updates: Partial<MonitorEval>) => void;
  updateMonitorEvalField: <K extends keyof MonitorEval>(
    field: K,
    value: MonitorEval[K]
  ) => void;
}

export const useMonitorEvalStore = create<MonitorEvalState>((set) => ({
  monitorEval: defaultMonitorEval,

  setMonitorEval: (updates) =>
    set((state) => ({ monitorEval: { ...state.monitorEval, ...updates } })),

  updateMonitorEvalField: (field, value) =>
    set((state) => ({
      monitorEval: { ...state.monitorEval, [field]: value },
    })),
}));

registerDomainReset("monitor_evaluate", (raw) => {
  const parsed = raw ? tryParse(raw, defaultMonitorEval) : defaultMonitorEval;
  useMonitorEvalStore.setState({ monitorEval: parsed });
});

registerDomainGetter("monitor_evaluate", () => useMonitorEvalStore.getState().monitorEval);