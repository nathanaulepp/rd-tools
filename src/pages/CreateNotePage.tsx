// src/pages/CreateNotePage.tsx
// Phase 6: Added Diagnosis (Dx), Intervention (I), Monitor/Eval (ME) domains
// + Settings link in sidebar
// FIX: Added missing standards/setStandards to props interface and destructuring
// PATCH: Debounced autosave for dietary domain so D12/D13 tab changes persist
//        without requiring an explicit subdomain switch.

import React, { useState, useRef, useCallback, useEffect } from "react";
import type { Patient, Note } from "../shared/api/db";
import { autosaveNote, submitNote } from "../shared/api/db";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";

import PatientHeader from "../widgets/PatientHeader";
import AnthroDomain from "../features/assessment/assess-anthro/AnthroDomain";
import BiochemicalDomain from "../features/assessment/assess-biochemical/BiochemicalDomain";
import ClinicalDomain from "../features/assessment/assess-clinical/ClinicalDomain";
import DietaryDomain from "../features/assessment/assess-dietary/DietaryDomain";
import DiagnosisDomain from "../features/diagnosis/DiagnosisDomain";
import { processNoteEtiologies } from "../features/diagnosis/etiologyData";
import InterventionDomain from "../features/intervention/InterventionDomain";
import MonitorEvalDomain from "../features/monitor-evalue/MonitorEvalDomain";
import NutritionStandardsDomain from "../features/assessment/assess-standards/NutritionStandardsDomain";

import {
  DIETARY_CATEGORIES,
  ASSESSMENT_CATEGORIES,
  BIOCHEMICAL_CATEGORIES,
  CLINICAL_CATEGORIES,
} from "../shared/constants/adimeSideBarCategories";

// ─── Domain type ──────────────────────────────────────────────────────────────
type DomainKey = "A" | "B" | "C" | "D" | "S" | "Dx" | "I" | "ME";

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
  // Phase 6
  diagnosis: any;
  setDiagnosis: (d: any) => void;
  intervention: any;
  setIntervention: (i: any) => void;
  monitorEval: any;
  setMonitorEval: (me: any) => void;
  standards: any;
  setStandards: (s: any) => void;

  calculatedMetrics: any;
  handleExitToStart: () => void;
}

// ─── Domain label map ─────────────────────────────────────────────────────────
const DOMAIN_LABELS: Record<DomainKey, string> = {
  A:  "Anthropometrics",
  B:  "Biochemical",
  C:  "Clinical",
  D:  "Dietary",
  S:  "Nutrition Standards",
  Dx: "Nutrition Diagnosis",
  I:  "Intervention",
  ME: "Monitor & Evaluate",
};

// ─── Debounce delay for background dietary saves (ms) ─────────────────────────
const DIETARY_DEBOUNCE_MS = 1200;

// ─── Submit Modal ─────────────────────────────────────────────────────────────
interface SubmitModalProps {
  state: "confirm" | "saving" | "error" | "success";
  missingFields: string[];
  onConfirm: () => void;
  onClose: () => void;
}

function SubmitModal({ state, missingFields, onConfirm, onClose }: SubmitModalProps) {
  useEscapeBackout(onClose);
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000,
    }}>
      <div style={{
        background: "#fff", borderRadius: "14px", padding: "2rem",
        maxWidth: "460px", width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {state === "confirm" && (
          <>
            <h3 style={{ margin: "0 0 0.5rem", color: "#0f172a", fontSize: "1.1rem" }}>Submit Note?</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
              All domains will be saved and the note marked as <strong>Submitted</strong>.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnStyles.outline}>Cancel</button>
              <button onClick={onConfirm} style={btnStyles.primary}>Save &amp; Submit →</button>
            </div>
          </>
        )}
        {state === "saving" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💾</div>
            <p style={{ margin: 0, fontWeight: 600, color: "#2c3e50" }}>Saving and submitting…</p>
          </div>
        )}
        {state === "error" && (
          <>
            <h3 style={{ margin: "0 0 0.5rem", color: "#c0392b", fontSize: "1.1rem" }}>🚨 Cannot Submit — Missing Required Fields</h3>
            <ul style={{ margin: "0 0 1.25rem", paddingLeft: "1.25rem", listStyle: "disc", color: "#c0392b", fontSize: "0.88rem", lineHeight: 1.8 }}>
              {missingFields.map(f => <li key={f}>{f}</li>)}
            </ul>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", color: "#94a3b8" }}>
              These fields are set in the <strong>Patient Header</strong> or Patient Gate.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnStyles.primary}>OK, I'll Fix It</button>
            </div>
          </>
        )}
        {state === "success" && (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
            <h3 style={{ margin: "0 0 0.4rem", color: "#27ae60" }}>Note Submitted!</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
              The note has been saved and marked as <strong>Submitted</strong>.
            </p>
            <button onClick={onClose} style={{ ...btnStyles.primary, background: "#27ae60" }}>
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyles: Record<string, React.CSSProperties> = {
  primary: { background: "#3498db", color: "#fff", border: "none", padding: "0.55rem 1.25rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" },
  outline: { background: "transparent", color: "#3498db", border: "1px solid #3498db", padding: "0.55rem 1.25rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateNotePage({
  patientId, noteId, patient, note,
  patientData, setPatientData,
  anthro, setAnthro,
  dexaScans, setDexaScans,
  labs, setLabs,
  clinical, setClinical,
  dietary, setDietary,
  diagnosis, setDiagnosis,
  intervention, setIntervention,
  monitorEval, setMonitorEval,
  standards, setStandards,
  calculatedMetrics,
  handleExitToStart,
}: CreateNotePageProps) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDomain, setActiveDomain] = useState<DomainKey>("A");
  const [activeSubDomain, setActiveSubDomain] = useState<string>("A1-A5");
  const [toastMsg, setToastMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState<"confirm" | "saving" | "error" | "success">("confirm");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [noteStatus, setNoteStatus] = useState<"draft" | "submitted">(
    (note?.status as "draft" | "submitted") ?? "draft"
  );

  useEscapeBackout(handleExitToStart);

  // Refs for stale-closure-safe saves
  const anthroRef       = useRef(anthro);
  const dexaRef         = useRef(dexaScans);
  const labsRef         = useRef(labs);
  const clinicalRef     = useRef(clinical);
  const dietaryRef      = useRef(dietary);
  const diagnosisRef    = useRef(diagnosis);
  const interventionRef = useRef(intervention);
  const monitorEvalRef  = useRef(monitorEval);
  const standardsRef    = useRef(standards);

  // Keep refs in sync with latest prop values on every render
  anthroRef.current       = anthro;
  dexaRef.current         = dexaScans;
  labsRef.current         = labs;
  clinicalRef.current     = clinical;
  dietaryRef.current      = dietary;
  diagnosisRef.current    = diagnosis;
  interventionRef.current = intervention;
  monitorEvalRef.current  = monitorEval;
  standardsRef.current    = standards;

  // ── DRY Domain Save Map ──────────────────────────────────────────────────
  const DOMAIN_SAVE_MAP = [
    { domain: "A",  noteKey: "anthro",           ref: anthroRef },
    { domain: "A",  noteKey: "dexa_scans",        ref: dexaRef   },
    { domain: "B",  noteKey: "labs",              ref: labsRef   },
    { domain: "C",  noteKey: "clinical",          ref: clinicalRef },
    { domain: "D",  noteKey: "dietary",           ref: dietaryRef  },
    { domain: "S",  noteKey: "standards",         ref: standardsRef },
    { domain: "Dx", noteKey: "diagnosis",         ref: diagnosisRef },
    { domain: "I",  noteKey: "intervention",      ref: interventionRef },
    { domain: "ME", noteKey: "monitor_evaluate",  ref: monitorEvalRef },
  ] as const;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const saveDomain = useCallback(async (domain: DomainKey): Promise<boolean> => {
    if (!noteId) return true;
    setIsSaving(true);
    try {
      const targets = DOMAIN_SAVE_MAP.filter(d => d.domain === domain);
      for (const target of targets) {
        await autosaveNote(noteId, target.noteKey as any, target.ref.current);
      }
      return true;
    } catch (e) {
      console.error(`Autosave failed for domain ${domain}:`, e);
      showToast("⚠ Save failed — check connection");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [noteId]);

  const saveAllDomains = useCallback(async (): Promise<boolean> => {
    if (!noteId) return true;
    setIsSaving(true);
    try {
      for (const target of DOMAIN_SAVE_MAP) {
        await autosaveNote(noteId, target.noteKey as any, target.ref.current);
      }
      return true;
    } catch (e) {
      console.error("Full save failed:", e);
      showToast("⚠ Save failed — check connection");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [noteId]);

  // ── PATCH: Debounced autosave for the dietary domain ─────────────────────
  // Because D12 and D13 are internal tabs inside the D1 subdomain, switching
  // between them does NOT trigger the normal subdomain-change save path.
  // This effect watches `dietary` and flushes it to SQLite after the user
  // pauses for DIETARY_DEBOUNCE_MS, regardless of which internal tab is active.
  const dietaryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip on initial mount / when there is no note to save to yet
    if (!noteId) return;

    // Cancel any previously scheduled save
    if (dietaryDebounceRef.current) {
      clearTimeout(dietaryDebounceRef.current);
    }

    dietaryDebounceRef.current = setTimeout(async () => {
      try {
        await autosaveNote(noteId, "dietary", dietaryRef.current);
        // Silently succeed — no toast to avoid noise during rapid typing
      } catch (e) {
        console.error("Debounced dietary autosave failed:", e);
        // Only surface an error toast if we're still on the dietary domain
        // so the message is contextually relevant
        if (activeDomain === "D") {
          showToast("⚠ Dietary save failed — check connection");
        }
      }
    }, DIETARY_DEBOUNCE_MS);

    // Clean up on unmount or before next effect run
    return () => {
      if (dietaryDebounceRef.current) {
        clearTimeout(dietaryDebounceRef.current);
      }
    };
    // dietary is the only trigger; activeDomain is captured for the error toast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietary, noteId]);

  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmitClick = () => {
    if (noteStatus === "submitted") return;
    setModalState("confirm");
    setMissingFields([]);
    setModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!noteId || !patientId) return;
    setModalState("saving");

    // Cancel any pending debounced dietary save — we're about to do a full save
    if (dietaryDebounceRef.current) {
      clearTimeout(dietaryDebounceRef.current);
      dietaryDebounceRef.current = null;
    }

    const saved = await saveAllDomains();
    if (!saved) { setModalOpen(false); return; }

    try {
      const result = await submitNote(noteId, patientId);
      if (!result.valid) {
        setMissingFields(result.missingFields);
        setModalState("error");
      } else {
        setNoteStatus("submitted");
        setModalState("success");
      }
    } catch (e) {
      setMissingFields(["An unexpected error occurred. Please try again."]);
      setModalState("error");
    }
  };

  const handleModalClose = () => {
    if (modalState === "success") {
      handleExitToStart();
    } else {
      setModalOpen(false);
    }
  };

  const handleDomainSwitch = async (nextDomain: DomainKey) => {
    if (nextDomain === activeDomain) return;

    if (activeDomain === "Dx") {
      processNoteEtiologies(diagnosisRef.current);
    }

    // For the dietary domain we flush the debounce immediately on switch,
    // then the normal saveDomain call below also persists it. This ensures
    // zero data loss even if the debounce hadn't fired yet.
    if (activeDomain === "D" && dietaryDebounceRef.current) {
      clearTimeout(dietaryDebounceRef.current);
      dietaryDebounceRef.current = null;
    }

    const ok = await saveDomain(activeDomain);
    if (ok) showToast(`${DOMAIN_LABELS[activeDomain]} saved ✓`);
    setActiveDomain(nextDomain);
    if (nextDomain === "A") setActiveSubDomain("A1-A5");
    else if (nextDomain === "B") setActiveSubDomain("B1");
    else if (nextDomain === "C") setActiveSubDomain("C1");
    else if (nextDomain === "D") setActiveSubDomain("D1");
    else setActiveSubDomain("");
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const handleSubDomainSwitch = async (nextSub: string) => {
    if (nextSub === activeSubDomain) return;
    const ok = await saveDomain(activeDomain);
    if (ok) showToast(`${DOMAIN_LABELS[activeDomain]} saved ✓`);
    setActiveSubDomain(nextSub);
  };

  const isSubmitted = noteStatus === "submitted";

  const singleDomains: { key: DomainKey; label: string; badge?: string }[] = [
    { key: "Dx", label: "Dx. Nutrition Diagnosis" },
    { key: "I",  label: "I. Intervention" },
    { key: "ME", label: "ME. Monitor & Evaluate" },
  ];

  return (
    <div className="app-layout">
      {/* ── SIDEBAR ── */}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          RD Workstation
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <div style={{ margin: "0.5rem 0.75rem 0.25rem", fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Assessment
        </div>
        <div className="nav-section">
          {/* Domain A */}
          <div className={`nav-item ${activeDomain === "A" ? "active" : ""}`} onClick={() => handleDomainSwitch("A")}>
            A. Anthropometrics
          </div>
          {activeDomain === "A" && (
            <div className="sub-nav">
              {ASSESSMENT_CATEGORIES
                .filter(cat => {
                  if (cat.id === "A6-A7") {
                    const isAdult = (calculatedMetrics?.ageDays ?? 0) >= 7305;
                    return !isAdult;
                  }
                  return true;
                })
                .map(cat => (
                  <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                    {cat.title}
                  </div>
                ))}
            </div>
          )}

          {/* Domain B */}
          <div className={`nav-item ${activeDomain === "B" ? "active" : ""}`} onClick={() => handleDomainSwitch("B")}>
            B. Biochemical Data
          </div>
          {activeDomain === "B" && (
            <div className="sub-nav">
              {BIOCHEMICAL_CATEGORIES.map(cat => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* Domain C */}
          <div className={`nav-item ${activeDomain === "C" ? "active" : ""}`} onClick={() => handleDomainSwitch("C")}>
            C. Clinical &amp; NFPE
          </div>
          {activeDomain === "C" && (
            <div className="sub-nav">
              {CLINICAL_CATEGORIES.map(cat => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* Domain D */}
          <div className={`nav-item ${activeDomain === "D" ? "active" : ""}`} onClick={() => handleDomainSwitch("D")}>
            D. Dietary Data
          </div>
          {activeDomain === "D" && (
            <div className="sub-nav">
              {DIETARY_CATEGORIES.map(cat => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* Nutrition Standards (S) */}
          <div className={`nav-item ${activeDomain === "S" ? "active" : ""}`} onClick={() => handleDomainSwitch("S")}>
            Comparative Standards
          </div>

          <div style={{ margin: "0.5rem 0.75rem 0.25rem", fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Diagnosis & Planning
          </div>
          {singleDomains.map(({ key, label, badge }) => (
            <div
              key={key}
              className={`nav-item ${activeDomain === key ? "active" : ""}`}
              onClick={() => handleDomainSwitch(key)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>{label}</span>
              {badge && (
                <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "#3498db", color: "#fff", borderRadius: "4px", padding: "1px 5px" }}>
                  {badge}
                </span>
              )}
            </div>
          ))}

          {/* Submit section */}
          <div style={{ margin: "1rem 0.75rem 0.5rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem" }}>
            {isSubmitted ? (
              <div style={{ background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.4)", borderRadius: "8px", padding: "0.6rem 0.75rem", fontSize: "0.78rem", color: "#2ecc71", fontWeight: 700, textAlign: "center" }}>
                ✓ Note Submitted
              </div>
            ) : (
              <button onClick={handleSubmitClick} style={{ width: "100%", padding: "0.6rem", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.83rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}>
                Submit Note
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN WORKSPACE ── */}
      <main className="main-workspace">
        <header className="top-nav">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        </header>

        <PatientHeader
          patient={patient}
          note={note}
          patientData={patientData}
          setPatientData={setPatientData}
          clinical={clinical}
          onExit={handleExitToStart}
          onSubmit={handleSubmitClick}
          isSubmitted={isSubmitted}
          isSaving={isSaving}
        />

        {isSubmitted && (
          <div style={{ background: "#d4edda", borderBottom: "1px solid #c3e6cb", color: "#155724", padding: "0.4rem 0.75rem", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            ✓ This note has been submitted and is read-only. To make changes, create a revision from the Note List.
          </div>
        )}

        <div className="content-area">
          {activeDomain === "A" && (
            <AnthroDomain anthro={anthro} setAnthro={setAnthro} dexaScans={dexaScans} setDexaScans={setDexaScans} calculatedMetrics={calculatedMetrics} patientData={patientData} dietary={dietary} activeSubDomain={activeSubDomain} />
          )}
          {activeDomain === "B" && (
            <BiochemicalDomain labs={labs} setLabs={setLabs} activeSubDomain={activeSubDomain} />
          )}
          {activeDomain === "C" && (
            <ClinicalDomain clinical={clinical} setClinical={setClinical} activeSubDomain={activeSubDomain} />
          )}
          {activeDomain === "D" && (
            <DietaryDomain dietary={dietary} setDietary={setDietary} activeSubDomain={activeSubDomain} clinical={clinical} />
          )}
          {activeDomain === "S" && (
            <NutritionStandardsDomain
              anthro={anthro}
              patientData={patientData}
              calculatedMetrics={calculatedMetrics}
              dietary={dietary}
              clinical={clinical}
              standards={standards}
              setStandards={setStandards}
            />
          )}
          {activeDomain === "Dx" && (
            <DiagnosisDomain
              diagnosis={diagnosis}
              setDiagnosis={setDiagnosis}
              anthro={anthro}
              dietary={dietary}
              clinical={clinical}
              calculatedMetrics={calculatedMetrics}
            />
          )}
          {activeDomain === "I" && (
            <InterventionDomain intervention={intervention} setIntervention={setIntervention} />
          )}
          {activeDomain === "ME" && (
            <MonitorEvalDomain monitorEval={monitorEval} setMonitorEval={setMonitorEval} />
          )}
        </div>

        <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
      </main>

      {modalOpen && (
        <SubmitModal state={modalState} missingFields={missingFields} onConfirm={handleConfirmSubmit} onClose={handleModalClose} />
      )}
    </div>
  );
}