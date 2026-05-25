// src/pages/App.tsx
import { useState, useMemo, useEffect } from "react";
import "./App.css";
import { getDb } from "../shared/api/db";
import type { Patient } from "../shared/api/db";

// Page Components
import LoginPage from "./LoginPage";
import StartPage from "./StartPage";
import NoteListPage from "./NoteListPage";
import CreateNotePage from "./CreateNotePage";
import ToolsHomePage from "./ToolsHomePage";
import PatientGatePage from "./PatientGatePage";

export type ViewState = "LOGIN" | "START" | "PATIENT_GATE" | "VIEW_NOTES" | "CREATE_NOTE" | "TOOLS";

export default function App() {
  // ── Top-level routing ──────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>("LOGIN");

  useEffect(() => {
    getDb().catch((err) => console.error("Failed to initialize database:", err));
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
      const confirmExit = window.confirm(
        "Are you sure you want to exit? Any unsaved changes will be lost."
      );
      if (!confirmExit) return;
    }
    // Clear note context when leaving the workspace
    setActivePatientId(null);
    setActiveNoteId(null);
    setActivePatient(null);
    setCurrentView("START");
  };

  // ── Phase 1: Active patient / note context ─────────────────────────────────
  // These are set by PatientGatePage once a patient + note are confirmed,
  // then passed down to CreateNotePage (and eventually PatientHeader).
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  /** Called by PatientGatePage when patient + note are ready. */
  const handleEnterWorkspace = (patientId: string, noteId: string, patient: Patient) => {
    setActivePatientId(patientId);
    setActiveNoteId(noteId);
    setActivePatient(patient);
    // Reset domain state for the new note
    resetNoteState(patient);
    setCurrentView("CREATE_NOTE");
  };

  // ── Patient & note state ───────────────────────────────────────────────────
  const [patientData, setPatientData] = useState({
    lastName: "",
    firstName: "",
    dob: "",
    sex: "",
    mrn: "",
    admissionDate: new Date().toISOString().split("T")[0],
    noteDate: new Date().toISOString().split("T")[0],
    languages: "",
  });

  const [anthro, setAnthro] = useState({
    ht: "", htUnit: "cm",
    wt: "", wtUnit: "kg",
    ubw: "", ubwTime_amount1: "", ubwTime_unit1: "mo", ubwTime_amount2: "", ubwTime_unit2: "mo",
    waist: "", mac: "", calf: "", head: "", circUnit: "cm",
    triceps: "", subscapular: "", suprailiac: "", thigh: "", skinfoldUnit: "mm",
    past_ht: "", past_htUnit: "cm",
    past_wt: "", past_wtUnit: "kg",
    past_head: "", past_headUnit: "cm",
    past_htDate: "", past_wtDate: "", past_headDate: "",
  });

  const [dexaScans, setDexaScans] = useState<any[]>([]);

  const [labs, setLabs] = useState<Record<string, { current: string; historical: string }>>({});

  const [clinical, setClinical] = useState({
    chiefComplaint: "", medHx: "",
    temples: "", clavicles: "", shoulders: "", scapula: "",
    interosseous: "", thighs: "", calves: "",
    orbital: "", cheek: "", tricepsFat: "", midAxillary: "",
    hair: [] as string[], eyes: [] as string[], mouthLips: [] as string[],
    tongue: [] as string[], teethGums: [] as string[], headNeck: [] as string[],
    nails: [] as string[], skin: [] as string[],
    pittingEdema: "", ascites: "", edemaDescription: "",
    temp: "", hr: "", spo2: "", bp: "", rr: "",
    gripStrength: "",
    giDistress: "", chewing: "", oralHygiene: "", swallowing: "",
    clinicalNotes: "",
  });

  const [dietary, setDietary] = useState<any>({
    recall: [{ label: "Meal 1", value: "" }],
    macroAdequacy: "", mealPatterns: "", currentDiets: "", fluidIntake: "", eatingEnv: "",
    culturalReligious: "", socialDynamics: "",
    dietOrder: "Standard Diet, Regular", actualIntake: "",
    oralCalories: "", oralProtein: "", oralWater: "",
    drugInteractions: "", otcMeds: "", herbalCAM: "", supplements: "",
    understanding: "", readiness: "5", psychTies: "",
    mealPrep: "", eatingOut: "", bingePurge: "",
    foodSecurity: "", foodSupplies: "", transport: "",
    physicalLevel: "", adls: "", feedingTasks: "",
    perception: "", qolGoals: "",
  });

  /**
   * Reset all domain state for a new note.
   * Pre-fills patientData from the DB patient record so PatientHeader
   * can display demographics immediately (Phase 2 will make this read-only).
   */
  const resetNoteState = (patient: Patient) => {
    const today = new Date().toISOString().split("T")[0];

    setPatientData({
      lastName: patient.last_name,
      firstName: patient.first_name,
      dob: patient.dob,
      sex: patient.sex ?? "",
      mrn: patient.mrn ?? "",
      admissionDate: today,
      noteDate: today,
      languages: patient.languages ?? "",
    });

    setAnthro({
      ht: "", htUnit: "cm",
      wt: "", wtUnit: "kg",
      ubw: "", ubwTime_amount1: "", ubwTime_unit1: "mo", ubwTime_amount2: "", ubwTime_unit2: "mo",
      waist: "", mac: "", calf: "", head: "", circUnit: "cm",
      triceps: "", subscapular: "", suprailiac: "", thigh: "", skinfoldUnit: "mm",
      past_ht: "", past_htUnit: "cm",
      past_wt: "", past_wtUnit: "kg",
      past_head: "", past_headUnit: "cm",
      past_htDate: "", past_wtDate: "", past_headDate: "",
    });
    setDexaScans([]);
    setLabs({});
    setClinical({
      chiefComplaint: "", medHx: "",
      temples: "", clavicles: "", shoulders: "", scapula: "",
      interosseous: "", thighs: "", calves: "",
      orbital: "", cheek: "", tricepsFat: "", midAxillary: "",
      hair: [], eyes: [], mouthLips: [],
      tongue: [], teethGums: [], headNeck: [],
      nails: [], skin: [],
      pittingEdema: "", ascites: "", edemaDescription: "",
      temp: "", hr: "", spo2: "", bp: "", rr: "",
      gripStrength: "",
      giDistress: "", chewing: "", oralHygiene: "", swallowing: "",
      clinicalNotes: "",
    });
    setDietary({
      recall: [{ label: "Meal 1", value: "" }],
      macroAdequacy: "", mealPatterns: "", currentDiets: "", fluidIntake: "", eatingEnv: "",
      culturalReligious: "", socialDynamics: "",
      dietOrder: "Standard Diet, Regular", actualIntake: "",
      oralCalories: "", oralProtein: "", oralWater: "",
      drugInteractions: "", otcMeds: "", herbalCAM: "", supplements: "",
      understanding: "", readiness: "5", psychTies: "",
      mealPrep: "", eatingOut: "", bingePurge: "",
      foodSecurity: "", foodSupplies: "", transport: "",
      physicalLevel: "", adls: "", feedingTasks: "",
      perception: "", qolGoals: "",
    });
  };

  // ── Derived metrics ────────────────────────────────────────────────────────
  const calculatedMetrics = useMemo(() => {
    const htCm = anthro.htUnit === "in"
      ? Number(anthro.ht) * 2.54
      : Number(anthro.ht);
    const wtKg = anthro.wtUnit === "lbs"
      ? Number(anthro.wt) / 2.205
      : Number(anthro.wt);
    const bmi =
      htCm > 0 && wtKg > 0
        ? (wtKg / Math.pow(htCm / 100, 2)).toFixed(1)
        : "--";

    let ageDays: number | null = null;
    if (patientData.dob && patientData.noteDate) {
      const dDob = new Date(patientData.dob);
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
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  switch (currentView) {
    case "START":
      return (
        <StartPage
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          theme={theme}
          setTheme={setTheme}
        />
      );
    case "PATIENT_GATE":
      return (
        <PatientGatePage
          onEnterWorkspace={handleEnterWorkspace}
          onCancel={() => setCurrentView("START")}
        />
      );
    case "VIEW_NOTES":
      return <NoteListPage handleExitToStart={handleExitToStart} />;
    case "CREATE_NOTE":
      return <CreateNotePage {...sharedNoteProps} />;
    case "TOOLS":
      return <ToolsHomePage handleExitToStart={handleExitToStart} />;
    default:
      return (
        <StartPage
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          theme={theme}
          setTheme={setTheme}
        />
      );
  }
}