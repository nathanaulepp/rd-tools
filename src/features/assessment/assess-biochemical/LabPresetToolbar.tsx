import React, { useState } from "react";
import { useLabsStore } from "../../../stores/useLabsStore";

export default function LabPresetToolbar() {
  const { userPresets, loadPresets, activeLabKeys } = useLabsStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const togglePreset = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApply = () => {
    if (selectedIds.length === 0) return;
    loadPresets(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div style={styles.wrapper}>
      {userPresets.length === 0 ? (
        <div style={styles.emptyMessage}>
          No templates saved — build one in Settings → 🧪 Chemistry Templates
        </div>
      ) : (
        <>
          <div style={styles.row}>
            {userPresets.map((preset) => (
              <label key={preset.id} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(preset.id)}
                  onChange={() => togglePreset(preset.id)}
                />
                <span>{preset.name}</span>
                <span style={styles.mutedCount}>({preset.labKeys.length})</span>
              </label>
            ))}
          </div>

          <div style={styles.buttonRow}>
            <button
              onClick={handleApply}
              disabled={selectedIds.length === 0}
              style={{
                ...styles.btnApply,
                background: selectedIds.length > 0 ? "var(--accent)" : "#e2e8f0",
                color: selectedIds.length > 0 ? "#fff" : "#94a3b8",
                cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
              }}
            >
              Apply Selected ({selectedIds.length})
            </button>

            <span style={styles.countPill}>
              {activeLabKeys.length} lab{activeLabKeys.length !== 1 ? "s" : ""} active
            </span>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    borderTop: "1px solid var(--border)",
    padding: "10px 0 6px",
    marginBottom: "0.5rem",
  },
  emptyMessage: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    padding: "0.5rem 0",
    textAlign: "center",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "var(--text-main)",
    background: "var(--bg-color)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "4px 10px",
  },
  mutedCount: {
    color: "var(--text-muted)",
    marginLeft: "2px",
  },
  buttonRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btnApply: {
    border: "none",
    borderRadius: "6px",
    padding: "5px 14px",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  countPill: {
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
