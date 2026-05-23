import React, { useState, useMemo } from "react";
import "./App.css";

// 1. IMPORT THE NEW MODULAR COMPONENTS
import AnthroDomain from "./components/create_adime/assessment/AnthroDomain";
import BiochemicalDomain from "./components/create_adime/assessment/BiochemicalDomain";
import ClinicalDomain from "./components/create_adime/assessment/ClinicalDomain";
import DietaryDomain, { DIETARY_CATEGORIES } from "./components/create_adime/assessment/DietaryDomain";

type ViewState = "START" | "VIEW_NOTES" | "CREATE_NOTE" | "TOOLS" | "RESOURCES";

// 2. IMPORT IMAGES FOR START MENU
import createAdimeImg from "./assets/create_new_adime.jpg";
import dietitianToolsImg from "./assets/dietitian_tools.jpg";
import resourcesImg from "./assets/resources.jpg";
import viewAdimeNoteImg from "./assets/view_adime_note.jpg";

// 3. IMPORT NEW PATIENT HEADER COMPONENT
import PatientHeader from "./components/create_adime/shared/PatientHeader";

export default function App() {
  // --- APP NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState<ViewState>("START");

  // --- EXISTING WORKSPACE STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDomain, setActiveDomain] = useState<"A" | "B" | "C" | "D" | "fluid">("A");
  const [activeSubDomain, setActiveSubDomain] = useState<string>("D1");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [patientData, setPatientData] = useState({
    lastName: '',
    firstName: '',
    dob: '',
    sex: '',
    mrn: '',
    admissionDate: new Date().toISOString().split('T')[0],
    noteDate: new Date().toISOString().split('T')[0],
    languages: ''
  });
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleDomainSwitch = (domain: "A" | "B" | "C" | "D" | "fluid") => {
    if (domain !== activeDomain) {
      showToast(`Auto-saved previous section`);
      setActiveDomain(domain);
      if (window.innerWidth <= 768) setSidebarOpen(false);
    }
  };

  // --- GLOBAL DATA STATE ---
  const [anthro, setAnthro] = useState({ 
    ht: "", htUnit: "cm", wt: "", wtUnit: "kg", ubw: "", ubwTime_amount1: "", ubwTime_unit1: "", ubwTime_amount2: "", ubwTime_unit2: "",
    waist: "", mac: "", calf: "", head: "", circUnit: "cm",
    triceps: "", subscapular: "", suprailiac: "", thigh: "", skinfoldUnit: "cm",
    past_ht: "cm", past_htUnit: "cm", past_wt: "", past_wtUnit: "kg",  past_head: "", past_headUnit: "cm", 
    past_htDate: "", past_wtDate: "", past_headDate: ""
  });
  const [dexaScans, setDexaScans] = useState<any[]>([]);
  const [labs, setLabs] = useState<Record<string, { current: string, historical: string }>>({});
  const [clinical, setClinical] = useState({
    chiefComplaint: "", medHx: "", temples: "", clavicles: "", shoulders: "", scapula: "", interosseous: "", thighs: "", calves: "",
    orbital: "", cheek: "", tricepsFat: "", midAxillary: "",
    hair: "", eyes: "", mouthLips: "", tongue: "", teethGums: "", headNeck: "", nails: "", skin: "", gripStrength: "",
    giDistress: "", chewing: "", oralHygiene: "", swallowing: "", clinicalNotes: ""
  });
  const [dietary, setDietary] = useState({
    recall: { breakfast: "", lunch: "", dinner: "", snacks: "" },
    macroAdequacy: "", mealPatterns: "", currentDiets: "", fluidIntake: "", eatingEnv: "",
    culturalReligious: "", socialDynamics: "", dietOrder: "Standard Diet, Regular", actualIntake: "", enteralPN: "",
    drugInteractions: "", otcMeds: "", herbalCAM: "", supplements: "",
    understanding: "", readiness: "5", psychTies: "", mealPrep: "", eatingOut: "", bingePurge: "",
    foodSecurity: "", foodSupplies: "", transport: "", physicalLevel: "", adls: "", feedingTasks: "", perception: "", qolGoals: ""
  });

  const calculatedMetrics = useMemo(() => {
    let bmi = 0;
    if (anthro.ht && anthro.wt) {
      let wtKg = anthro.wtUnit === "lbs" ? Number(anthro.wt) / 2.205 : Number(anthro.wt);
      let htM = anthro.htUnit === "in" ? Number(anthro.ht) * 0.0254 : Number(anthro.ht) / 100;
      if (htM > 0) bmi = wtKg / (htM * htM);
    }
    return { bmi: bmi > 0 ? bmi.toFixed(1) : "--", wtKg: anthro.wt ? (anthro.wtUnit === "lbs" ? (Number(anthro.wt) / 2.205).toFixed(1) : anthro.wt) : "--" };
  }, [anthro]);

  // --- NAVIGATION HANDLERS ---
  const handleExitToStart = () => {
    // Add warning prompt ONLY if leaving the Create Note screen
    if (currentView === "CREATE_NOTE") {
      const confirmExit = window.confirm("Are you sure you want to exit? Any unsaved changes will be lost.");
      if (!confirmExit) return; // Cancel exit if user clicks 'Cancel'
    }
    setCurrentView("START");
  };

  // --- RENDER START PAGE ---
  if (currentView === "START") {
    return (
      <div className="start-page-wrapper">
        <div className="start-page-content">
          
          <div className="start-header">
            <h1>RD Workstation</h1>
            <p>Select a clinical module to begin your workflow</p>
          </div>

          <div className="start-grid">
            <button className="start-card" onClick={() => setCurrentView("VIEW_NOTES")}>
              <div className="card-image">
                <img src={viewAdimeNoteImg} alt="View ADIME Notes" />
              </div>
              <div className="card-content">
                <h3>View ADIME Notes</h3>
                <p>Access and review historical patient documentation and previous assessments.</p>
              </div>
            </button>

            <button className="start-card primary-card" onClick={() => setCurrentView("CREATE_NOTE")}>
              <div className="card-image">
                <img src={createAdimeImg} alt="Create New ADIME" />
              </div>
              <div className="card-content">
                <h3>Create New ADIME</h3>
                <p>Start a new patient assessment and generate comprehensive ADIME documentation.</p>
              </div>
            </button>

            <button className="start-card" onClick={() => setCurrentView("TOOLS")}>
              <div className="card-image">
                <img src={dietitianToolsImg} alt="Dietitian Tools" />
              </div>
              <div className="card-content">
                <h3>Dietitian Tools</h3>
                <p>Access clinical calculators, reference ranges, and anthropometric guidelines.</p>
              </div>
            </button>

            <button className="start-card" onClick={() => setCurrentView("RESOURCES")}>
              <div className="card-image">
                <img src={resourcesImg} alt="Reference Library" />
              </div>
              <div className="card-content">
                <h3>Reference Library</h3>
                <p>Browse clinical guidelines, standardized language, and nutrition manuals.</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- RENDER VIEW NOTES PAGE ---
  if (currentView === "VIEW_NOTES") {
    return (
      <div className="generic-page">
        <header className="page-header">
          <button className="back-btn" onClick={handleExitToStart}>← Back to Home</button>
          <h2>Past ADIME Notes</h2>
        </header>
        <div className="page-content">
          <p>Select a patient to view their historical ADIME notes...</p>
          {/* Add your historical notes UI components here */}
        </div>
      </div>
    );
  }

  // --- RENDER TOOLS PAGE ---
  if (currentView === "TOOLS") {
    return (
      <div className="generic-page">
        <header className="page-header">
          <button className="back-btn" onClick={handleExitToStart}>← Back to Home</button>
          <h2>Dietitian Tools & Calculators</h2>
        </header>
        <div className="page-content">
          <p>Access standalone calculators, references, and guidelines here...</p>
          {/* Add your standalone tools UI components here */}
        </div>
      </div>
    );
  }
  // --- RENDER RESOURCES PAGE ---
  if (currentView === "RESOURCES") {
    return (
      <div className="generic-page">
        <header className="page-header">
          <button className="back-btn" onClick={handleExitToStart}>← Back to Home</button>
          <h2>Clinical Reference Library</h2>
        </header>
        <div className="page-content">
          <p>Access guidelines, manuals, and standard terminology here...</p>
          {/* In the future, you would render <ReferenceLibrary /> here */}
        </div>
      </div>
    );
  }

  // --- RENDER CREATE NOTE WORKSPACE (Existing App Code) ---
  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          RD Workstation
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        
        <div className="nav-section">
          <div className={`nav-item ${activeDomain === "A" ? 'active' : ''}`} onClick={() => handleDomainSwitch("A")}>A. Anthropometrics</div>
          <div className={`nav-item ${activeDomain === "B" ? 'active' : ''}`} onClick={() => handleDomainSwitch("B")}>B. Biochemical Data</div>
          <div className={`nav-item ${activeDomain === "C" ? 'active' : ''}`} onClick={() => handleDomainSwitch("C")}>C. Clinical & NFPE</div>
          <div className={`nav-item ${activeDomain === "D" ? 'active' : ''}`} onClick={() => handleDomainSwitch("D")}>D. Dietary History</div>
          
          {activeDomain === "D" && (
            <div className="sub-nav">
              {DIETARY_CATEGORIES.map(cat => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? 'active' : ''}`} onClick={() => setActiveSubDomain(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* MAIN WORKSPACE */}
      <main className="main-workspace">
        <header className="top-nav">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-bar" placeholder="Jump to section..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {/* NEW: EXIT BUTTON FOR WORKSPACE */}
          <button className="exit-workspace-btn" onClick={handleExitToStart}>Exit Note</button>
        </header>

        <PatientHeader patientData={patientData} setPatientData={setPatientData} />

        <div className="content-area">
          {activeDomain === "A" && (
            <AnthroDomain 
              anthro={anthro} 
              setAnthro={setAnthro} 
              dexaScans={dexaScans} 
              setDexaScans={setDexaScans} 
              calculatedMetrics={calculatedMetrics} 
              patientData={patientData} /* <-- Pass patientData here too! */
            />
          )}
          {activeDomain === "B" && <BiochemicalDomain labs={labs} setLabs={setLabs} />}
          {activeDomain === "C" && <ClinicalDomain clinical={clinical} setClinical={setClinical} />}
          {activeDomain === "D" && <DietaryDomain dietary={dietary} setDietary={setDietary} activeSubDomain={activeSubDomain} />}
        </div>

        <button className="fab" onClick={() => showToast("Quick Action Triggered")}>+</button>
        <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
      </main>
    </div>
  );
}
