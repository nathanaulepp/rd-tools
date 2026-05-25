import { useState, useEffect, useRef, CSSProperties } from "react";
import { Patient, getAllPatients, deletePatient } from "../../shared/api/db";
import { Field } from "../../shared/ui/Field";
import { FormError } from "../../shared/ui/FormError";

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setSearchQuery(`${p.last_name}, ${p.first_name}`);
    setDropdownOpen(false);
    setShowDeleteConfirm(false);
  };

  const handleStartNote = () => {
    if (selectedPatient) {
      onSelect(selectedPatient);
    }
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    try {
      await deletePatient(selectedPatient.id);
      setAllPatients(allPatients.filter(p => p.id !== selectedPatient.id));
      setSelectedPatient(null);
      setSearchQuery("");
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error(e);
      setInternalError("Failed to delete patient record. Please try again.");
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
        <div style={styles.previewCard}>
          {[
            {
              label: "Name",
              value: `${selectedPatient.last_name}, ${selectedPatient.first_name}`,
            },
            { label: "DOB", value: selectedPatient.dob },
            { label: "Sex", value: selectedPatient.sex },
            { label: "MRN", value: selectedPatient.mrn },
            { label: "Languages", value: selectedPatient.languages },
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
          {loading ? "Opening…" : "Start New Note for This Patient →"}
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

