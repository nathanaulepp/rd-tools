// src/pages/PatientGatePage.tsx
import { useState, CSSProperties } from "react";
import {
  createPatient,
  createNote,
  Patient,
  Note,
} from "../shared/api/db";
import { CreatePatientForm, CreatePatientData } from "../features/patient/CreatePatientForm";
import { PatientSearch } from "../features/patient/PatientSearch";

import { getLocalIsoDate } from "../shared/utils/date";

interface PatientGatePageProps {
  onEnterWorkspace: (patientId: string, noteId: string, patient: Patient, note: Note) => void;
  onCancel: () => void;
}

type GateMode = "choose" | "new" | "existing";

function today() {
  return getLocalIsoDate();
}

export default function PatientGatePage({ onEnterWorkspace, onCancel }: PatientGatePageProps) {
  const [mode, setMode] = useState<GateMode>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialFormData, setInitialFormData] = useState<Partial<CreatePatientData>>({});

  const handleCreateNew = async (data: CreatePatientData) => {
    setError("");
    setLoading(true);
    try {
      const patient = await createPatient({
        first_name: data.firstName.trim(),
        last_name:  data.lastName.trim(),
        dob:        data.dob,
        sex:        data.sex     || undefined,
        mrn:        data.mrn.trim()        || undefined,
        languages:  data.languages.trim()  || undefined,
      });
      const note = await createNote({
        patient_id:     patient.id,
        note_date:      today(),
        admission_date: today(),
      });
      onEnterWorkspace(patient.id, note.id, patient, note);
    } catch (e: any) {
      setError("Failed to create patient. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExisting = async (selectedPatient: Patient) => {
    setError("");
    setLoading(true);
    try {
      const note = await createNote({
        patient_id:     selectedPatient.id,
        note_date:      today(),
        admission_date: today(),
      });
      onEnterWorkspace(selectedPatient.id, note.id, selectedPatient, note);
    } catch (e: any) {
      setError("Failed to create note. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToCreate = (query: string) => {
    setInitialFormData({ lastName: query });
    setMode("new");
    setError("");
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onCancel}>← Back</button>
          <h2 style={styles.title}>Create New ADIME Note</h2>
          <p style={styles.subtitle}>Select a patient or create a new record to begin</p>
        </div>

        {mode === "choose" && (
          <div style={styles.choiceRow}>
            <button style={styles.choiceCard} onClick={() => { setMode("new"); setError(""); setInitialFormData({}); }}>
              <span style={styles.choiceIcon}>＋</span>
              <strong style={styles.choiceLabel}>New Patient</strong>
              <span style={styles.choiceDesc}>Create a new patient record and start a note</span>
            </button>
            <button style={styles.choiceCard} onClick={() => { setMode("existing"); setError(""); }}>
              <span style={styles.choiceIcon}>🔍</span>
              <strong style={styles.choiceLabel}>Existing Patient</strong>
              <span style={styles.choiceDesc}>Search the database and open a note</span>
            </button>
          </div>
        )}

        {mode === "new" && (
          <CreatePatientForm
            onSubmit={handleCreateNew}
            onCancel={() => { setMode("choose"); setError(""); }}
            loading={loading}
            error={error}
            initialData={initialFormData}
          />
        )}

        {mode === "existing" && (
          <PatientSearch
            onSelect={handleSelectExisting}
            onCancel={() => { setMode("choose"); setError(""); }}
            onNavigateToCreate={handleNavigateToCreate}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { minHeight: "100vh", background: "#f4f7f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", boxSizing: "border-box" },
  panel: { background: "#ffffff", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0,0,0,0.09)", width: "100%", maxWidth: "600px" },
  header: { padding: "1.5rem 2rem 1.25rem", borderBottom: "1px solid #e2e8f0", position: "relative" },
  backBtn: { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, padding: 0, marginBottom: "0.5rem", display: "block" },
  title: { margin: "0 0 0.2rem", fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "0.85rem", color: "#718096" },
  choiceRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "2rem" },
  choiceCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#fafafa", cursor: "pointer", textAlign: "center" },
  choiceIcon: { fontSize: "1.75rem", lineHeight: 1 },
  choiceLabel: { fontSize: "0.95rem", color: "#1e293b" },
  choiceDesc: { fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.4 },
};
