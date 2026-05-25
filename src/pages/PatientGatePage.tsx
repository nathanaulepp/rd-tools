// src/pages/PatientGatePage.tsx
// Phase 1: Patient / Note gate screen.
// Shown when the user clicks "Create New ADIME" on StartPage.
// Two paths:
//   • New Patient  → create_patient() → create_note() → enter workspace
//   • Existing     → search get_all_patients() → create_note() → enter workspace

import React, { useState, useEffect, useRef } from "react";
import {
  createPatient,
  createNote,
  getAllPatients,
  Patient,
} from "../shared/api/db";

interface PatientGatePageProps {
  /** Called when a patient + note have been created/selected and we're ready to enter the workspace. */
  onEnterWorkspace: (patientId: string, noteId: string, patient: Patient) => void;
  /** Back to StartPage */
  onCancel: () => void;
}

type GateMode = "choose" | "new" | "existing";

// ─── helpers ─────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PatientGatePage({ onEnterWorkspace, onCancel }: PatientGatePageProps) {
  const [mode, setMode] = useState<GateMode>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── New Patient form state ────────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    sex: "" as "" | "M" | "F",
    mrn: "",
    languages: "",
  });

  const updateNew = (field: string, val: string) =>
    setNewForm((f) => ({ ...f, [field]: val }));

  const handleCreateNew = async () => {
    if (!newForm.firstName.trim() || !newForm.lastName.trim() || !newForm.dob) {
      setError("First name, last name, and date of birth are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const patient = await createPatient({
        first_name: newForm.firstName.trim(),
        last_name: newForm.lastName.trim(),
        dob: newForm.dob,
        sex: newForm.sex || undefined,
        mrn: newForm.mrn.trim() || undefined,
        languages: newForm.languages.trim() || undefined,
      });
      const note = await createNote({
        patient_id: patient.id,
        note_date: today(),
        admission_date: today(),
      });
      onEnterWorkspace(patient.id, note.id, patient);
    } catch (e: any) {
      setError("Failed to create patient. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Existing Patient search state ─────────────────────────────────────────
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load patient list when switching to existing mode
  useEffect(() => {
    if (mode === "existing") {
      getAllPatients()
        .then(setAllPatients)
        .catch(() => setError("Could not load patient list."));
    }
  }, [mode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredPatients = allPatients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.last_name.toLowerCase().includes(q) ||
      p.first_name.toLowerCase().includes(q) ||
      (p.mrn && p.mrn.toLowerCase().includes(q))
    );
  });

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setSearchQuery(`${p.last_name}, ${p.first_name}`);
    setDropdownOpen(false);
  };

  const handleEnterExisting = async () => {
    if (!selectedPatient) {
      setError("Please select a patient.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const note = await createNote({
        patient_id: selectedPatient.id,
        note_date: today(),
        admission_date: today(),
      });
      onEnterWorkspace(selectedPatient.id, note.id, selectedPatient);
    } catch (e: any) {
      setError("Failed to create note. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onCancel}>← Back</button>
          <h2 style={styles.title}>Create New ADIME Note</h2>
          <p style={styles.subtitle}>Select a patient or create a new record to begin</p>
        </div>

        {/* Mode chooser */}
        {mode === "choose" && (
          <div style={styles.choiceRow}>
            <button style={styles.choiceCard} onClick={() => { setMode("new"); setError(""); }}>
              <span style={styles.choiceIcon}>＋</span>
              <strong style={styles.choiceLabel}>New Patient</strong>
              <span style={styles.choiceDesc}>Create a new patient record and start a note</span>
            </button>
            <button style={styles.choiceCard} onClick={() => { setMode("existing"); setError(""); }}>
              <span style={styles.choiceIcon}>🔍</span>
              <strong style={styles.choiceLabel}>Existing Patient</strong>
              <span style={styles.choiceDesc}>Search the database and open a new note</span>
            </button>
          </div>
        )}

        {/* ── New Patient Form ──────────────────────────────────────────── */}
        {mode === "new" && (
          <div style={styles.formSection}>
            <button style={styles.modeBackBtn} onClick={() => { setMode("choose"); setError(""); }}>
              ← Change selection
            </button>
            <h3 style={styles.formTitle}>New Patient Record</h3>

            <div style={styles.grid2}>
              <Field label="Last Name *">
                <input
                  style={styles.input}
                  type="text"
                  value={newForm.lastName}
                  onChange={(e) => updateNew("lastName", e.target.value)}
                  placeholder="e.g. Reyes"
                  autoFocus
                />
              </Field>
              <Field label="First Name *">
                <input
                  style={styles.input}
                  type="text"
                  value={newForm.firstName}
                  onChange={(e) => updateNew("firstName", e.target.value)}
                  placeholder="e.g. Maria"
                />
              </Field>
              <Field label="Date of Birth *">
                <input
                  style={styles.input}
                  type="date"
                  value={newForm.dob}
                  onChange={(e) => updateNew("dob", e.target.value)}
                />
              </Field>
              <Field label="Sex">
                <select
                  style={styles.input}
                  value={newForm.sex}
                  onChange={(e) => updateNew("sex", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </Field>
              <Field label="MRN (optional)">
                <input
                  style={styles.input}
                  type="text"
                  value={newForm.mrn}
                  onChange={(e) => updateNew("mrn", e.target.value)}
                  placeholder="e.g. 0012345"
                />
              </Field>
              <Field label="Languages (optional)">
                <input
                  style={styles.input}
                  type="text"
                  value={newForm.languages}
                  onChange={(e) => updateNew("languages", e.target.value)}
                  placeholder="e.g. Spanish, English"
                />
              </Field>
            </div>

            {error && <ErrorBanner message={error} />}

            <div style={styles.actions}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                onClick={handleCreateNew}
                disabled={loading}
              >
                {loading ? "Creating…" : "Create Patient & Start Note →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Existing Patient Search ───────────────────────────────────── */}
        {mode === "existing" && (
          <div style={styles.formSection}>
            <button style={styles.modeBackBtn} onClick={() => { setMode("choose"); setError(""); setSelectedPatient(null); setSearchQuery(""); }}>
              ← Change selection
            </button>
            <h3 style={styles.formTitle}>Search Patients</h3>

            <div ref={dropdownRef} style={{ position: "relative", marginBottom: "1.5rem" }}>
              <Field label="Search by name or MRN">
                <input
                  style={styles.input}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedPatient(null);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Last name, first name, or MRN…"
                  autoFocus
                />
              </Field>

              {dropdownOpen && filteredPatients.length > 0 && (
                <div style={styles.dropdown}>
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      style={styles.dropdownItem}
                      onClick={() => handleSelectPatient(p)}
                    >
                      <span style={styles.dropdownName}>
                        {p.last_name}, {p.first_name}
                      </span>
                      <span style={styles.dropdownMeta}>
                        DOB: {p.dob}{p.mrn ? ` · MRN: ${p.mrn}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {dropdownOpen && searchQuery.length > 0 && filteredPatients.length === 0 && (
                <div style={{ ...styles.dropdown, padding: "0.75rem 1rem", color: "#718096", fontSize: "0.85rem" }}>
                  No patients found — <button style={styles.inlineLink} onClick={() => { setMode("new"); setNewForm(f => ({ ...f, lastName: searchQuery })); setError(""); }}>create a new record instead?</button>
                </div>
              )}
            </div>

            {/* Pre-fill preview card */}
            {selectedPatient && (
              <div style={styles.previewCard}>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Name</span>
                  <span style={styles.previewValue}>{selectedPatient.last_name}, {selectedPatient.first_name}</span>
                </div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>DOB</span>
                  <span style={styles.previewValue}>{selectedPatient.dob}</span>
                </div>
                {selectedPatient.sex && (
                  <div style={styles.previewRow}>
                    <span style={styles.previewLabel}>Sex</span>
                    <span style={styles.previewValue}>{selectedPatient.sex}</span>
                  </div>
                )}
                {selectedPatient.mrn && (
                  <div style={styles.previewRow}>
                    <span style={styles.previewLabel}>MRN</span>
                    <span style={styles.previewValue}>{selectedPatient.mrn}</span>
                  </div>
                )}
                {selectedPatient.languages && (
                  <div style={styles.previewRow}>
                    <span style={styles.previewLabel}>Languages</span>
                    <span style={styles.previewValue}>{selectedPatient.languages}</span>
                  </div>
                )}
              </div>
            )}

            {error && <ErrorBanner message={error} />}

            <div style={styles.actions}>
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  opacity: (loading || !selectedPatient) ? 0.6 : 1,
                  cursor: selectedPatient ? "pointer" : "not-allowed",
                }}
                onClick={handleEnterExisting}
                disabled={loading || !selectedPatient}
              >
                {loading ? "Opening…" : "Start New Note for This Patient →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: "#fdf2f8",
      border: "1px solid #e74c3c",
      color: "#9d174d",
      padding: "0.6rem 1rem",
      borderRadius: "6px",
      fontSize: "0.82rem",
      fontWeight: 600,
      marginBottom: "1rem",
    }}>
      ⚠ {message}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: "100vh",
    background: "#f4f7f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    boxSizing: "border-box",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.09)",
    width: "100%",
    maxWidth: "600px",
    overflow: "hidden",
  },
  header: {
    padding: "1.5rem 2rem 1.25rem",
    borderBottom: "1px solid #e2e8f0",
    position: "relative",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#3498db",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: 0,
    marginBottom: "0.5rem",
    display: "block",
  },
  title: {
    margin: "0 0 0.2rem",
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#718096",
  },
  choiceRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    padding: "2rem",
  },
  choiceCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1.75rem 1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    background: "#fafafa",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
  },
  choiceIcon: {
    fontSize: "1.75rem",
    lineHeight: 1,
  },
  choiceLabel: {
    fontSize: "0.95rem",
    color: "#1e293b",
  },
  choiceDesc: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    lineHeight: 1.4,
  },
  formSection: {
    padding: "1.5rem 2rem 2rem",
  },
  modeBackBtn: {
    background: "none",
    border: "none",
    color: "#3498db",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: 0,
    marginBottom: "1rem",
    display: "block",
  },
  formTitle: {
    margin: "0 0 1.25rem",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#2c3e50",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  input: {
    padding: "0.45rem 0.65rem",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "0.88rem",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    color: "#1e293b",
    background: "#fff",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  },
  btn: {
    padding: "0.6rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnPrimary: {
    background: "#3498db",
    color: "#fff",
  },
  // Dropdown
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    zIndex: 200,
    maxHeight: "220px",
    overflowY: "auto",
  },
  dropdownItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    width: "100%",
    padding: "0.6rem 1rem",
    background: "none",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    textAlign: "left",
  },
  dropdownName: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  dropdownMeta: {
    fontSize: "0.72rem",
    color: "#94a3b8",
  },
  inlineLink: {
    background: "none",
    border: "none",
    color: "#3498db",
    cursor: "pointer",
    fontWeight: 600,
    padding: 0,
    fontSize: "inherit",
    textDecoration: "underline",
  },
  // Preview card
  previewCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "0.5rem",
  },
  previewRow: {
    display: "flex",
    gap: "1rem",
    paddingBottom: "0.35rem",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "0.35rem",
    alignItems: "baseline",
  },
  previewLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    minWidth: "72px",
  },
  previewValue: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#1e293b",
  },
};