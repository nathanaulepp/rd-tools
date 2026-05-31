// src/stores/index.ts
// Single import point for all stores and derived hooks.
// Usage: import { useAnthroStore, useNoteStore } from '@/stores';

export { useUIStore } from "./useUIStore";
export type { ViewState } from "./useUIStore";

export {
  useNoteStore,
  registerDomainReset,
  registerDomainGetter,
} from "./useNoteStore";
export type { AutosaveKey } from "./useNoteStore";

export { useAnthroStore } from "./useAnthroStore";
export { useLabsStore } from "./useLabsStore";
export { useClinicalStore } from "./useClinicalStore";
export { useDietaryStore } from "./useDietaryStore";
export { useDiagnosisStore } from "./useDiagnosisStore";
export { useInterventionStore } from "./useInterventionStore";
export { useMonitorEvalStore } from "./useMonitorEvalStore";
export { useStandardsStore } from "./useStandardsStore";
export { useCalculatedMetrics } from "./useCalculatedMetrics";