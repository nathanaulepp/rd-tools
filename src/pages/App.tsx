// src/pages/App.tsx
import { useState, useMemo, useEffect } from "react";
import "./App.css";
import { getDb } from "../shared/api/db";
import type { Patient, Note } from "../shared/api/db";

import LoginPage from "./LoginPage";
import StartPage from "./StartPage";
import NoteListPage from "./NoteListPage";
import CreateNotePage from "./CreateNotePage";
import ToolsHomePage from "./ToolsHomePage";
import PatientGatePage from "./PatientGatePage";
import ClinicalSummaryView from "./ClinicalSummaryView";
import {
  defaultPatientData,
  defaultAnthro,
  defaultDexaScans,
  defaultLabs,
  defaultClinical,
  defaultDietary
} from "../entities/note/defaults";

export type ViewState = "LOGIN" | "START" | "PATIENT_GATE" | "VIEW_NOTES" | "CREATE_NOTE" | "VIEW_SUMMARY" | "TOOLS";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>("LOGIN");

  useEffect(() => {
    getDb().catch(err => console.error("Failed to initialize database:", err));
  }, []);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("ui-theme");
    return (saved as "light" | "dark") || "light";
  });

  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem("ui-zoom");
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-theme" : "";
    localStorage.setItem("ui-theme", theme);
  }, [theme]);

  useEffect(() => {
    const baseSize = 17.6 * zoomLevel;
    document.documentElement.style.fontSize = `${baseSize}px`;
    localStorage.setItem("ui-zoom", zoomLevel.toString());
  }, [zoomLevel]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView("START");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView("LOGIN");
  };

  const handleExitToStart = () => {
    if (currentView === "CREATE_NOTE") {
      const confirmExit = window.confirm("Are you sure you want to exit? Any unsaved changes will be lost.");
      if (!confirmExit) return;
    }
    setActivePatientId(null);
    setActiveNoteId(null);
    setActivePatient(null);
    setActiveNote(null);
    setCurrentView("START");
  };

  // ── Phase 1+2: Active patient / note context ───────────────────────────────
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeNoteId,    setActiveNoteId]    = useState<string | null>(null);
  const [activePatient,   setActivePatient]   = useState<Patient | null>(null);
  const [activeNote,      setActiveNote]      = useState<Note | null>(null);   // Phase 2

  /** Called by PatientGatePage or NoteListPage when patient + note are ready. */
  const handleOpenNote = (patientId: string, noteId: string, patient: Patient, note: Note) => {
    setActivePatientId(patientId);
    setActiveNoteId(noteId);
    setActivePatient(patient);
    setActiveNote(note);
    resetNoteState(patient, note);
    
    // If note is already submitted, show the summary view. Otherwise, open workspace.
    if (note.status === "submitted") {
      setCurrentView("VIEW_SUMMARY");
    } else {
      setCurrentView("CREATE_NOTE");
    }
  };

  // ── Domain state ───────────────────────────────────────────────────────────
  const [patientData, setPatientData] = useState(defaultPatientData);
  const [anthro,      setAnthro]      = useState(defaultAnthro);
  const [dexaScans,   setDexaScans]   = useState(defaultDexaScans);
  const [labs,        setLabs]        = useState(defaultLabs);
  const [clinical,    setClinical]    = useState(defaultClinical);
  const [dietary,     setDietary]     = useState<any>(defaultDietary);

  /**
   * Reset or load all domain state when entering a note.
   * If note contains JSON strings, they are parsed and loaded.
   */
  const resetNoteState = (patient: Patient, note: Note) => {
    // 1. Patient Metadata
    setPatientData({
      lastName:      patient.last_name,
      firstName:     patient.first_name,
      dob:           patient.dob,
      sex:           patient.sex       ?? "",
      mrn:           patient.mrn       ?? "",
      admissionDate: note.admission_date ?? defaultPatientData.admissionDate,
      noteDate:      note.note_date     ?? defaultPatientData.noteDate,
      languages:     patient.languages  ?? "",
    });

    // 2. Anthropometrics
    if (note.anthro) {
      try { setAnthro(JSON.parse(note.anthro)); } catch(e) { console.error("Anthro parse failed", e); }
    } else {
      setAnthro(defaultAnthro);
    }

    // 3. DEXA Scans
    if (note.dexa_scans) {
      try { setDexaScans(JSON.parse(note.dexa_scans)); } catch(e) { console.error("DEXA parse failed", e); }
    } else {
      setDexaScans(defaultDexaScans);
    }

    // 4. Labs (Biochemical)
    if (note.labs) {
      try { setLabs(JSON.parse(note.labs)); } catch(e) { console.error("Labs parse failed", e); }
    } else {
      setLabs(defaultLabs);
    }

    // 5. Clinical / NFPE
    if (note.clinical) {
      try { setClinical(JSON.parse(note.clinical)); } catch(e) { console.error("Clinical parse failed", e); }
    } else {
      setClinical(defaultClinical);
    }

    // 6. Dietary
    if (note.dietary) {
      try { setDietary(JSON.parse(note.dietary)); } catch(e) { console.error("Dietary parse failed", e); }
    } else {
      setDietary(defaultDietary);
    }
  };

  // ── Derived metrics ────────────────────────────────────────────────────────
  const calculatedMetrics = useMemo(() => {
    const htCm = anthro.htUnit === "in" ? Number(anthro.ht) * 2.54 : Number(anthro.ht);
    const wtKg = anthro.wtUnit === "lbs" ? Number(anthro.wt) / 2.205 : Number(anthro.wt);
    const bmi = htCm > 0 && wtKg > 0 ? (wtKg / Math.pow(htCm / 100, 2)).toFixed(1) : "--";

    let ageDays: number | null = null;
    if (patientData.dob && patientData.noteDate) {
      const dDob  = new Date(patientData.dob);
      const dNote = new Date(patientData.noteDate);
      ageDays = Math.floor((dNote.getTime() - dDob.getTime()) / (1000 * 60 * 60 * 24));
    }

    return { bmi, ageDays };
  }, [anthro.ht, anthro.htUnit, anthro.wt, anthro.wtUnit, patientData.dob, patientData.noteDate]);

  // ── Shared props for CreateNotePage ───────────────────────────────────────
  const sharedNoteProps = {
    patientId: activePatientId,
    noteId: activeNoteId,
    patient: activePatient,
    note: activeNote,           // Phase 2
    patientData, setPatientData,
    anthro, setAnthro,
    dexaScans, setDexaScans,
    labs, setLabs,
    clinical, setClinical,
    dietary, setDietary,
    calculatedMetrics,
    handleExitToStart,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  switch (currentView) {
    case "START":
      return (
        <StartPage
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
          zoomLevel={zoomLevel} setZoomLevel={setZoomLevel}
          theme={theme} setTheme={setTheme}
        />
      );
    case "PATIENT_GATE":
      return (
        <PatientGatePage
          onEnterWorkspace={handleOpenNote}
          onCancel={() => setCurrentView("START")}
        />
      );
    case "VIEW_NOTES":
      return (
        <NoteListPage
          handleExitToStart={handleExitToStart}
          onOpenNote={handleOpenNote}
        />
      );
    case "CREATE_NOTE":
      return <CreateNotePage {...sharedNoteProps} />;
    case "VIEW_SUMMARY":
      if (!activePatient || !activeNote) return null;
      return (
        <ClinicalSummaryView
          {...sharedNoteProps}
          patient={activePatient}
          note={activeNote}
        />
      );
    case "TOOLS":
      return <ToolsHomePage handleExitToStart={handleExitToStart} />;
    default:
      return (
        <StartPage
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
          zoomLevel={zoomLevel} setZoomLevel={setZoomLevel}
          theme={theme} setTheme={setTheme}
        />
      );
  }
}