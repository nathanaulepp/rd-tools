// src/widgets/PatientHeader.tsx
// Phase 2: Receives patient + note as props. Demographics are read-only.
// Note date and admission date are editable and auto-save on change.

import React from "react";
import type { Patient, Note } from "../shared/api/db";
import { autosaveNote } from "../shared/api/db";

interface PatientHeaderProps {
  patient: Patient | null;
  note: Note | null;
  patientData: any;
  setPatientData: (d: any) => void;
  clinical: any;
}

export default function PatientHeader({
  patient,
  note,
  patientData,
  setPatientData,
  clinical,
}: PatientHeaderProps) {
  if (!patient) return null;

  const dob = patient.dob;
  const age = (() => {
    if (!dob || !patientData.noteDate) return "--";
    const ms = new Date(patientData.noteDate).getTime() - new Date(dob).getTime();
    if (isNaN(ms) || ms < 0) return "--";
    const days = ms / (1000 * 60 * 60 * 24);
    if (days < 730) {
      const mo = Math.floor(days / 30.4375);
      return `${mo} mo`;
    }
    return `${Math.floor(days / 365.25)} yr`;
  })();

  const handleDateChange = async (field: "noteDate" | "admissionDate", val: string) => {
    setPatientData({ ...patientData, [field]: val });
    if (!note?.id) return;
    const dbField = field === "noteDate" ? "note_date" : "admission_date";
    try {
      await autosaveNote(note.id, dbField, val);
    } catch (e) {
      console.error("Autosave failed:", e);
    }
  };

  // Vital signs chips
  const vitals: { label: string; value: string; unit?: string }[] = [
    { label: "HR", value: clinical?.hr || "--", unit: "bpm" },
    { label: "BP", value: clinical?.bp || "--", unit: "mmHg" },
    { label: "SpO₂", value: clinical?.spo2 || "--", unit: "%" },
    { label: "Temp", value: clinical?.temp || "--", unit: "°F" },
    { label: "RR", value: clinical?.rr || "--", unit: "bpm" },
  ];

  return (
    <div className="patient-header">
      {/* Demographics block (read-only) */}
      <div className="patient-info">
        <h2>
          {patient.last_name}, {patient.first_name}
        </h2>
        <p>
          DOB: {dob} · Age: {age}
          {patient.sex ? ` · ${patient.sex}` : ""}
          {patient.mrn ? ` · MRN: ${patient.mrn}` : ""}
          {patient.languages ? ` · ${patient.languages}` : ""}
        </p>
      </div>

      {/* Note Date (editable) */}
      <div className="vital-stat" style={{ minWidth: "120px" }}>
        <span className="label">Note Date</span>
        <input
          type="date"
          value={patientData.noteDate || ""}
          onChange={e => handleDateChange("noteDate", e.target.value)}
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            border: "none",
            background: "transparent",
            color: "var(--primary)",
            padding: 0,
            width: "100%",
          }}
        />
      </div>

      {/* Admission Date (editable) */}
      <div className="vital-stat" style={{ minWidth: "120px" }}>
        <span className="label">Admission Date</span>
        <input
          type="date"
          value={patientData.admissionDate || ""}
          onChange={e => handleDateChange("admissionDate", e.target.value)}
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            border: "none",
            background: "transparent",
            color: "var(--primary)",
            padding: 0,
            width: "100%",
          }}
        />
      </div>

      {/* Vital signs (from clinical state — live, read-only display) */}
      {vitals.map(v => (
        <div className="vital-stat" key={v.label}>
          <span className="label">{v.label}</span>
          <span className="value">
            {v.value}
            {v.value !== "--" && v.unit && <span>{v.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}