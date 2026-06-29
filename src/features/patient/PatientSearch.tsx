import { useState, useEffect, useRef, CSSProperties } from "react";
import { Patient, Encounter, getAllPatients, deletePatient, getEncountersByPatient, deleteEncounter } from "../../shared/api/db.commands";
import { Field } from "../../shared/ui/Field";
import { FormError } from "../../shared/ui/FormError";
import { getLocalIsoDate } from "../../shared/utils/date";

interface PatientSearchProps {
  onSelect: (patient: Patient, admissionDate: string) => void;
  onCancel: () => void;
  onNavigateToCreate: (query: string) => void;
  loading: boolean;
  error?: string;
}

export const PatientSearch = ({
  onSelect,
  onCancel,
  onNavigateToCreate,
  loading,
  error: externalError,
}: PatientSearchProps) => {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [selectedAdmDate, setSelectedAdmDate] = useState<string>(getLocalIsoDate());
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [encounterToDelete, setEncounterToDelete] = useState<string | null>(null);
  const [internalError, setInternalError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAllPatients()
      .then(setAllPatients)
      .catch(() => setInternalError("Could not load patient list."));
  }, []);

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

  const handleSelectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setSearchQuery(`${p.last_name}, ${p.first_name}`);
    setDropdownOpen(false);
    setShowDeleteConfirm(false);

    try {
      const encs = await getEncountersByPatient(p.id);
      setEncounters(encs);
      // Default to latest admission if available, else today
      if (encs.length > 0) {
        setSelectedAdmDate(encs[0].admission_date);
      } else {
        setSelectedAdmDate(getLocalIsoDate());
      }
    } catch (e) {
      console.error("Failed to load encounters", e);
    }
  };

  const handleStartNote = () => {
    if (selectedPatient) {
      onSelect(selectedPatient, selectedAdmDate);
    }
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    try {
      await deletePatient(selectedPatient.id);
      setAllPatients(allPatients.filter(p => p.id !== selectedPatient.id));
      setSelectedPatient(null);
      setEncounters([]);
      setSearchQuery("");
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error(e);
      setInternalError("Failed to delete patient record. Please try again.");
    }
  };

  const handleDeleteEncounter = async (encounterId: string) => {
    try {
      await deleteEncounter(encounterId);
      setEncounters(encounters.filter(e => e.id !== encounterId));
      setEncounterToDelete(null);
      // If the selected admission date belonged to this encounter, reset to today
      const deleted = encounters.find(e => e.id === encounterId);
      if (deleted && selectedAdmDate === deleted.admission_date) {
        setSelectedAdmDate(getLocalIsoDate());
      }
    } catch (e) {
      console.error(e);
      setInternalError("Failed to delete encounter. Please try again.");
    }
  };

  const error = externalError || internalError;

  return (
    <div style={styles.formSection}>
      <button style={styles.modeBackBtn} onClick={onCancel}>
        ← Change selection
      </button>
      <h3 style={styles.formTitle}>Search Patients</h3>

      <div ref={dropdownRef} style={{ position: "relative", marginBottom: "1.5rem" }}>
        <Field label="Search by name or MRN" id="patientSearch">
          <input
            id="patientSearch"
            name="patientSearch"
            style={styles.input}
            type="text"
            value={searchQuery}
            autoFocus
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedPatient(null);
              setEncounters([]);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Last name, first name, or MRN…"
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
                  DOB: {p.dob}
                  {p.mrn ? ` · MRN: ${p.mrn}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {dropdownOpen && searchQuery.length > 0 && filteredPatients.length === 0 && (
          <div
            style={{
              ...styles.dropdown,
              padding: "0.75rem 1rem",
              color: "#718096",
              fontSize: "0.85rem",
            }}
          >
            No patients found —{" "}
            <button
              style={styles.inlineLink}
              onClick={() => onNavigateToCreate(searchQuery)}
            >
              create a new record instead?
            </button>
          </div>
        )}
      </div>

      {selectedPatient && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Patient Details */}
          <div style={styles.previewCard}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Patient Details</div>
            {[
              { label: "Name", value: `${selectedPatient.last_name}, ${selectedPatient.first_name}` },
              { label: "DOB", value: selectedPatient.dob },
              { label: "MRN", value: selectedPatient.mrn },
            ]
              .filter((r) => r.value)
              .map((r) => (
                <div key={r.label} style={styles.previewRow}>
                  <span style={styles.previewLabel}>{r.label}</span>
                  <span style={styles.previewValue}>{r.value}</span>
                </div>
              ))}

            <div style={styles.deleteZone}>
              {!showDeleteConfirm ? (
                <button
                  style={{ ...styles.btnSmall, ...styles.btnDangerOutline }}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Patient Record
                </button>
              ) : (
                <div style={styles.confirmRow}>
                  <span style={styles.confirmText}>Are you sure? This deletes all history for this patient.</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      style={{ ...styles.btnSmall, ...styles.btnDanger }}
                      onClick={handleDeletePatient}
                    >
                      Yes, Delete
                    </button>
                    <button
                      style={{ ...styles.btnSmall, ...styles.btnSecondary }}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admission / Encounter Context */}
          <div style={{ ...styles.previewCard, borderLeft: '4px solid #3498db' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3498db', textTransform: 'uppercase', marginBottom: '1rem' }}>Encounter Context</div>
            
            <Field label="Choose Admission Date">
              <select
                value={selectedAdmDate}
                onChange={(e) => setSelectedAdmDate(e.target.value)}
                style={{ ...styles.input, fontWeight: 700 }}
              >
                <optgroup label="New Admission">
                  <option value={getLocalIsoDate()}>Start New Admission (Today)</option>
                </optgroup>
                {encounters.length > 0 && (
                  <optgroup label="Continue Active Admission">
                    {encounters.map(e => (
                      <option key={e.id} value={e.admission_date}>
                        Admitted: {e.admission_date}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Field>

            {/* Per-encounter delete controls */}
            {encounters.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Delete an Admission
                </div>
                {encounters.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                      {e.admission_date}
                    </span>
                    {encounterToDelete === e.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 700 }}>Delete all notes?</span>
                        <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => handleDeleteEncounter(e.id)}>Yes</button>
                        <button style={{ ...styles.btnSmall, ...styles.btnSecondary }} onClick={() => setEncounterToDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        style={{ ...styles.btnSmall, ...styles.btnDangerOutline }}
                        onClick={() => setEncounterToDelete(e.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#718096', fontStyle: 'italic', lineHeight: 1.4 }}>
              {selectedAdmDate === getLocalIsoDate() && !encounters.find(e => e.admission_date === selectedAdmDate) 
                ? "This will start a fresh hospital encounter for today's date."
                : "Adding a follow-up note to the selected hospital stay."
              }
            </div>
          </div>
        </div>
      )}

      {error && <FormError message={error} />}

      <div style={styles.actions}>
        <button
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            opacity: loading || !selectedPatient ? 0.6 : 1,
            cursor: selectedPatient ? "pointer" : "not-allowed",
          }}
          onClick={handleStartNote}
          disabled={loading || !selectedPatient}
        >
          {loading ? "Opening…" : "Enter Clinical Workspace →"}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  formSection: { padding: "1.5rem 2rem 2rem" },
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
  formTitle: { margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#2c3e50" },
  input: {
    padding: "0.45rem 0.65rem",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "0.88rem",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#1e293b",
    background: "#fff",
  },
  actions: { display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" },
  btn: {
    padding: "0.6rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSmall: {
    padding: "0.35rem 0.75rem",
    borderRadius: "6px",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnPrimary: { background: "#3498db", color: "#fff" },
  btnDanger: { background: "#e74c3c", color: "#fff" },
  btnDangerOutline: { background: "none", border: "1px solid #e74c3c", color: "#e74c3c" },
  btnSecondary: { background: "#e2e8f0", color: "#475569" },
  deleteZone: {
    marginTop: "1.25rem",
    paddingTop: "0.75rem",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
  },
  confirmRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5rem",
  },
  confirmText: {
    fontSize: "0.72rem",
    color: "#e74c3c",
    fontWeight: 600,
    textAlign: "right",
  },
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
  dropdownName: { fontSize: "0.88rem", fontWeight: 600, color: "#1e293b" },
  dropdownMeta: { fontSize: "0.72rem", color: "#94a3b8" },
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
  previewValue: { fontSize: "0.88rem", fontWeight: 600, color: "#1e293b" },
};

