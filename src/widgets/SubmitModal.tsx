// src/widgets/SubmitModal.tsx
// Extracted from CreateNotePage.tsx (Phase 3).
// Handles the multi-step submit flow: confirm → saving → error | success.

import React from "react";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";

export type SubmitModalState = "confirm" | "saving" | "error" | "success";

interface SubmitModalProps {
  state: SubmitModalState;
  missingFields: string[];
  onConfirm: () => void;
  onClose: () => void;
}

export default function SubmitModal({
  state,
  missingFields,
  onConfirm,
  onClose,
}: SubmitModalProps) {
  useEscapeBackout(onClose);

  return (
    <div style={overlay}>
      <div style={panel}>
        {state === "confirm" && (
          <>
            <h3 style={title}>Submit Note?</h3>
            <p style={body}>
              All domains will be saved and the note marked as <strong>Submitted</strong>.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btn.outline}>Cancel</button>
              <button onClick={onConfirm} style={btn.primary}>Save &amp; Submit →</button>
            </div>
          </>
        )}

        {state === "saving" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💾</div>
            <p style={{ margin: 0, fontWeight: 600, color: "#2c3e50" }}>
              Saving and submitting…
            </p>
          </div>
        )}

        {state === "error" && (
          <>
            <h3 style={{ ...title, color: "#c0392b" }}>
              🚨 Cannot Submit — Missing Required Fields
            </h3>
            <ul
              style={{
                margin: "0 0 1.25rem",
                paddingLeft: "1.25rem",
                listStyle: "disc",
                color: "#c0392b",
                fontSize: "0.88rem",
                lineHeight: 1.8,
              }}
            >
              {missingFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", color: "#94a3b8" }}>
              These fields are set in the <strong>Patient Header</strong> or Patient Gate.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btn.primary}>OK, I'll Fix It</button>
            </div>
          </>
        )}

        {state === "success" && (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
            <h3 style={{ margin: "0 0 0.4rem", color: "#27ae60" }}>Note Submitted!</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
              The note has been saved and marked as <strong>Submitted</strong>.
            </p>
            <button onClick={onClose} style={{ ...btn.primary, background: "#27ae60" }}>
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const panel: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  padding: "2rem",
  maxWidth: "460px",
  width: "90%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const title: React.CSSProperties = {
  margin: "0 0 0.5rem",
  color: "#0f172a",
  fontSize: "1.1rem",
};

const body: React.CSSProperties = {
  margin: "0 0 1.5rem",
  fontSize: "0.88rem",
  color: "#64748b",
  lineHeight: 1.5,
};

const btn = {
  primary: {
    background: "#3498db",
    color: "#fff",
    border: "none",
    padding: "0.55rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  outline: {
    background: "transparent",
    color: "#3498db",
    border: "1px solid #3498db",
    padding: "0.55rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
};