import { ViewState } from "./App";

import createAdimeImg from "../shared/assets/create_new_adime.jpg";
import dietitianToolsImg from "../shared/assets/dietitian_tools.jpg";
import viewAdimeNoteImg from "../shared/assets/view_adime_note.jpg";

interface StartPageProps {
  setCurrentView: (view: ViewState) => void;
  handleLogout: () => void;
}

export default function StartPage({ setCurrentView, handleLogout }: StartPageProps) {
  return (
    <div className="start-page-wrapper">
      <div className="start-page-content">

        <div className="start-header">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-20px" }}>
            <button className="btn-outline" onClick={handleLogout} style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
              Log Out
            </button>
          </div>
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
        </div>

      </div>
    </div>
  );
}