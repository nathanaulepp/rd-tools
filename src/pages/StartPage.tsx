import React from "react";
import { ViewState } from "./App";

import createAdimeImg from "../shared/assets/create_new_adime.jpg";
import dietitianToolsImg from "../shared/assets/dietitian_tools.jpg";
import resourcesImg from "../shared/assets/resources.jpg";
import viewAdimeNoteImg from "../shared/assets/view_adime_note.jpg";

interface StartPageProps {
  setCurrentView: (view: ViewState) => void;
}

export default function StartPage({ setCurrentView }: StartPageProps) {
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