import { useState, useMemo } from "react";
import "./App.css";

// Page Components
import LoginPage from "./LoginPage";
import StartPage from "./StartPage";
import NoteListPage from "./NoteListPage";
import CreateNotePage from "./CreateNotePage";
import ToolsHomePage from "./ToolsHomePage";

// Widget Components
import ReferenceLayout from "../widgets/ReferenceLayout";

export type ViewState = "LOGIN" | "START" | "VIEW_NOTES" | "CREATE_NOTE" | "TOOLS" | "RESOURCES";

export default function App() {
  // ── Top-level routing ──────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>("LOGIN");

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
    setCurrentView("START");
  };

  // ── Patient & note state (lifted here so it persists across domain tabs) ──
  // ... (rest of state remains unchanged)
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
    gripStrength: "",
    giDistress: "", chewing: "", oralHygiene: "", swallowing: "",
    clinicalNotes: "",
  });

  const [dietary, setDietary] = useState<any>({
    recall: { breakfast: "", lunch: "", dinner: "", snacks: "" },
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

  // ── Derived metrics (BMI etc.) ─────────────────────────────────────────────
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
    return { bmi };
  }, [anthro.ht, anthro.htUnit, anthro.wt, anthro.wtUnit]);

  // ── Shared props bundles ───────────────────────────────────────────────────
  const sharedNoteProps = {
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
      return <StartPage setCurrentView={setCurrentView} handleLogout={handleLogout} />;
    case "VIEW_NOTES":
      return <NoteListPage handleExitToStart={handleExitToStart} />;
    case "CREATE_NOTE":
      return <CreateNotePage {...sharedNoteProps} />;
    case "TOOLS":
      return <ToolsHomePage handleExitToStart={handleExitToStart} />;
    case "RESOURCES":
      return <ReferenceLayout handleExitToStart={handleExitToStart} />;
    default:
      return <StartPage setCurrentView={setCurrentView} handleLogout={handleLogout} />;
  }
}