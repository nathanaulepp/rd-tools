import React from "react";
import { useNoteStore } from "../../stores/useNoteStore";

async function invokePdfExport() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("export_note_pdf");
  } catch (_e) {
    window.print();
  }
}

interface SummaryPatientBannerProps {
  handleExitToStart: () => void;
}

export default function SummaryPatientBanner({ handleExitToStart }: SummaryPatientBannerProps) {
  const { activePatient: patient, activeNote: note } = useNoteStore();

  if (!patient || !note) return null;

  return (
    <div style={{
      background: "#0f172a",
      color: "#fff",
      padding: "1rem 1.5rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100,
      marginBottom: "1.5rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold" }}>
          {patient.last_name}, {patient.first_name}
        </h1>
        <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
          <span><strong style={{ color: "#fff" }}>MRN:</strong> {patient.mrn || "N/A"}</span>
          <span><strong style={{ color: "#fff" }}>DOB:</strong> {patient.dob}</span>
          <span><strong style={{ color: "#fff" }}>Sex:</strong> {patient.sex || "N/A"}</span>
          <span><strong style={{ color: "#fff" }}>Note Date:</strong> {note.note_date || "---"}</span>
          <span><strong style={{ color: "#fff" }}>Admission:</strong> {note.admission_date || "---"}</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", background: "#334155", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
            v{note.version}
          </span>
          <span style={{ fontSize: "0.75rem", background: "#1e40af", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>
            SUBMITTED
          </span>
        </div>
      </div>
      
      <div className="screen-only" style={{ display: "flex", gap: "1rem" }}>
        <button 
          onClick={handleExitToStart}
          style={{ background: "transparent", color: "#94a3b8", border: "1px solid #475569", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer" }}
        >
          ← Back to Home
        </button>
        <button 
          onClick={invokePdfExport}
          style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          Export / Print
        </button>
      </div>
    </div>
  );
}
