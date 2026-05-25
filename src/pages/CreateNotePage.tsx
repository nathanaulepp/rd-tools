// src/pages/CreateNotePage.tsx
import React, { useState } from "react";
import type { Patient } from "../shared/api/db";

import PatientHeader from "../widgets/PatientHeader";
import AnthroDomain from "../features/assessment/assess-anthro/AnthroDomain";
import BiochemicalDomain from "../features/assessment/assess-biochemical/BiochemicalDomain";
import ClinicalDomain from "../features/assessment/assess-clinical/ClinicalDomain";
import DietaryDomain from "../features/assessment/assess-dietary/DietaryDomain";
import { DIETARY_CATEGORIES, ASSESSMENT_CATEGORIES, BIOCHEMICAL_CATEGORIES } from "../shared/constants/adimeSideBarCategories";

interface CreateNotePageProps {
  // Phase 1: DB context — passed down from App, used by Phase 2+ for autosave & submit
  patientId: string | null;
  noteId: string | null;
  patient: Patient | null;

  patientData: any;
  setPatientData: (d: any) => void;
  anthro: any;
  setAnthro: (a: any) => void;
  dexaScans: any[];
  setDexaScans: (s: any[]) => void;
  labs: any;
  setLabs: (l: any) => void;
  clinical: any;
  setClinical: (c: any) => void;
  dietary: any;
  setDietary: (d: any) => void;
  calculatedMetrics: any;
  handleExitToStart: () => void;
}

export default function CreateNotePage({
  patientId,
  noteId,
  patient,
  patientData, setPatientData,
  anthro, setAnthro,
  dexaScans, setDexaScans,
  labs, setLabs,
  clinical, setClinical,
  dietary, setDietary,
  calculatedMetrics,
  handleExitToStart,
}: CreateNotePageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDomain, setActiveDomain] = useState<"A" | "B" | "C" | "D">("A");
  const [activeSubDomain, setActiveSubDomain] = useState<string>("A1-A5");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleDomainSwitch = (domain: "A" | "B" | "C" | "D") => {
    if (domain !== activeDomain) {
      // Phase 3 will wire autosave_note() here using noteId
      showToast("Auto-saved previous section");
      setActiveDomain(domain);

      if (domain === "A") setActiveSubDomain("A1-A5");
      else if (domain === "B") setActiveSubDomain("B1");
      else if (domain === "D") setActiveSubDomain("D1");

      if (window.innerWidth <= 768) setSidebarOpen(false);
    }
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          RD Workstation
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <div className="nav-section">
          <div
            className={`nav-item ${activeDomain === "A" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("A")}
          >
            A. Anthropometrics
          </div>
          {activeDomain === "A" && (
            <div className="sub-nav">
              {ASSESSMENT_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`}
                  onClick={() => setActiveSubDomain(cat.id)}
                >
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          <div
            className={`nav-item ${activeDomain === "B" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("B")}
          >
            B. Biochemical Data
          </div>
          {activeDomain === "B" && (
            <div className="sub-nav">
              {BIOCHEMICAL_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`}
                  onClick={() => setActiveSubDomain(cat.id)}
                >
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          <div
            className={`nav-item ${activeDomain === "C" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("C")}
          >
            C. Clinical & NFPE
          </div>
          <div
            className={`nav-item ${activeDomain === "D" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("D")}
          >
            D. Dietary History
          </div>

          {activeDomain === "D" && (
            <div className="sub-nav">
              {DIETARY_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`}
                  onClick={() => setActiveSubDomain(cat.id)}
                >
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
            <input
              type="text"
              className="search-bar"
              placeholder="Jump to section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Phase 4 will replace this with a proper submit flow */}
          <button className="btn-outline" onClick={handleExitToStart}>Exit Note</button>
        </header>

        <PatientHeader
          patientData={patientData}
          setPatientData={setPatientData}
          clinical={clinical}
        />

        <div className="content-area">
          {activeDomain === "A" && (
            <AnthroDomain
              anthro={anthro}
              setAnthro={setAnthro}
              dexaScans={dexaScans}
              setDexaScans={setDexaScans}
              calculatedMetrics={calculatedMetrics}
              patientData={patientData}
              activeSubDomain={activeSubDomain}
            />
          )}
          {activeDomain === "B" && (
            <BiochemicalDomain
              labs={labs}
              setLabs={setLabs}
              activeSubDomain={activeSubDomain}
            />
          )}
          {activeDomain === "C" && (
            <ClinicalDomain clinical={clinical} setClinical={setClinical} />
          )}
          {activeDomain === "D" && (
            <DietaryDomain
              dietary={dietary}
              setDietary={setDietary}
              activeSubDomain={activeSubDomain}
            />
          )}
        </div>

        {/* Toast */}
        <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
      </main>
    </div>
  );
}