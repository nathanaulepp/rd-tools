// src/widgets/PatientHeader.tsx
// Phase 5: Reads all state directly from stores — zero props.
// Note date and admission date are editable and auto-save on change.
// Validation: admissionDate must be >= patient DOB and <= noteDate.

import React, { useState, useEffect } from "react";
import { autosaveNote, isFirstEncounterNote } from "../shared/api/db.commands";

import { validateDateBoundaries } from "../shared/utils/dateValidation";
import { formatAge } from "../shared/utils/date";
import { Tooltip } from "../shared/ui/Tooltip";
import { useNoteStore } from "../stores/useNoteStore";
import { useClinicalStore } from "../stores/useClinicalStore";
import { useUIStore } from "../stores/useUIStore";

export default function PatientHeader() {
  const {
    activePatient: patient,
    noteId,
    patientData,
    setPatientData,
    noteStatus,
    isSaving,
  } = useNoteStore();

  const { clinical } = useClinicalStore();
  const { setSubmitModalOpen, setExitModalOpen } = useUIStore();

  const [dateError, setDateError] = useState<string>("");
  const [isInitial, setIsInitial] = useState<boolean>(true);

  useEffect(() => {
    if (noteId) {
      isFirstEncounterNote(noteId).then(setIsInitial);
    }
  }, [noteId]);

  if (!patient) return null;

  const isSubmitted = noteStatus === "submitted";
  const dob = patient.dob;
  const age = (() => {
    if (!dob || !patientData.noteDate) return "--";
    const dDob = new Date(dob);
    const dNote = new Date(patientData.noteDate);
    const ms = dNote.getTime() - dDob.getTime();
    if (isNaN(ms) || ms < 0) return "--";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return formatAge(days);
  })();

  const handleDateChange = async (
    field: "noteDate" | "admissionDate",
    val: string
  ) => {
    const error = validateDateBoundaries({
      field,
      value: val,
      dob,
      noteDate: field === "noteDate" ? val : patientData.noteDate,
      admissionDate: field === "admissionDate" ? val : patientData.admissionDate,
    });

    if (error) {
      setDateError(error);
      return;
    }

    setDateError("");
    setPatientData({ ...patientData, [field]: val });

    if (!noteId) return;
    const dbField = field === "noteDate" ? "note_date" : "admission_date";
    try {
      await autosaveNote(noteId, dbField, val);
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
    <>
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
            onChange={(e) => handleDateChange("noteDate", e.target.value)}
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

        {/* Admission Date (editable only if initial) */}
        <div className="vital-stat" style={{ minWidth: "120px" }}>
          <span className="label">Admission Date</span>
          <Tooltip
            text={!isInitial ? "Admission date is locked for follow-up notes." : ""}
          >
            <input
              type="date"
              value={patientData.admissionDate || ""}
              onChange={(e) => handleDateChange("admissionDate", e.target.value)}
              disabled={!isInitial}
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                border: "none",
                background: "transparent",
                color: !isInitial ? "var(--text-muted)" : "var(--primary)",
                padding: 0,
                width: "100%",
                cursor: !isInitial ? "not-allowed" : "text",
              }}
            />
          </Tooltip>
        </div>

        {/* Vital signs (from clinical state — live, read-only display) */}
        {vitals.map((v) => (
          <div className="vital-stat" key={v.label}>
            <span className="label">{v.label}</span>
            <span className="value">
              {v.value}
              {v.value !== "--" && v.unit && <span>{v.unit}</span>}
            </span>
          </div>
        ))}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {isSaving && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Saving…
            </span>
          )}
          {isSubmitted && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                background: "#d4edda",
                color: "#155724",
                border: "1px solid #c3e6cb",
                borderRadius: "10px",
                padding: "2px 8px",
              }}
            >
              ✓ Submitted
            </span>
          )}
          <button
            className="btn-outline-danger"
            onClick={() => setExitModalOpen(true)}
          >
            Exit
          </button>
          {!isSubmitted && (
            <button
              className="btn-primary"
              onClick={() => setSubmitModalOpen(true)}
            >
              Submit
            </button>
          )}
        </div>
      </div>

      {/* Validation error banner — sits flush below the header */}
      {dateError && (
        <div
          style={{
            background: "#fdf2f8",
            borderBottom: "1px solid #e74c3c",
            color: "#9d174d",
            padding: "0.35rem 1rem",
            fontSize: "0.78rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          ⚠ {dateError}
        </div>
      )}
    </>
  );
}