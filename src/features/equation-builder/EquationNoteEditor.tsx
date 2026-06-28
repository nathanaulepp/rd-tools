import { useState } from "react";
import { useEquationEngineStore } from "../../stores/useEquationEngineStore";
import type { CustomEquationNote, ConditionId } from "../../types/equationEngine";

interface EquationNoteEditorProps {
  equationId?: string;
  conditionId?: string;
  notes: CustomEquationNote[];
}

export default function EquationNoteEditor({
  equationId,
  conditionId,
  notes,
}: EquationNoteEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  // Local state for editing note texts to avoid constant database writes
  const [editingTexts, setEditingTexts] = useState<Record<string, string>>({});

  const handleAddConfirm = async () => {
    const text = newNoteText.trim();
    if (!text) {
      setIsAdding(false);
      return;
    }

    if (equationId) {
      await useEquationEngineStore.getState().addEquationNote(equationId, text);
    } else if (conditionId) {
      await useEquationEngineStore.getState().addConditionNote(conditionId as ConditionId, text);
    }

    setNewNoteText("");
    setIsAdding(false);
  };

  const handleBlur = async (note: CustomEquationNote, val: string) => {
    const text = val.trim();
    if (!text) {
      // If cleared, delete the note
      await useEquationEngineStore.getState().deleteEquationNote(note.id);
      return;
    }

    if (note.noteText === text) return;

    // Delete existing note and recreate with new text
    await useEquationEngineStore.getState().deleteEquationNote(note.id);
    if (equationId) {
      await useEquationEngineStore.getState().addEquationNote(equationId, text);
    } else if (conditionId) {
      await useEquationEngineStore.getState().addConditionNote(conditionId as ConditionId, text);
    }

    // Clean up local editing state
    setEditingTexts(prev => {
      const next = { ...prev };
      delete next[note.id];
      return next;
    });
  };

  const handleDelete = async (noteId: string) => {
    await useEquationEngineStore.getState().deleteEquationNote(noteId);
  };

  if (!isExpanded) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {notes.length > 0 ? (
          <span
            onClick={() => setIsExpanded(true)}
            style={{
              background: "#f0f9ff",
              color: "#0369a1",
              borderRadius: "12px",
              padding: "2px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              border: "1px solid #bae6fd",
            }}
          >
            📋 {notes.length} note{notes.length > 1 ? "s" : ""}
          </span>
        ) : (
          <span
            onClick={() => setIsExpanded(true)}
            style={{
              color: "#0ea5e9",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
            }}
            onMouseOver={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseOut={e => e.currentTarget.style.textDecoration = "none"}
          >
            ＋ Add note
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      borderLeft: "2px solid #bae6fd",
      paddingLeft: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}>
      {/* Header with collapse button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
          Guidance Notes ({notes.length})
        </span>
        <button
          onClick={() => {
            setIsExpanded(false);
            setIsAdding(false);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "0.68rem",
            cursor: "pointer",
            fontWeight: 700,
          }}
          onMouseOver={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseOut={e => e.currentTarget.style.textDecoration = "none"}
        >
          Collapse
        </button>
      </div>

      {/* Notes List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {notes.map(note => {
          const currentVal = editingTexts[note.id] ?? note.noteText;
          return (
            <div key={note.id} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <input
                type="text"
                value={currentVal}
                onChange={e => setEditingTexts(prev => ({ ...prev, [note.id]: e.target.value }))}
                onBlur={e => handleBlur(note, e.target.value)}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  fontSize: "0.78rem",
                  color: "#334155",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => handleDelete(note.id)}
                title="Delete note"
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  padding: "2px 4px",
                }}
                onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add note controller */}
      {isAdding ? (
        <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
          <input
            type="text"
            value={newNoteText}
            onChange={e => setNewNoteText(e.target.value)}
            placeholder="Type guidance note..."
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleAddConfirm();
              if (e.key === "Escape") {
                setNewNoteText("");
                setIsAdding(false);
              }
            }}
            style={{
              flex: 1,
              padding: "4px 6px",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              fontSize: "0.78rem",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleAddConfirm}
            title="Confirm"
            style={{
              background: "#22c55e",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            ✓
          </button>
          <button
            onClick={() => {
              setNewNoteText("");
              setIsAdding(false);
            }}
            title="Cancel"
            style={{
              background: "#94a3b8",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            background: "none",
            border: "none",
            color: "#0ea5e9",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 700,
            textAlign: "left",
            padding: "2px 0",
            display: "inline-flex",
            alignItems: "center",
          }}
          onMouseOver={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseOut={e => e.currentTarget.style.textDecoration = "none"}
        >
          ＋ Add note
        </button>
      )}
    </div>
  );
}
