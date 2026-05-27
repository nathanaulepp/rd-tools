// src/pages/App.tsx
// Phase 6: New domains (Diagnosis, Intervention, Monitor/Eval) + Settings view

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
import SettingsPage from "./SettingsPage"; // Phase 6
import {
  defaultPatientData,
  defaultAnthro,
  defaultDexaScans,
  defaultLabs,
  defaultClinical,
  defaultDietary,
  defaultDiagnosis,     // Phase 6
  defaultIntervention,  // Phase 6
  defaultMonitorEval,   // Phase 6
  defaultStandards,
} from "../entities/note/defaults";
import { initDrugSync } from "../features/drugs/DrugLookupTool";

export type ViewState =
  | "LOGIN" | "START" | "PATIENT_GATE" | "VIEW_NOTES"
  | "CREATE_NOTE" | "VIEW_SUMMARY" | "TOOLS"
  | "SETTINGS"; // Phase 6

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>("LOGIN");

  useEffect(() => {
    getDb().catch(err => console.error("Failed to initialize database:", err));
    initDrugSync().then(r => {
      if (r.status === "synced") console.log('Drug DB: ${r.count} terms loaded');
      if (r.status === "error") console.warn("Drug DB sync failed:", r.error);
    });
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

  // ── Active patient / note context ──────────────────────────────────────────
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeNoteId,    setActiveNoteId]    = useState<string | null>(null);
  const [activePatient,   setActivePatient]   = useState<Patient | null>(null);
  const [activeNote,      setActiveNote]      = useState<Note | null>(null);

  const handleOpenNote = (patientId: string, noteId: string, patient: Patient, note: Note) => {
    setActivePatientId(patientId);
    setActiveNoteId(noteId);
    setActivePatient(patient);
    setActiveNote(note);
    resetNoteState(patient, note);

    if (note.status === "submitted") {
      setCurrentView("VIEW_SUMMARY");
    } else {
      setCurrentView("CREATE_NOTE");
    }
  };

  // ── Domain state ───────────────────────────────────────────────────────────
  const [patientData,  setPatientData]  = useState(defaultPatientData);
  const [anthro,       setAnthro]       = useState(defaultAnthro);
  const [dexaScans,    setDexaScans]    = useState(defaultDexaScans);
  const [labs,         setLabs]         = useState(defaultLabs);
  const [clinical,     setClinical]     = useState(defaultClinical);
  const [dietary,      setDietary]      = useState<any>(defaultDietary);
  // Phase 6 new domains
  const [diagnosis,    setDiagnosis]    = useState<any>(defaultDiagnosis);
  const [intervention, setIntervention] = useState<any>(defaultIntervention);
  const [monitorEval,  setMonitorEval]  = useState<any>(defaultMonitorEval);
  const [standards,    setStandards]    = useState<any>(defaultStandards);

  const resetNoteState = (patient: Patient, note: Note) => {
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

    if (note.anthro) {
      try { setAnthro(JSON.parse(note.anthro)); } catch(e) { setAnthro(defaultAnthro); }
    } else { setAnthro(defaultAnthro); }

    if (note.dexa_scans) {
      try { setDexaScans(JSON.parse(note.dexa_scans)); } catch(e) { setDexaScans(defaultDexaScans); }
    } else { setDexaScans(defaultDexaScans); }

    if (note.labs) {
      try { setLabs(JSON.parse(note.labs)); } catch(e) { setLabs(defaultLabs); }
    } else { setLabs(defaultLabs); }

    if (note.clinical) {
      try { setClinical(JSON.parse(note.clinical)); } catch(e) { setClinical(defaultClinical); }
    } else { setClinical(defaultClinical); }

    if (note.dietary) {
      try { setDietary(JSON.parse(note.dietary)); } catch(e) { setDietary(defaultDietary); }
    } else { setDietary(defaultDietary); }

    // Phase 6: new domains
    if (note.diagnosis) {
      try { setDiagnosis(JSON.parse(note.diagnosis)); } catch(e) { setDiagnosis(defaultDiagnosis); }
    } else { setDiagnosis(defaultDiagnosis); }

    if (note.intervention) {
      try { setIntervention(JSON.parse(note.intervention)); } catch(e) { setIntervention(defaultIntervention); }
    } else { setIntervention(defaultIntervention); }

    if (note.monitor_evaluate) {
      try { setMonitorEval(JSON.parse(note.monitor_evaluate)); } catch(e) { setMonitorEval(defaultMonitorEval); }
    } else { setMonitorEval(defaultMonitorEval); }

    // Comparative Standards
    if ((note as any).standards) {
      try { setStandards(JSON.parse((note as any).standards)); } catch(e) { setStandards(defaultStandards); }
    } else { setStandards(defaultStandards); }
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

    let ubwTimeframeDays: number | null = null;
    if (anthro.ubwDate && patientData.noteDate) {
      const dUbw = new Date(anthro.ubwDate);
      const dNote = new Date(patientData.noteDate);
      ubwTimeframeDays = Math.floor((dNote.getTime() - dUbw.getTime()) / (1000 * 60 * 60 * 24));
    }

    return { bmi, ageDays, ubwTimeframeDays };
  }, [anthro.ht, anthro.htUnit, anthro.wt, anthro.wtUnit, anthro.ubwDate, patientData.dob, patientData.noteDate]);

  // ── Shared props ───────────────────────────────────────────────────────────
  const sharedNoteProps = {
    patientId: activePatientId,
    noteId: activeNoteId,
    patient: activePatient,
    note: activeNote,
    patientData, setPatientData,
    anthro, setAnthro,
    dexaScans, setDexaScans,
    labs, setLabs,
    clinical, setClinical,
    dietary, setDietary,
    // Phase 6
    diagnosis, setDiagnosis,
    intervention, setIntervention,
    monitorEval, setMonitorEval,
    standards, setStandards,
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
    case "SETTINGS": // Phase 6
      return <SettingsPage handleExitToStart={handleExitToStart} />;
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