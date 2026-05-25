// src/pages/CreateNotePage.tsx
// Phase 3: Auto-save wiring
//   • Domain switches (A→B, B→C, etc.) save the outgoing domain before switching.
//   • Sub-domain switches within the same domain also trigger a save.
//   • useRef mirrors are kept for each domain so async callbacks always read
//     the latest state without stale-closure issues.

import React, { useState, useRef, useCallback } from "react";
import type { Patient, Note } from "../shared/api/db";
import { autosaveNote } from "../shared/api/db";

import PatientHeader from "../widgets/PatientHeader";
import AnthroDomain from "../features/assessment/assess-anthro/AnthroDomain";
import BiochemicalDomain from "../features/assessment/assess-biochemical/BiochemicalDomain";
import ClinicalDomain from "../features/assessment/assess-clinical/ClinicalDomain";
import DietaryDomain from "../features/assessment/assess-dietary/DietaryDomain";
import {
  DIETARY_CATEGORIES,
  ASSESSMENT_CATEGORIES,
  BIOCHEMICAL_CATEGORIES,
} from "../shared/constants/adimeSideBarCategories";

interface CreateNotePageProps {
  patientId: string | null;
  noteId: string | null;
  patient: Patient | null;
  note: Note | null;

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

// ─── Domain label map (used in toast messages) ────────────────────────────────
const DOMAIN_LABELS: Record<string, string> = {
  A: "Anthropometrics",
  B: "Biochemical",
  C: "Clinical",
  D: "Dietary",
};

export default function CreateNotePage({
  patientId,
  noteId,
  patient,
  note,
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
  const [isSaving, setIsSaving] = useState(false);

  // ── Refs: always hold the latest domain state for stale-closure-safe saves ──
  // React state updates are async; using refs guarantees the save captures the
  // value that was on screen at the moment the user clicked, not a cached copy.
  const anthroRef    = useRef(anthro);
  const dexaRef      = useRef(dexaScans);
  const labsRef      = useRef(labs);
  const clinicalRef  = useRef(clinical);
  const dietaryRef   = useRef(dietary);

  // Keep refs in sync whenever props change (parent re-renders on every state update)
  anthroRef.current   = anthro;
  dexaRef.current     = dexaScans;
  labsRef.current     = labs;
  clinicalRef.current = clinical;
  dietaryRef.current  = dietary;

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ── Core save function ───────────────────────────────────────────────────────
  // Saves all columns for the given domain using the ref values (latest state).
  // Returns true on success, false on error (so callers can decide whether to
  // still proceed with the navigation).
  const saveDomain = useCallback(
    async (domain: "A" | "B" | "C" | "D"): Promise<boolean> => {
      if (!noteId) return true; // Nothing to save if there's no note yet

      setIsSaving(true);
      try {
        switch (domain) {
          case "A":
            // Domain A spans two columns: anthro + dexa_scans
            await autosaveNote(noteId, "anthro",     anthroRef.current);
            await autosaveNote(noteId, "dexa_scans", dexaRef.current);
            break;
          case "B":
            await autosaveNote(noteId, "labs",     labsRef.current);
            break;
          case "C":
            await autosaveNote(noteId, "clinical", clinicalRef.current);
            break;
          case "D":
            await autosaveNote(noteId, "dietary",  dietaryRef.current);
            break;
        }
        return true;
      } catch (e) {
        console.error(`Autosave failed for domain ${domain}:`, e);
        showToast("⚠ Save failed — check connection");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [noteId]
  );

  // ── Domain switch (top-level nav: A / B / C / D) ─────────────────────────────
  const handleDomainSwitch = async (nextDomain: "A" | "B" | "C" | "D") => {
    if (nextDomain === activeDomain) return;

    // Save the domain we're leaving, then navigate regardless of result
    // (save failure shows its own toast; navigation still happens so the user
    // isn't stuck — the next sub-domain switch will retry)
    const ok = await saveDomain(activeDomain);
    if (ok) showToast(`${DOMAIN_LABELS[activeDomain]} saved ✓`);

    setActiveDomain(nextDomain);

    // Reset sub-domain to the first entry for the new domain
    if (nextDomain === "A") setActiveSubDomain("A1-A5");
    else if (nextDomain === "B") setActiveSubDomain("B1");
    else if (nextDomain === "D") setActiveSubDomain("D1");
    // Domain C has no sub-domains, so nothing to set

    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  // ── Sub-domain switch (within same domain) ────────────────────────────────
  // Saves the current domain before changing the visible panel.
  // This covers B1 → B2, D1 → D2, A1-A5 → A6-A7, etc.
  const handleSubDomainSwitch = async (nextSub: string) => {
    if (nextSub === activeSubDomain) return;

    const ok = await saveDomain(activeDomain);
    if (ok) showToast(`${DOMAIN_LABELS[activeDomain]} saved ✓`);

    setActiveSubDomain(nextSub);
  };

  return (
    <div className="app-layout">
      {/* ── SIDEBAR ── */}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          RD Workstation
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <div className="nav-section">
          {/* Domain A */}
          <div
            className={`nav-item ${activeDomain === "A" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("A")}
          >
            A. Anthropometrics
          </div>
          {activeDomain === "A" && (
            <div className="sub-nav">
              {ASSESSMENT_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`}
                  onClick={() => handleSubDomainSwitch(cat.id)}
                >
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* Domain B */}
          <div
            className={`nav-item ${activeDomain === "B" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("B")}
          >
            B. Biochemical Data
          </div>
          {activeDomain === "B" && (
            <div className="sub-nav">
              {BIOCHEMICAL_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`}
                  onClick={() => handleSubDomainSwitch(cat.id)}
                >
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* Domain C */}
          <div
            className={`nav-item ${activeDomain === "C" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("C")}
          >
            C. Clinical &amp; NFPE
          </div>

          {/* Domain D */}
          <div
            className={`nav-item ${activeDomain === "D" ? "active" : ""}`}
            onClick={() => handleDomainSwitch("D")}
          >
            D. Dietary History
          </div>
          {activeDomain === "D" && (
            <div className="sub-nav">
              {DIETARY_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`}
                  onClick={() => handleSubDomainSwitch(cat.id)}
                >
                  {cat.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN WORKSPACE ── */}
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
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Save status indicator */}
          {isSaving && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Saving…
            </span>
          )}

          <button className="btn-outline" onClick={handleExitToStart}>Exit Note</button>
        </header>

        <PatientHeader
          patient={patient}
          note={note}
          patientData={patientData}
          setPatientData={setPatientData}
          clinical={clinical}
        />

        <div className="content-area">
          {activeDomain === "A" && (
            <AnthroDomain
              anthro={anthro}         setAnthro={setAnthro}
              dexaScans={dexaScans}   setDexaScans={setDexaScans}
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