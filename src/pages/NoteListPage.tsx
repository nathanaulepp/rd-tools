// src/pages/NoteListPage.tsx
// Phase 5: Two-view NoteListPage
//   • By Patient: expandable patient rows, notes nested underneath
//   • By Date: flat chronological table — Date | Patient | Status | Version | Actions
// Both views: resume draft, view submitted, revise submitted, delete note

import { useState, useEffect, useMemo, CSSProperties } from "react";
import {
  getAllNotes,
  createRevision,
  deleteNote,
  NoteWithPatient,
  Patient,
  Note,
} from "../shared/api/db";

interface NoteListPageProps {
  handleExitToStart: () => void;
  onOpenNote: (patientId: string, noteId: string, patient: Patient, note: Note) => void;
}

interface PatientGroup {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  mrn: string;
  notes: NoteWithPatient[];
}

type ViewMode = "patient" | "date";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPatient(n: NoteWithPatient): Patient {
  return {
    id:         n.patient_id,
    first_name: n.first_name,
    last_name:  n.last_name,
    dob:        n.dob,
    sex:        n.sex || "",
    mrn:        n.mrn,
    languages:  "",
    created_at: "",
  };
}

function StatusBadge({ status }: { status: string }) {
  const isSubmitted = status === "submitted";
  return (
    <span className={isSubmitted ? "badge-submitted" : "badge-draft"} style={{
      padding: "0.2rem 0.55rem",
      borderRadius: "6px",
      fontSize: "0.68rem",
      fontWeight: 700,
    }}>
      {isSubmitted ? "✓ Submitted" : "Draft"}
    </span>
  );
}

// ─── Action buttons shared between views ──────────────────────────────────────

interface NoteActionsProps {
  note: NoteWithPatient;
  actionLoading: string | null;
  noteToDelete: string | null;
  onResume: (n: NoteWithPatient) => void;
  onRevise: (n: NoteWithPatient) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

function NoteActions({
  note, actionLoading, noteToDelete,
  onResume, onRevise, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: NoteActionsProps) {
  const busy = !!actionLoading;

  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
      {note.status === "draft" ? (
        <button className="btn-primary" style={{...s.actionBtn, padding: "0.35rem 0.75rem"}} onClick={() => onResume(note)} disabled={busy}>
          Resume Draft →
        </button>
      ) : (
        <>
          <button className="btn-secondary" style={s.actionBtnSecondary} onClick={() => onResume(note)} disabled={busy}>
            View
          </button>
          <button className="btn-primary" style={{...s.actionBtnPrimary, padding: "0.35rem 0.75rem"}} onClick={() => onRevise(note)} disabled={busy}>
            {actionLoading === note.id ? "…" : "Revise"}
          </button>
        </>
      )}

      {noteToDelete === note.id ? (
        <div style={s.confirmDelete}>
          <span className="confirmText" style={s.confirmText}>Delete?</span>
          <button style={s.confirmBtn} onClick={() => onDeleteConfirm(note.id)}>Yes</button>
          <button className="btn-secondary" style={{...s.cancelBtn, padding: "0.2rem 0.4rem"}} onClick={onDeleteCancel}>No</button>
        </div>
      ) : (
        <button
          className="delete-btn"
          style={s.deleteBtn}
          onClick={() => onDeleteRequest(note.id)}
          title="Delete Note"
          disabled={busy}
        >
          🗑
        </button>
      )}
    </div>
  );
}

// ─── By Patient View ──────────────────────────────────────────────────────────

interface ByPatientViewProps {
  patientGroups: PatientGroup[];
  actionLoading: string | null;
  noteToDelete: string | null;
  onResume: (n: NoteWithPatient) => void;
  onRevise: (n: NoteWithPatient) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

function ByPatientView({
  patientGroups, actionLoading, noteToDelete,
  onResume, onRevise, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: ByPatientViewProps) {
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(expandedPatients);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedPatients(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      {patientGroups.map(group => (
        <div key={group.id} className="patient-card" style={s.patientCard}>
          {/* Patient header row */}
          <div style={s.patientHeader} onClick={() => toggle(group.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span className="text-muted" style={{ fontSize: "0.7rem", width: "1rem" }}>
                {expandedPatients.has(group.id) ? "▼" : "▶"}
              </span>
              <span className="title" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                {group.last_name}, {group.first_name}
              </span>
              <span className="subtitle" style={{ fontSize: "0.85rem" }}>
                MRN: {group.mrn || "---"} · DOB: {group.dob}
              </span>
            </div>
            <span className="noteCountBadge" style={s.noteCountBadge}>
              {group.notes.length} {group.notes.length === 1 ? "Note" : "Notes"}
            </span>
          </div>

          {/* Notes list */}
          {expandedPatients.has(group.id) && (
            <div style={{ background: "var(--bg-alt, #fafafa)", borderTop: "1px solid var(--border, #f1f5f9)" }}>
              {group.notes.map(n => (
                <div key={n.id} className="note-row" style={s.noteRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                    {/* Tree indent */}
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #cbd5e1)", paddingLeft: "2.5rem" }}>└──</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="note-date-text" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        {n.note_date || "---"}
                      </span>
                      <span className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                        v{n.version}
                        {n.parent_note_id ? " (revision)" : ""}
                      </span>
                    </div>
                    <StatusBadge status={n.status} />
                  </div>

                  <NoteActions
                    note={n}
                    actionLoading={actionLoading}
                    noteToDelete={noteToDelete}
                    onResume={onResume}
                    onRevise={onRevise}
                    onDeleteRequest={onDeleteRequest}
                    onDeleteConfirm={onDeleteConfirm}
                    onDeleteCancel={onDeleteCancel}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── By Date View ─────────────────────────────────────────────────────────────

interface ByDateViewProps {
  allNotes: NoteWithPatient[];
  actionLoading: string | null;
  noteToDelete: string | null;
  onResume: (n: NoteWithPatient) => void;
  onRevise: (n: NoteWithPatient) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

function ByDateView({
  allNotes, actionLoading, noteToDelete,
  onResume, onRevise, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: ByDateViewProps) {
  return (
    <div className="note-table" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border, #e2e8f0)" }}>
            {["Date", "Patient", "Status", "Version", "Actions"].map(h => (
              <th key={h} style={{
                padding: "0.75rem 1rem",
                textAlign: "left",
                fontWeight: 700,
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allNotes.map((n, i) => (
            <tr
              key={n.id}
              className={i % 2 === 0 ? "table-row" : "table-row-alt"}
              style={{
                borderBottom: "1px solid var(--border, #f1f5f9)",
              }}
            >
              <td className="note-date-text" style={{ padding: "0.75rem 1rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                {n.note_date || "---"}
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <span className="title" style={{ fontWeight: 600 }}>{n.last_name}, {n.first_name}</span>
                {n.mrn && (
                  <span className="subtitle" style={{ display: "block", fontSize: "0.72rem" }}>
                    MRN: {n.mrn}
                  </span>
                )}
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <StatusBadge status={n.status} />
              </td>
              <td className="subtitle" style={{ padding: "0.75rem 1rem", fontSize: "0.82rem" }}>
                v{n.version}
                {n.parent_note_id && (
                  <span className="text-muted" style={{ display: "block", fontSize: "0.68rem" }}>revision</span>
                )}
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <NoteActions
                  note={n}
                  actionLoading={actionLoading}
                  noteToDelete={noteToDelete}
                  onResume={onResume}
                  onRevise={onRevise}
                  onDeleteRequest={onDeleteRequest}
                  onDeleteConfirm={onDeleteConfirm}
                  onDeleteCancel={onDeleteCancel}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NoteListPage({ handleExitToStart, onOpenNote }: NoteListPageProps) {
  const [allNotes, setAllNotes]       = useState<NoteWithPatient[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete]   = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<ViewMode>("patient");

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      setAllNotes(await getAllNotes());
    } catch (e) {
      console.error("Failed to load notes:", e);
    } finally {
      setLoading(false);
    }
  };

  // Group by patient (for By Patient view)
  const patientGroups = useMemo<PatientGroup[]>(() => {
    const groups: Record<string, PatientGroup> = {};
    allNotes.forEach(n => {
      if (!groups[n.patient_id]) {
        groups[n.patient_id] = {
          id: n.patient_id,
          first_name: n.first_name,
          last_name: n.last_name,
          dob: n.dob,
          mrn: n.mrn,
          notes: [],
        };
      }
      groups[n.patient_id].notes.push(n);
    });
    return Object.values(groups).sort((a, b) =>
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    );
  }, [allNotes]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleResume = (n: NoteWithPatient) => {
    onOpenNote(n.patient_id, n.id, buildPatient(n), n);
  };

  const handleRevise = async (original: NoteWithPatient) => {
    setActionLoading(original.id);
    try {
      const newDraft = await createRevision(original.id);
      if (newDraft) {
        onOpenNote(original.patient_id, newDraft.id, buildPatient(original), newDraft);
      }
    } catch (e) {
      console.error("Revision failed:", e);
      alert("Failed to create revision. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async (noteId: string) => {
    setActionLoading(noteId);
    try {
      await deleteNote(noteId);
      setAllNotes(prev => prev.filter(n => n.id !== noteId));
      setNoteToDelete(null);
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete note. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Shared action props ───────────────────────────────────────────────────────
  const actionProps = {
    actionLoading,
    noteToDelete,
    onResume: handleResume,
    onRevise: handleRevise,
    onDeleteRequest: (id: string) => setNoteToDelete(id),
    onDeleteConfirm: handleDeleteConfirm,
    onDeleteCancel: () => setNoteToDelete(null),
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="note-list-container" style={s.container}>
      <header className="header" style={s.header}>
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={handleExitToStart}>← Back to Home</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className="title" style={s.title}>Clinical Documentation History</h2>
              <p className="subtitle" style={s.subtitle}>Review or manage patient records</p>
            </div>

            {/* View toggle */}
            {!loading && allNotes.length > 0 && (
              <div className="toggleWrap" style={s.toggleWrap}>
                {(["patient", "date"] as ViewMode[]).map(m => (
                  <button
                    key={m}
                    className={`toggleBtn ${viewMode === m ? "toggleBtnActive" : ""}`}
                    onClick={() => setViewMode(m)}
                    style={s.toggleBtn}
                  >
                    {m === "patient" ? "👤 By Patient" : "📅 By Date"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={s.content}>
        {loading ? (
          <div style={s.centeredState}>
            <div style={s.spinner} />
            <p className="subtitle">Loading clinical records…</p>
          </div>
        ) : allNotes.length === 0 ? (
          <div className="emptyState" style={s.emptyState}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>📝</span>
            <h3 className="title" style={{ margin: "0 0 0.5rem" }}>No records found</h3>
            <p className="subtitle" style={{ margin: "0 0 1.5rem" }}>
              Once you create and save notes, they will appear here.
            </p>
            <button className="btn-primary" style={s.btnPrimary} onClick={handleExitToStart}>
              Create Your First Note
            </button>
          </div>
        ) : viewMode === "patient" ? (
          <ByPatientView patientGroups={patientGroups} {...actionProps} />
        ) : (
          <ByDateView allNotes={allNotes} {...actionProps} />
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  container:   { minHeight: "100vh", paddingBottom: "3rem" },
  header:      { padding: "1.5rem 2rem" },
  headerInner: { maxWidth: "1000px", margin: "0 auto" },
  backBtn:     { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, padding: 0, marginBottom: "0.75rem", display: "block" },
  title:       { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800 },
  subtitle:    { margin: 0, fontSize: "0.9rem" },

  toggleWrap:      { display: "flex", padding: "3px", borderRadius: "10px", gap: "2px" },
  toggleBtn:       { border: "none", background: "transparent", padding: "0.35rem 0.9rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },

  content:     { maxWidth: "1000px", margin: "2rem auto", padding: "0 2rem" },

  centeredState: { textAlign: "center", padding: "4rem 0" },
  spinner:       { width: "30px", height: "30px", border: "3px solid var(--border, #e2e8f0)", borderTopColor: "#3498db", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 1s linear infinite" },
  emptyState:    { textAlign: "center", padding: "5rem 2rem", borderRadius: "16px", border: "1px solid var(--border, #e2e8f0)" },

  // Patient card (By Patient view)
  patientCard:    { borderRadius: "12px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 2px 4px rgba(0,0,0,0.04)", overflow: "hidden" },
  patientHeader:  { padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" },
  noteCountBadge: { background: "var(--bg-color, #f1f5f9)", color: "var(--text-muted, #475569)", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 },
  noteRow:        { padding: "0.85rem 1.5rem", borderBottom: "1px solid var(--border, #f1f5f9)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" },

  // Action buttons
  actionBtn:          { color: "#fff", border: "none", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  actionBtnPrimary:   { color: "#fff", border: "none", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  actionBtnSecondary: { padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  deleteBtn:          { background: "none", border: "none", color: "var(--text-muted, #cbd5e1)", cursor: "pointer", fontSize: "1rem", padding: "0.2rem" },
  confirmDelete:      { display: "flex", alignItems: "center", gap: "0.4rem", background: "#fee2e2", padding: "0.2rem 0.5rem", borderRadius: "6px" },
  confirmText:        { fontSize: "0.7rem", color: "#b91c1c", fontWeight: 700 },
  confirmBtn:         { background: "#ef4444", color: "#fff", border: "none", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" },
  cancelBtn:          { border: "1px solid var(--border, #e2e8f0)", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" },

  btnPrimary: { color: "#fff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" },
};