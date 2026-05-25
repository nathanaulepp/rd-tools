// src/pages/StartPage.tsx
// Phase 1 change: "Create New ADIME" now routes to PATIENT_GATE,
// not directly to CREATE_NOTE.

import { ViewState } from "./App";

import createAdimeImg from "../shared/assets/create_new_adime.jpg";
import dietitianToolsImg from "../shared/assets/dietitian_tools.jpg";
import viewAdimeNoteImg from "../shared/assets/view_adime_note.jpg";

interface StartPageProps {
  setCurrentView: (view: ViewState) => void;
  handleLogout: () => void;
  zoomLevel?: number;
  setZoomLevel?: (zoom: number) => void;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
}

export default function StartPage({
  setCurrentView,
  handleLogout,
  zoomLevel = 1,
  setZoomLevel,
  theme = "light",
  setTheme,
}: StartPageProps) {
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

          {/* Phase 1: routes to PATIENT_GATE first, then into CREATE_NOTE */}
          <button className="start-card primary-card" onClick={() => setCurrentView("PATIENT_GATE")}>
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

      {/* UI Settings Panel */}
      {setZoomLevel && setTheme && (
        <div style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "var(--white)",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 1000,
          minWidth: "160px"
        }}>
          {/* Theme Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Theme</span>
            <div style={{ display: "flex", background: "var(--bg-color)", borderRadius: "15px", padding: "2px" }}>
              <button
                onClick={() => setTheme("light")}
                style={{
                  border: "none",
                  background: theme === "light" ? "var(--accent)" : "transparent",
                  color: theme === "light" ? "white" : "var(--text-muted)",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                style={{
                  border: "none",
                  background: theme === "dark" ? "var(--accent)" : "transparent",
                  color: theme === "dark" ? "white" : "var(--text-muted)",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Magnification Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>UI Scale</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)" }}>{Math.round(zoomLevel * 100)}%</span>
            </div>
            <input
              type="range" min="0.8" max="1.5" step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              style={{ width: "100%", cursor: "pointer" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}