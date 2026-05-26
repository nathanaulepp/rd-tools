// src/pages/NoteListPage.tsx
import { useState, useEffect, useMemo, CSSProperties } from "react";
import { 
  getAllNotes, 
  createRevision,
  deleteNote,
  NoteWithPatient, 
  Patient, 
  Note 
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

export default function NoteListPage({ handleExitToStart, onOpenNote }: NoteListPageProps) {
  const [allNotes, setAllNotes] = useState<NoteWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await getAllNotes();
      setAllNotes(data);
    } catch (e) {
      console.error("Failed to load notes:", e);
    } finally {
      setLoading(false);
    }
  };

  // Group notes by patient
  const patientGroups = useMemo(() => {
    const groups: Record<string, PatientGroup> = {};
    
    allNotes.forEach(note => {
      if (!groups[note.patient_id]) {
        groups[note.patient_id] = {
          id: note.patient_id,
          first_name: note.first_name,
          last_name: note.last_name,
          dob: note.dob,
          mrn: note.mrn,
          notes: []
        };
      }
      groups[note.patient_id].notes.push(note);
    });

    // Convert to array and sort by last name
    return Object.values(groups).sort((a, b) => 
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    );
  }, [allNotes]);

  const togglePatient = (patientId: string) => {
    const next = new Set(expandedPatients);
    if (next.has(patientId)) next.delete(patientId);
    else next.add(patientId);
    setExpandedPatients(next);
  };

  const handleResume = (n: NoteWithPatient) => {
    const patient: Patient = {
      id:         n.patient_id,
      first_name: n.first_name,
      last_name:  n.last_name,
      dob:        n.dob,
      sex:        "", 
      mrn:        n.mrn,
      languages:  "",
      created_at: ""
    };
    onOpenNote(n.patient_id, n.id, patient, n);
  };

  const handleCreateRevision = async (originalNote: NoteWithPatient) => {
    setActionLoading(originalNote.id);
    try {
      const newDraft = await createRevision(originalNote.id);
      if (newDraft) {
        handleResume({
          ...newDraft,
          first_name: originalNote.first_name,
          last_name:  originalNote.last_name,
          dob:        originalNote.dob,
          mrn:        originalNote.mrn
        });
      }
    } catch (e) {
      console.error("Revision failed:", e);
      alert("Failed to create revision. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setActionLoading(noteId);
    try {
      await deleteNote(noteId);
      setAllNotes(allNotes.filter(n => n.id !== noteId));
      setNoteToDelete(null);
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete note. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <button style={styles.backBtn} onClick={handleExitToStart}>← Back to Home</button>
          <h2 style={styles.title}>Clinical Documentation History</h2>
          <p style={styles.subtitle}>Review or manage patient records</p>
        </div>
      </header>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loadingState}>
            <div className="spinner" style={styles.spinner}></div>
            <p>Loading clinical records...</p>
          </div>
        ) : patientGroups.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📝</span>
            <h3>No records found</h3>
            <p>Once you create and save notes, they will appear here grouped by patient.</p>
            <button style={styles.btnPrimary} onClick={handleExitToStart}>Create Your First Note</button>
          </div>
        ) : (
          <div style={styles.groupList}>
            {patientGroups.map((group) => (
              <div key={group.id} style={styles.patientCard}>
                <div 
                  style={styles.patientHeader} 
                  onClick={() => togglePatient(group.id)}
                >
                  <div style={styles.patientInfo}>
                    <span style={styles.expandIcon}>
                      {expandedPatients.has(group.id) ? "▼" : "▶"}
                    </span>
                    <span style={styles.patientName}>
                      {group.last_name}, {group.first_name}
                    </span>
                    <span style={styles.patientMeta}>
                      MRN: {group.mrn || "---"} · DOB: {group.dob}
                    </span>
                  </div>
                  <div style={styles.noteCountBadge}>
                    {group.notes.length} {group.notes.length === 1 ? "Note" : "Notes"}
                  </div>
                </div>

                {expandedPatients.has(group.id) && (
                  <div style={styles.notesList}>
                    {group.notes.map((n) => (
                      <div key={n.id} style={styles.noteRow}>
                        <div style={styles.noteMainInfo}>
                          <div style={styles.noteDateBox}>
                            <span style={styles.noteDate}>{n.note_date || "---"}</span>
                            <span style={styles.noteVersion}>v{n.version}</span>
                          </div>
                          <span style={{
                            ...styles.badge,
                            ...(n.status === "submitted" ? styles.badgeSuccess : styles.badgeDraft)
                          }}>
                            {n.status === "submitted" ? "✓ Submitted" : "Draft"}
                          </span>
                        </div>

                        <div style={styles.noteActions}>
                          {n.status === "draft" ? (
                            <button 
                              style={styles.actionBtn} 
                              onClick={() => handleResume(n)}
                              disabled={!!actionLoading}
                            >
                              Resume Draft →
                            </button>
                          ) : (
                            <>
                              <button 
                                style={styles.actionBtnSecondary} 
                                onClick={() => handleResume(n)}
                                disabled={!!actionLoading}
                              >
                                View
                              </button>
                              <button 
                                style={styles.actionBtnPrimary}
                                onClick={() => handleCreateRevision(n)}
                                disabled={!!actionLoading}
                              >
                                {actionLoading === n.id ? "..." : "Revise"}
                              </button>
                            </>
                          )}
                          
                          {noteToDelete === n.id ? (
                            <div style={styles.confirmDelete}>
                              <span style={styles.confirmText}>Delete?</span>
                              <button 
                                style={styles.confirmBtn} 
                                onClick={() => handleDeleteNote(n.id)}
                              >
                                Yes
                              </button>
                              <button 
                                style={styles.cancelBtn} 
                                onClick={() => setNoteToDelete(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button 
                              style={styles.deleteBtn}
                              onClick={() => setNoteToDelete(n.id)}
                              title="Delete Note"
                              disabled={!!actionLoading}
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { minHeight: "100vh", background: "#f8fafc", paddingBottom: "3rem" },
  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "1.5rem 2rem" },
  headerTop: { maxWidth: "1000px", margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, padding: 0, marginBottom: "0.75rem", display: "block" },
  title: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "0.9rem", color: "#64748b" },
  
  content: { maxWidth: "1000px", margin: "2rem auto", padding: "0 2rem" },
  
  loadingState: { textAlign: "center", padding: "4rem 0", color: "#64748b" },
  spinner: { width: "30px", height: "30px", border: "3px solid #e2e8f0", borderTopColor: "#3498db", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 1s linear infinite" },
  
  emptyState: { textAlign: "center", padding: "5rem 2rem", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" },
  emptyIcon: { fontSize: "3rem", display: "block", marginBottom: "1rem" },
  
  groupList: { display: "flex", flexDirection: "column", gap: "1rem" },
  patientCard: { background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.04)", overflow: "hidden" },
  patientHeader: { padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "background 0.2s" },
  patientInfo: { display: "flex", alignItems: "center", gap: "1rem" },
  expandIcon: { fontSize: "0.7rem", color: "#94a3b8", width: "1rem" },
  patientName: { fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" },
  patientMeta: { fontSize: "0.85rem", color: "#64748b" },
  noteCountBadge: { background: "#f1f5f9", color: "#475569", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 },

  notesList: { background: "#fafafa", borderTop: "1px solid #f1f5f9" },
  noteRow: { padding: "1rem 1.5rem 1rem 3.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  noteMainInfo: { display: "flex", alignItems: "center", gap: "1.5rem" },
  noteDateBox: { display: "flex", flexDirection: "column" },
  noteDate: { fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" },
  noteVersion: { fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700 },
  
  badge: { padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700 },
  badgeDraft: { background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba" },
  badgeSuccess: { background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" },
  
  noteActions: { display: "flex", gap: "0.5rem", alignItems: "center" },
  actionBtn: { background: "#3498db", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  actionBtnPrimary: { background: "#0f172a", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  actionBtnSecondary: { background: "white", color: "#475569", border: "1px solid #e2e8f0", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  
  deleteBtn: { background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "1rem", padding: "0.25rem", transition: "color 0.2s" },
  confirmDelete: { display: "flex", alignItems: "center", gap: "0.4rem", background: "#fee2e2", padding: "0.2rem 0.5rem", borderRadius: "6px" },
  confirmText: { fontSize: "0.7rem", color: "#b91c1c", fontWeight: 700 },
  confirmBtn: { background: "#ef4444", color: "white", border: "none", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" },
  cancelBtn: { background: "white", color: "#475569", border: "1px solid #e2e8f0", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" },

  btnPrimary: { marginTop: "1.5rem", background: "#3498db", color: "#fff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" },
};
