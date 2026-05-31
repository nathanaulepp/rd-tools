// src/widgets/ExitModal.tsx
// Extracted from CreateNotePage.tsx (Phase 3).
// Shown when the user wants to leave a draft note.

import React, { useState } from "react";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";

interface ExitModalProps {
  onClose: () => void;
  onConfirmExit: () => void;
  onDiscard: () => void;
}

export default function ExitModal({ onClose, onConfirmExit, onDiscard }: ExitModalProps) {
  useEscapeBackout(onClose);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  return (
    <div style={overlay}>
      <div style={panel}>
        {!showConfirmDiscard ? (
          <>
            <h3 style={title}>Exit Documentation?</h3>
            <p style={body}>
              Your progress has been automatically saved as a draft.
            </p>
            <div style={stack}>
              <button onClick={onConfirmExit} style={{ ...btn.primary, width: "100%" }}>
                Save Draft &amp; Exit
              </button>
              <button
                onClick={() => setShowConfirmDiscard(true)}
                style={{ ...btn.outline, color: "#e74c3c", border: "1px solid #e74c3c", width: "100%" }}
              >
                Discard &amp; Delete Note
              </button>
              <button onClick={onClose} style={{ ...btn.outline, border: "none", width: "100%" }}>
                Cancel (Stay here)
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ ...title, color: "#c0392b" }}>⚠️ Delete this note permanently?</h3>
            <p style={body}>
              This action cannot be undone. All data entered for this session will be lost.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowConfirmDiscard(false)} style={btn.outline}>
                Wait, Go Back
              </button>
              <button onClick={onDiscard} style={{ ...btn.primary, background: "#e74c3c" }}>
                Yes, Delete Permanently
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const panel: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  padding: "2rem",
  maxWidth: "420px",
  width: "90%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
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

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
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