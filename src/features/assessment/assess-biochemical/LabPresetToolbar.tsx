// src/features/assessment/assess-biochemical/LabPresetToolbar.tsx
// Phase 3: Preset management toolbar — load saved templates, save current view.
// Reads/writes useLabsStore directly. No props.

import React, { useState } from "react";
import { useLabsStore } from "../../../stores/useLabsStore";
import LabSearchBar from "./LabSearchBar";

// Panel name → sub-domain sidebar label (B1–B9) mapping
const PANEL_OPTIONS: { label: string; panelName: string }[] = [
  { label: "B1 Endocrine & Metabolic",      panelName: "Endocrine & Metabolic" },
  { label: "B2 Renal & Urinary",            panelName: "Renal & Urinary" },
  { label: "B3 Chemistry & Electrolytes",   panelName: "Chemistry & Electrolytes" },
  { label: "B4 Hematology & Iron",          panelName: "Hematology & Iron" },
  { label: "B5 Hepatobiliary & Proteins",   panelName: "Hepatobiliary & Proteins" },
  { label: "B6 Micronutrient Status",       panelName: "Micronutrient Status" },
  { label: "B7 Digestive & Pancreatic",     panelName: "Digestive & Pancreatic" },
  { label: "B8 Blood Gas & Acute Care",     panelName: "Blood Gas & Acute Care" },
  { label: "B9 Physiological & Fluid",      panelName: "Physiological & Fluid" },
];

export default function LabPresetToolbar() {
  const {
    userPresets,
    activeLabKeys,
    saveCurrentViewAsPreset,
    loadPreset,
    deletePreset,
    loadDefaultPanel,
  } = useLabsStore();

  const [saveMode, setSaveMode]     = useState(false);
  const [presetName, setPresetName] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const handleSave = () => {
    const name = presetName.trim();
    if (!name) return;
    saveCurrentViewAsPreset(name);
    setPresetName("");
    setSaveMode(false);
  };

  const handleLoad = (id: string) => {
    if (!id) return;
    setSelectedId(id);
    loadPreset(id);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deletePreset(selectedId);
    setSelectedId("");
  };

  const handlePanelLoad = (panelName: string) => {
    loadDefaultPanel(panelName);
  };

  return (
    <div style={styles.wrapper}>
      {/* Row 1: Panel quick-load + preset picker */}
      <div style={styles.row}>
        {/* Default panel dropdown */}
        <select
          style={styles.select}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) handlePanelLoad(e.target.value);
            e.target.value = "";
          }}
          title="Load a standard clinical panel"
        >
          <option value="" disabled>Load standard panel…</option>
          {PANEL_OPTIONS.map((p) => (
            <option key={p.panelName} value={p.panelName}>
              {p.label}
            </option>
          ))}
        </select>

        {/* User preset picker */}
        {userPresets.length > 0 && (
          <>
            <select
              style={styles.select}
              value={selectedId}
              onChange={(e) => handleLoad(e.target.value)}
              title="Load a saved custom preset"
            >
              <option value="">My presets…</option>
              {userPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.labKeys.length} labs)
                </option>
              ))}
            </select>
            {selectedId && (
              <button
                onClick={handleDelete}
                style={styles.btnDanger}
                title="Delete selected preset"
              >
                🗑
              </button>
            )}
          </>
        )}

        {/* Save current view */}
        {!saveMode ? (
          <button
            onClick={() => setSaveMode(true)}
            style={styles.btnOutline}
            title={`Save current ${activeLabKeys.length} labs as a named preset`}
          >
            + Save view
          </button>
        ) : (
          <div style={styles.saveRow}>
            <input
              autoFocus
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") { setSaveMode(false); setPresetName(""); }
              }}
              placeholder="Preset name…"
              style={styles.nameInput}
              maxLength={48}
            />
            <button onClick={handleSave} style={styles.btnPrimary} disabled={!presetName.trim()}>
              Save
            </button>
            <button onClick={() => { setSaveMode(false); setPresetName(""); }} style={styles.btnOutline}>
              Cancel
            </button>
          </div>
        )}

        {/* Active count pill */}
        <span style={styles.countPill}>
          {activeLabKeys.length} lab{activeLabKeys.length !== 1 ? "s" : ""} active
        </span>
      </div>

      {/* Row 2: Search bar */}
      <div style={styles.searchRow}>
        <LabSearchBar />
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "10px 0 6px",
    marginBottom: "0.5rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
  },
  select: {
    padding: "4px 8px",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    fontSize: "0.8rem",
    background: "var(--white)",
    color: "var(--text-main)",
    cursor: "pointer",
    maxWidth: "220px",
  },
  saveRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  nameInput: {
    padding: "4px 8px",
    border: "1px solid var(--accent)",
    borderRadius: "6px",
    fontSize: "0.8rem",
    width: "160px",
    outline: "none",
  },
  btnOutline: {
    padding: "4px 10px",
    border: "1px solid var(--accent)",
    borderRadius: "6px",
    background: "transparent",
    color: "var(--accent)",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnPrimary: {
    padding: "4px 10px",
    border: "none",
    borderRadius: "6px",
    background: "var(--accent)",
    color: "#fff",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnDanger: {
    padding: "4px 8px",
    border: "1px solid var(--danger)",
    borderRadius: "6px",
    background: "transparent",
    color: "var(--danger)",
    fontSize: "0.82rem",
    cursor: "pointer",
  },
  countPill: {
    marginLeft: "auto",
    fontSize: "0.72rem",
    fontWeight: 700,
    background: "var(--bg-color)",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  },
};
