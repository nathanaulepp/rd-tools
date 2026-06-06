// src/features/intervention/implementation/LeafNoteMap.tsx
//
// Renders one row per selected leaf: the label + a notes textarea.
// Empty when nothing is selected.

import React from "react";
import { useInterventionStore } from "../../../stores/useInterventionStore";

export default function LeafNoteMap() {
  const { intervention, toggleLeaf, setLeafNote } = useInterventionStore();
  const { selected, notes } = intervention.ndImplementation;

  if (selected.length === 0) {
    return (
      <div
        style={{
          padding: "1rem",
          fontSize: "0.8rem",
          color: "#94a3b8",
          fontStyle: "italic",
          textAlign: "center",
          border: "1px dashed #e2e8f0",
          borderRadius: "8px",
          marginTop: "0.75rem",
        }}
      >
        No interventions selected. Use the navigator above to select actions.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "0.25rem",
        }}
      >
        Selected interventions &amp; notes ({selected.length})
      </div>

      {selected.map((label) => (
        <div
          key={label}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* Label row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "7px 10px",
              background: "#e6f1fb",
              borderBottom: "1px solid #bfdbfe",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#0c447c",
                lineHeight: 1.4,
              }}
            >
              {label}
            </span>
            <button
              onClick={() => toggleLeaf(label)}
              title="Remove"
              style={{
                flexShrink: 0,
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "0.8rem",
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Notes textarea */}
          <textarea
            value={notes[label] ?? ""}
            onChange={(e) => setLeafNote(label, e.target.value)}
            placeholder="Add clinical notes for this intervention…"
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              border: "none",
              resize: "vertical",
              minHeight: "52px",
              padding: "7px 10px",
              fontSize: "0.8rem",
              fontFamily: "inherit",
              color: "#2c3e50",
              background: "#fff",
              outline: "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}