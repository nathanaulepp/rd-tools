// src/stores/useLabsStore.ts
import { create } from "zustand";
import type { Labs, LabEntry, LabPreset, LabColumn } from "../types";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";
import {
  GLOBAL_LAB_CATALOG,
  DEFAULT_PANEL_KEYS,
} from "../shared/data/biochemicalCatalog";
import { v4 as uuid } from "uuid";

// ── Sorting Helpers ───────────────────────────────────────────────────────────

export function getSortKey(col: LabColumn): string {
  const hasDate = col.date && col.date.trim() !== "";
  const hasTime = col.time && col.time.trim() !== "";
  if (!hasDate && !hasTime) {
    return "ZZZZ-ZZ-ZZTZZ:ZZ"; // Sort to the very end
  }
  const datePart = hasDate ? col.date.trim() : "9999-12-31";
  const timePart = hasTime ? col.time.trim() : "23:59";
  return `${datePart}T${timePart}`;
}

export function sortColumns(cols: LabColumn[]): LabColumn[] {
  return [...cols].sort((a, b) => {
    const keyA = getSortKey(a);
    const keyB = getSortKey(b);
    return keyA.localeCompare(keyB);
  });
}

// ── Skeleton LabEntry helper (internal) ────────────────────────────────────────

function makeEntry(slug: string, columnIds: string[]): LabEntry {
  const catalog = GLOBAL_LAB_CATALOG[slug];
  const values: Record<string, string> = {};
  for (const id of columnIds) {
    values[id] = "";
  }
  return {
    unit: catalog?.defaultUnit ?? "",
    loincCode: catalog?.loinc ?? "",
    loincName: catalog?.name ?? slug,
    values,
  };
}

// ── Serialise only populated entries to keep the DB column lean ───────────────

function compactLabs(labs: Labs): Labs {
  return Object.fromEntries(
    Object.entries(labs).filter(([, entry]) =>
      Object.values(entry.values).some((v) => typeof v === "string" && v.trim() !== "")
    )
  );
}

// ── State interface ───────────────────────────────────────────────────────────

interface LabsState {
  labs: Labs;
  columns: LabColumn[];
  activeLabKeys: string[];
  userPresets: LabPreset[];
  labNotes: string;

  setLabs: (labs: Labs) => void;
  setLabNotes: (notes: string) => void;
  updateLabValue: (slug: string, columnId: string, value: string) => void;
  addColumnLeft: (referenceId: string) => void;
  addColumnRight: (referenceId: string) => void;
  removeColumn: (id: string) => void;
  updateColumnDate: (id: string, date: string) => void;
  updateColumnTime: (id: string, time: string) => void;
  addLabToView: (key: string) => void;
  removeLabFromView: (key: string) => void;
  loadDefaultPanel: (panelName: string) => void;
  saveKeysAsPreset: (name: string, keys: string[]) => LabPreset;
  saveCurrentViewAsPreset: (name: string) => LabPreset;
  loadPreset: (presetId: string) => void;
  loadPresets: (ids: string[]) => void;
  deletePreset: (presetId: string) => void;
  setUserPresets: (presets: LabPreset[]) => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useLabsStore = create<LabsState>((set, get) => ({
  labs: {},
  columns: [{ id: uuid(), date: "", time: "" }],
  activeLabKeys: DEFAULT_PANEL_KEYS["Endocrine & Metabolic"],
  userPresets: [],
  labNotes: "",

  setLabs: (labs) => set({ labs }),
  setLabNotes: (labNotes) => set({ labNotes }),

  updateLabValue: (slug, columnId, value) =>
    set((state) => {
      const existing = state.labs[slug] ?? makeEntry(slug, state.columns.map((c) => c.id));
      const updatedValues = { ...existing.values, [columnId]: value };
      return {
        labs: {
          ...state.labs,
          [slug]: { ...existing, values: updatedValues },
        },
      };
    }),

  addColumnLeft: (referenceId) =>
    set((state) => {
      const idx = state.columns.findIndex((c) => c.id === referenceId);
      if (idx === -1) return state;
      const newColId = uuid();
      const newCol: LabColumn = { id: newColId, date: "", time: "" };
      const newColumns = [...state.columns];
      newColumns.splice(idx, 0, newCol);

      const updatedLabs = { ...state.labs };
      for (const slug in updatedLabs) {
        updatedLabs[slug] = {
          ...updatedLabs[slug],
          values: {
            ...updatedLabs[slug].values,
            [newColId]: "",
          },
        };
      }
      return { columns: newColumns, labs: updatedLabs };
    }),

  addColumnRight: (referenceId) =>
    set((state) => {
      const idx = state.columns.findIndex((c) => c.id === referenceId);
      if (idx === -1) return state;
      const newColId = uuid();
      const newCol: LabColumn = { id: newColId, date: "", time: "" };
      const newColumns = [...state.columns];
      newColumns.splice(idx + 1, 0, newCol);

      const updatedLabs = { ...state.labs };
      for (const slug in updatedLabs) {
        updatedLabs[slug] = {
          ...updatedLabs[slug],
          values: {
            ...updatedLabs[slug].values,
            [newColId]: "",
          },
        };
      }
      return { columns: newColumns, labs: updatedLabs };
    }),

  removeColumn: (id) =>
    set((state) => {
      if (state.columns.length === 1) return state;
      const newColumns = state.columns.filter((c) => c.id !== id);
      const updatedLabs = { ...state.labs };
      for (const slug in updatedLabs) {
        const newValues = { ...updatedLabs[slug].values };
        delete newValues[id];
        updatedLabs[slug] = {
          ...updatedLabs[slug],
          values: newValues,
        };
      }
      return { columns: newColumns, labs: updatedLabs };
    }),

  updateColumnDate: (id, date) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? { ...c, date } : c)),
    })),

  updateColumnTime: (id, time) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? { ...c, time } : c)),
    })),

  addLabToView: (key) =>
    set((state) => {
      if (state.activeLabKeys.includes(key)) return state;
      const existing = state.labs[key];
      const labs = existing
        ? state.labs
        : {
            ...state.labs,
            [key]: makeEntry(key, state.columns.map((c) => c.id)),
          };
      return {
        activeLabKeys: [...state.activeLabKeys, key],
        labs,
      };
    }),

  removeLabFromView: (key) =>
    set((state) => ({
      activeLabKeys: state.activeLabKeys.filter((k) => k !== key),
    })),

  loadDefaultPanel: (panelName) =>
    set((state) => {
      const keys = DEFAULT_PANEL_KEYS[panelName] ?? [];
      const labs = { ...state.labs };
      const colIds = state.columns.map((c) => c.id);
      for (const key of keys) {
        if (!labs[key]) {
          labs[key] = makeEntry(key, colIds);
        }
      }
      return { activeLabKeys: keys, labs };
    }),

  saveKeysAsPreset: (name, keys) => {
    const preset: LabPreset = {
      id: uuid(),
      name,
      labKeys: [...keys],
    };
    set((state) => ({ userPresets: [...state.userPresets, preset] }));

    import("../shared/api/db.commands").then(({ insertLabPreset }) => {
      insertLabPreset(preset).catch((e) =>
        console.error("[useLabsStore] insertLabPreset failed:", e)
      );
    });

    return preset;
  },

  saveCurrentViewAsPreset: (name) => {
    const preset: LabPreset = {
      id: uuid(),
      name,
      labKeys: [...get().activeLabKeys],
    };
    set((state) => ({ userPresets: [...state.userPresets, preset] }));

    import("../shared/api/db.commands").then(({ insertLabPreset }) => {
      insertLabPreset(preset).catch((e) =>
        console.error("[useLabsStore] insertLabPreset failed:", e)
      );
    });

    return preset;
  },

  loadPreset: (presetId) =>
    set((state) => {
      const preset = state.userPresets.find((p) => p.id === presetId);
      if (!preset) return state;

      const labs = { ...state.labs };
      const colIds = state.columns.map((c) => c.id);
      for (const key of preset.labKeys) {
        if (!labs[key]) {
          labs[key] = makeEntry(key, colIds);
        }
      }
      return { activeLabKeys: [...preset.labKeys], labs };
    }),

  loadPresets: (ids) =>
    set((state) => {
      const selected = state.userPresets.filter((p) => ids.includes(p.id));
      if (selected.length === 0) return state;

      const seen = new Set<string>();
      const unionKeys: string[] = [];
      for (const preset of selected) {
        for (const key of preset.labKeys) {
          if (!seen.has(key)) {
            seen.add(key);
            unionKeys.push(key);
          }
        }
      }

      const labs = { ...state.labs };
      const colIds = state.columns.map((c) => c.id);
      for (const key of unionKeys) {
        if (!labs[key]) {
          labs[key] = makeEntry(key, colIds);
        }
      }
      return { activeLabKeys: unionKeys, labs };
    }),

  deletePreset: (presetId) => {
    set((state) => ({
      userPresets: state.userPresets.filter((p) => p.id !== presetId),
    }));

    import("../shared/api/db.commands").then(({ deleteLabPreset }) => {
      deleteLabPreset(presetId).catch((e) =>
        console.error("[useLabsStore] deleteLabPreset failed:", e)
      );
    });
  },

  setUserPresets: (presets) => set({ userPresets: presets }),
}));

// ── Domain registration (autosave pipeline) ───────────────────────────────────

registerDomainReset("labs", (raw) => {
  if (!raw) {
    useLabsStore.setState({
      labs: {},
      columns: [{ id: uuid(), date: "", time: "" }],
      activeLabKeys: DEFAULT_PANEL_KEYS["Endocrine & Metabolic"],
      labNotes: "",
    });
    return;
  }

  const parsed = tryParse<Record<string, any>>(raw, {});

  // Extract columns
  let columns: LabColumn[] = [];
  if (Array.isArray(parsed.__columns__)) {
    columns = parsed.__columns__;
  }
  if (columns.length === 0) {
    columns = [{ id: uuid(), date: "", time: "" }];
  }

  // Extract lab notes
  const labNotes = typeof parsed.__labNotes__ === "string" ? parsed.__labNotes__ : "";

  // Extract labs (excluding reserved keys)
  const labs: Labs = {};
  for (const [key, val] of Object.entries(parsed)) {
    if (key === "__columns__" || key === "__labNotes__") continue;
    labs[key] = {
      unit: String(val?.unit ?? ""),
      loincCode: String(val?.loincCode ?? ""),
      loincName: String(val?.loincName ?? ""),
      values: val?.values && typeof val.values === "object" ? { ...val.values } : {},
    };
  }

  // Find keys that have at least one non-empty value in their values Record
  const populatedKeys = Object.keys(labs).filter((k) =>
    Object.values(labs[k].values).some((v) => typeof v === "string" && v.trim() !== "")
  );

  useLabsStore.setState({
    labs,
    columns,
    activeLabKeys: populatedKeys.length > 0
      ? populatedKeys
      : DEFAULT_PANEL_KEYS["Endocrine & Metabolic"],
    labNotes,
  });
});

registerDomainGetter("labs", () => {
  const { labs, columns, labNotes } = useLabsStore.getState();
  const sorted = sortColumns(columns);
  return {
    __columns__: sorted,
    __labNotes__: labNotes,
    ...compactLabs(labs),
  };
});
