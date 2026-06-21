// src/stores/useLabsStore.ts
// Phase 1 overhaul: dynamic activeLabKeys + userPresets + LOINC-aware LabEntry.
//
// Backward-compat notes:
//   - registerDomainReset("labs", ...) still fires on note open.
//     The persisted JSON blob now has the new LabEntry shape; old notes
//     with the legacy { current, historical } shape are up-migrated inline
//     inside the reset callback via migrateLabEntry().
//   - registerDomainGetter("labs", ...) serialises only the populated subset
//     (compactLabs) so the DB column stays lean.

import { create } from "zustand";
import type { Labs, LabEntry, LabPreset } from "../types";
import { defaultLabs } from "../entities/note/defaults";
import { registerDomainReset, registerDomainGetter } from "./useNoteStore";
import { tryParse } from "./storeUtils";
import {
  GLOBAL_LAB_CATALOG,
  DEFAULT_PANEL_KEYS,
} from "../shared/data/biochemicalCatalog";
import { v4 as uuid } from "uuid";

// ── Migration helper ───────────────────────────────────────────────────────────
// Up-migrates a legacy { current, historical } entry to the new LabEntry shape.
// Safe to run on already-migrated entries (idempotent).
function migrateLabEntry(raw: Record<string, unknown>, key: string): LabEntry {
  const catalog = GLOBAL_LAB_CATALOG[key];
  return {
    current:    String((raw.current    as string) ?? ""),
    historical: String((raw.historical as string) ?? ""),
    unit:       String((raw.unit       as string) ?? catalog?.defaultUnit ?? ""),
    loincCode:  String((raw.loincCode  as string) ?? catalog?.loinc      ?? ""),
    loincName:  String((raw.loincName  as string) ?? catalog?.name       ?? key),
  };
}

// ── Serialise only populated entries to keep the DB column lean ───────────────
function compactLabs(labs: Labs): Labs {
  return Object.fromEntries(
    Object.entries(labs).filter(
      ([, entry]) => entry.current.trim() !== "" || entry.historical.trim() !== ""
    )
  );
}

// ── State interface ───────────────────────────────────────────────────────────

interface LabsState {
  // Core lab data — keyed by catalog slug
  labs: Labs;

  // Which lab slugs are currently rendered on the clinician's screen.
  // Ordered — insertion order = row order in the table.
  activeLabKeys: string[];

  // User-defined saved templates (persisted to DB in Phase 4)
  userPresets: LabPreset[];

  // ── Core lab mutations ─────────────────────────────────────────────────────
  setLabs: (labs: Labs) => void;

  /** Update a single field on an existing entry */
  updateLabField: (
    key: string,
    type: keyof Pick<LabEntry, "current" | "historical" | "unit">,
    value: string
  ) => void;

  // ── Active key management ──────────────────────────────────────────────────

  /** Append a catalog key to the visible table (no-op if already present) */
  addLabToView: (key: string) => void;

  /** Remove a key from the visible table (data is preserved in labs{}) */
  removeLabFromView: (key: string) => void;

  /** Replace the visible set with all keys from a named panel (seeded defaults) */
  loadDefaultPanel: (panelName: string) => void;

  // ── Preset management ──────────────────────────────────────────────────────

  /** Snapshot the current activeLabKeys as a named preset */
  saveCurrentViewAsPreset: (name: string) => LabPreset;

  /** Snapshot the given keys as a named preset */
  saveKeysAsPreset: (name: string, keys: string[]) => LabPreset;

  /** Replace activeLabKeys with those stored in the preset */
  loadPreset: (presetId: string) => void;

  /** Load multiple presets and union their keys */
  loadPresets: (ids: string[]) => void;

  /** Remove a preset by ID */
  deletePreset: (presetId: string) => void;

  /** Hydrate presets from DB (called once on app boot / note open) */
  setUserPresets: (presets: LabPreset[]) => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useLabsStore = create<LabsState>((set, get) => ({
  labs:           defaultLabs,
  activeLabKeys:  DEFAULT_PANEL_KEYS["Endocrine & Metabolic"], // sensible boot default
  userPresets:    [],

  // ── Core ─────────────────────────────────────────────────────────────────
  setLabs: (labs) => set({ labs }),

  updateLabField: (key, type, value) =>
    set((state) => {
      const existing = state.labs[key] ?? {
        current: "", historical: "", unit: "", loincCode: "", loincName: "",
      };
      return {
        labs: { ...state.labs, [key]: { ...existing, [type]: value } },
      };
    }),

  // ── Active key management ─────────────────────────────────────────────────
  addLabToView: (key) =>
    set((state) => {
      if (state.activeLabKeys.includes(key)) return state;

      // Ensure a skeleton LabEntry exists so the row renders immediately
      const catalog = GLOBAL_LAB_CATALOG[key];
      const existing = state.labs[key];
      const labs = existing
        ? state.labs
        : {
            ...state.labs,
            [key]: {
              current:   "",
              historical:"",
              unit:      catalog?.defaultUnit ?? "",
              loincCode: catalog?.loinc       ?? "",
              loincName: catalog?.name        ?? key,
            },
          };

      return { activeLabKeys: [...state.activeLabKeys, key], labs };
    }),

  removeLabFromView: (key) =>
    set((state) => ({
      activeLabKeys: state.activeLabKeys.filter((k) => k !== key),
    })),

  loadDefaultPanel: (panelName) =>
    set((_state) => ({
      activeLabKeys: DEFAULT_PANEL_KEYS[panelName] ?? [],
    })),

  // ── Presets ───────────────────────────────────────────────────────────────
  saveCurrentViewAsPreset: (name) => {
    const preset: LabPreset = {
      id:      uuid(),
      name,
      labKeys: [...get().activeLabKeys],
    };
    set((state) => ({ userPresets: [...state.userPresets, preset] }));

    // Fire-and-forget DB write — import lazily to avoid circular dep with db.ts
    import("../shared/api/db").then(({ insertLabPreset }) => {
      insertLabPreset(preset).catch((e) =>
        console.error("[useLabsStore] insertLabPreset failed:", e)
      );
    });

    return preset;
  },

  saveKeysAsPreset: (name, keys) => {
    const preset: LabPreset = {
      id:      uuid(),
      name,
      labKeys: [...keys],
    };
    set((state) => ({ userPresets: [...state.userPresets, preset] }));

    // Fire-and-forget DB write — import lazily to avoid circular dep with db.ts
    import("../shared/api/db").then(({ insertLabPreset }) => {
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

      // Ensure skeleton entries exist for any key that hasn't been seen before
      const labs = { ...state.labs };
      for (const key of preset.labKeys) {
        if (!labs[key]) {
          const catalog = GLOBAL_LAB_CATALOG[key];
          labs[key] = {
            current: "", historical: "",
            unit:      catalog?.defaultUnit ?? "",
            loincCode: catalog?.loinc       ?? "",
            loincName: catalog?.name        ?? key,
          };
        }
      }

      return { activeLabKeys: [...preset.labKeys], labs };
    }),

  loadPresets: (ids) =>
    set((state) => {
      const selected = state.userPresets.filter((p) => ids.includes(p.id));
      if (selected.length === 0) return state;

      // Union all labKeys preserving insertion order, deduplicated
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

      // Ensure skeleton LabEntry exists for every key
      const labs = { ...state.labs };
      for (const key of unionKeys) {
        if (!labs[key]) {
          const catalog = GLOBAL_LAB_CATALOG[key];
          labs[key] = {
            current: "", historical: "",
            unit:      catalog?.defaultUnit ?? "",
            loincCode: catalog?.loinc       ?? "",
            loincName: catalog?.name        ?? key,
          };
        }
      }

      return { activeLabKeys: unionKeys, labs };
    }),

  deletePreset: (presetId) => {
    set((state) => ({
      userPresets: state.userPresets.filter((p) => p.id !== presetId),
    }));

    import("../shared/api/db").then(({ deleteLabPreset }) => {
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
    useLabsStore.setState({ labs: defaultLabs });
    return;
  }

  const parsed = tryParse<Record<string, Record<string, unknown>>>(raw, {});

  // Up-migrate every entry to the new LabEntry shape
  const migrated: Labs = {};
  for (const [key, entry] of Object.entries(parsed)) {
    migrated[key] = migrateLabEntry(entry, key);
  }

  // Restore activeLabKeys to whatever keys have data, preserving order.
  // If the note has no populated labs, fall back to the boot default.
  const populatedKeys = Object.keys(migrated).filter(
    (k) => migrated[k].current !== "" || migrated[k].historical !== ""
  );

  useLabsStore.setState({
    labs: migrated,
    activeLabKeys: populatedKeys.length > 0
      ? populatedKeys
      : DEFAULT_PANEL_KEYS["Endocrine & Metabolic"],
  });
});

// Only persist populated entries — keeps the DB column lean.
registerDomainGetter("labs", () =>
  compactLabs(useLabsStore.getState().labs)
);
