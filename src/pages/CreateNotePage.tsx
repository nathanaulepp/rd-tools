// src/pages/CreateNotePage.tsx
// Phase 2 refactor: All domain state now comes from Zustand stores.
// No props accepted — this component is a pure store consumer.

import React, { useState, useRef, useCallback, useEffect } from "react";
import { submitNote, deleteNote } from "../shared/api/db";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";

// Stores
import { useNoteStore }         from "../stores/useNoteStore";
import { useUIStore }           from "../stores/useUIStore";
import { useAnthroStore }       from "../stores/useAnthroStore";
import { useLabsStore }         from "../stores/useLabsStore";
import { useClinicalStore }     from "../stores/useClinicalStore";
import { useDietaryStore }      from "../stores/useDietaryStore";
import { useDiagnosisStore }    from "../stores/useDiagnosisStore";
import { useInterventionStore } from "../stores/useInterventionStore";
import { useMonitorEvalStore }  from "../stores/useMonitorEvalStore";
import { useStandardsStore }    from "../stores/useStandardsStore";
import { useCalculatedMetrics } from "../stores/useCalculatedMetrics";

// Feature components (unchanged — they still receive props for now; Phase 3
// will migrate them to read stores directly)
import PatientHeader    from "../widgets/PatientHeader";
import AnthroDomain     from "../features/assessment/assess-anthro/AnthroDomain";
import BiochemicalDomain from "../features/assessment/assess-biochemical/BiochemicalDomain";
import ClinicalDomain   from "../features/assessment/assess-clinical/ClinicalDomain";
import DietaryDomain    from "../features/assessment/assess-dietary/DietaryDomain";
import DiagnosisDomain  from "../features/diagnosis/DiagnosisDomain";
import { processNoteEtiologies } from "../features/diagnosis/etiologyData";
import InterventionDomain from "../features/intervention/InterventionDomain";
import MonitorEvalDomain  from "../features/monitor-evalue/MonitorEvalDomain";
import NutritionStandardsDomain, {
  CrossDomainUpdate,
} from "../features/assessment/assess-standards/NutritionStandardsDomain";

import {
  DIETARY_CATEGORIES,
  ASSESSMENT_CATEGORIES,
  BIOCHEMICAL_CATEGORIES,
  CLINICAL_CATEGORIES,
} from "../shared/constants/adimeSideBarCategories";

// ── Types ─────────────────────────────────────────────────────────────────────

type DomainKey = "A" | "B" | "C" | "D" | "S" | "Dx" | "I" | "ME";

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

const DIETARY_DEBOUNCE_MS = 1200;

// ── Exit Modal ────────────────────────────────────────────────────────────────

interface ExitModalProps {
  onClose: () => void;
  onConfirmExit: () => void;
  onDiscard: () => void;
}

function ExitModal({ onClose, onConfirmExit, onDiscard }: ExitModalProps) {
  useEscapeBackout(onClose);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", borderRadius: "14px", padding: "2rem", maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {!showConfirmDiscard ? (
          <>
            <h3 style={{ margin: "0 0 0.5rem", color: "#0f172a", fontSize: "1.1rem" }}>Exit Documentation?</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
              Your progress has been automatically saved as a draft.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button onClick={onConfirmExit} style={{ ...btnStyles.primary, width: "100%" }}>Save Draft &amp; Exit</button>
              <button onClick={() => setShowConfirmDiscard(true)} style={{ ...btnStyles.outline, color: "#e74c3c", border: "1px solid #e74c3c", width: "100%" }}>Discard &amp; Delete Note</button>
              <button onClick={onClose} style={{ ...btnStyles.outline, border: "none", width: "100%" }}>Cancel (Stay here)</button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ margin: "0 0 0.5rem", color: "#c0392b", fontSize: "1.1rem" }}>⚠️ Delete this note permanently?</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
              This action cannot be undone. All data entered for this session will be lost.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowConfirmDiscard(false)} style={btnStyles.outline}>Wait, Go Back</button>
              <button onClick={onDiscard} style={{ ...btnStyles.primary, background: "#e74c3c" }}>Yes, Delete Permanently</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Submit Modal ──────────────────────────────────────────────────────────────

interface SubmitModalProps {
  state: "confirm" | "saving" | "error" | "success";
  missingFields: string[];
  onConfirm: () => void;
  onClose: () => void;
}

function SubmitModal({ state, missingFields, onConfirm, onClose }: SubmitModalProps) {
  useEscapeBackout(onClose);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", borderRadius: "14px", padding: "2rem", maxWidth: "460px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
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
              {missingFields.map((f) => <li key={f}>{f}</li>)}
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
            <button onClick={onClose} style={{ ...btnStyles.primary, background: "#27ae60" }}>Return to Home</button>
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreateNotePage() {
  // ── Store reads ─────────────────────────────────────────────────────────────
  const {
    noteId,
    patientId,
    activePatient: patient,
    activeNote: note,
    patientData,
    setPatientData,
    noteStatus,
    markSubmitted,
    isSaving,
    saveDomain,
    saveAllDomains,
    handleExitToStart,
  } = useNoteStore();

  const { showToast, sidebarOpen, setSidebarOpen } = useUIStore();

  const { anthro, setAnthro, dexaScans, setDexaScans } = useAnthroStore();
  const { labs, setLabs }                               = useLabsStore();
  const { clinical, setClinical }                       = useClinicalStore();
  const { dietary, setDietary }                         = useDietaryStore();
  const { diagnosis, setDiagnosis }                     = useDiagnosisStore();
  const { intervention, setIntervention }               = useInterventionStore();
  const { monitorEval, setMonitorEval }                 = useMonitorEvalStore();
  const { standards, setStandards }                     = useStandardsStore();

  const calculatedMetrics = useCalculatedMetrics();

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [activeDomain, setActiveDomain]       = useState<DomainKey>("A");
  const [activeSubDomain, setActiveSubDomain] = useState<string>("A1-A5");
  const [modalOpen, setModalOpen]             = useState(false);
  const [exitModalOpen, setExitModalOpen]     = useState(false);
  const [modalState, setModalState]           = useState<"confirm" | "saving" | "error" | "success">("confirm");
  const [missingFields, setMissingFields]     = useState<string[]>([]);

  const isSubmitted = noteStatus === "submitted";

  // ── Escape shortcut ─────────────────────────────────────────────────────────
  const handleExitRequest = useCallback(() => {
    if (isSubmitted) { handleExitToStart(true); return; }
    setExitModalOpen(true);
  }, [isSubmitted, handleExitToStart]);

  useEscapeBackout(handleExitRequest);

  // ── Refs for stale-closure-safe saves ───────────────────────────────────────
  // We keep refs so the debounced dietary save always reads the latest value.
  const dietaryRef   = useRef(dietary);
  const diagnosisRef = useRef(diagnosis);
  dietaryRef.current   = dietary;
  diagnosisRef.current = diagnosis;

  // ── Debounced dietary autosave ──────────────────────────────────────────────
  const dietaryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!noteId) return;
    if (dietaryDebounceRef.current) clearTimeout(dietaryDebounceRef.current);

    dietaryDebounceRef.current = setTimeout(async () => {
      try {
        await saveDomain("dietary", dietaryRef.current);
      } catch (e) {
        console.error("Debounced dietary autosave failed:", e);
        if (activeDomain === "D") showToast("⚠ Dietary save failed — check connection");
      }
    }, DIETARY_DEBOUNCE_MS);

    return () => {
      if (dietaryDebounceRef.current) clearTimeout(dietaryDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietary, noteId]);

  // ── Cross-domain update (Standards → clinical/labs) ─────────────────────────
  const handleCrossDomainUpdate = useCallback(
    ({ domain, key, value }: CrossDomainUpdate) => {
      if (domain === "clinical") {
        setClinical({ [key]: value } as Parameters<typeof setClinical>[0]);
      } else if (domain === "labs") {
        setLabs({
          ...labs,
          [key]: { ...(labs[key] ?? { current: "", historical: "" }), current: value },
        });
      }
    },
    [setClinical, setLabs, labs]
  );

  // ── Domain save helper ──────────────────────────────────────────────────────
  const saveDomainByKey = useCallback(
    async (domain: DomainKey): Promise<boolean> => {
      const keyMap: Partial<Record<DomainKey, Parameters<typeof saveDomain>[0][]>> = {
        A:  ["anthro", "dexa_scans"],
        B:  ["labs"],
        C:  ["clinical"],
        D:  ["dietary"],
        S:  ["standards"],
        Dx: ["diagnosis"],
        I:  ["intervention"],
        ME: ["monitor_evaluate"],
      };

      const keys = keyMap[domain] ?? [];
      for (const key of keys) {
        const ok = await saveDomain(key, undefined); // store getter used inside saveDomain
        if (!ok) return false;
      }
      return true;
    },
    [saveDomain]
  );

  // ── Domain switching ────────────────────────────────────────────────────────
  const handleDomainSwitch = useCallback(
    async (nextDomain: DomainKey) => {
      if (nextDomain === activeDomain) return;
      if (activeDomain === "Dx") processNoteEtiologies(diagnosisRef.current);

      // Flush dietary debounce on domain switch
      if (activeDomain === "D" && dietaryDebounceRef.current) {
        clearTimeout(dietaryDebounceRef.current);
        dietaryDebounceRef.current = null;
      }

      const ok = await saveAllDomains();
      if (ok) showToast(`${DOMAIN_LABELS[activeDomain]} saved ✓`);

      setActiveDomain(nextDomain);

      // Reset sub-domain to first item
      if      (nextDomain === "A")  setActiveSubDomain("A1-A5");
      else if (nextDomain === "B")  setActiveSubDomain("B1");
      else if (nextDomain === "C")  setActiveSubDomain("C1");
      else if (nextDomain === "D")  setActiveSubDomain("D1");
      else                          setActiveSubDomain("");

      if (window.innerWidth <= 768) setSidebarOpen(false);
    },
    [activeDomain, saveAllDomains, showToast, setSidebarOpen]
  );

  const handleSubDomainSwitch = useCallback(
    async (nextSub: string) => {
      if (nextSub === activeSubDomain) return;
      const ok = await saveAllDomains();
      if (ok) showToast(`${DOMAIN_LABELS[activeDomain]} saved ✓`);
      setActiveSubDomain(nextSub);
    },
    [activeSubDomain, activeDomain, saveAllDomains, showToast]
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmitClick = () => {
    if (isSubmitted) return;
    setModalState("confirm");
    setMissingFields([]);
    setModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!noteId || !patientId) return;
    setModalState("saving");

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
        markSubmitted();
        setModalState("success");
      }
    } catch {
      setMissingFields(["An unexpected error occurred. Please try again."]);
      setModalState("error");
    }
  };

  const handleModalClose = () => {
    if (modalState === "success") handleExitToStart(true);
    else setModalOpen(false);
  };

  // ── Exit handlers ───────────────────────────────────────────────────────────
  const handleConfirmExit = async () => {
    setExitModalOpen(false);
    if (dietaryDebounceRef.current) {
      clearTimeout(dietaryDebounceRef.current);
      dietaryDebounceRef.current = null;
    }
    const saved = await saveAllDomains();
    if (saved) handleExitToStart(true);
  };

  const handleConfirmDiscard = async () => {
    if (!noteId) return;
    setExitModalOpen(false);
    try {
      await deleteNote(noteId);
      handleExitToStart(true);
    } catch (e) {
      console.error("Discard failed:", e);
      alert("Failed to delete note. You can try again or save it as a draft.");
    }
  };

  // ── Sidebar categories (filter pediatric A6-A7 for adults) ─────────────────
  const assessmentCategories = ASSESSMENT_CATEGORIES.filter((cat) => {
    if (cat.id === "A6-A7") {
      const isAdult = (calculatedMetrics.ageDays ?? 0) >= 7305;
      return !isAdult;
    }
    return true;
  });

  const singleDomains: { key: DomainKey; label: string }[] = [
    { key: "Dx", label: "Dx. Nutrition Diagnosis" },
    { key: "I",  label: "I. Intervention" },
    { key: "ME", label: "ME. Monitor & Evaluate" },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          RD Workstation
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <div style={{ margin: "0.5rem 0.75rem 0.25rem", fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Assessment
        </div>

        <div className="nav-section">
          {/* A */}
          <div className={`nav-item ${activeDomain === "A" ? "active" : ""}`} onClick={() => handleDomainSwitch("A")}>
            A. Anthropometrics
          </div>
          {activeDomain === "A" && (
            <div className="sub-nav">
              {assessmentCategories.map((cat) => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* B */}
          <div className={`nav-item ${activeDomain === "B" ? "active" : ""}`} onClick={() => handleDomainSwitch("B")}>
            B. Biochemical Data
          </div>
          {activeDomain === "B" && (
            <div className="sub-nav">
              {BIOCHEMICAL_CATEGORIES.map((cat) => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* C */}
          <div className={`nav-item ${activeDomain === "C" ? "active" : ""}`} onClick={() => handleDomainSwitch("C")}>
            C. Clinical &amp; NFPE
          </div>
          {activeDomain === "C" && (
            <div className="sub-nav">
              {CLINICAL_CATEGORIES.map((cat) => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* D */}
          <div className={`nav-item ${activeDomain === "D" ? "active" : ""}`} onClick={() => handleDomainSwitch("D")}>
            D. Dietary Data
          </div>
          {activeDomain === "D" && (
            <div className="sub-nav">
              {DIETARY_CATEGORIES.map((cat) => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? "active" : ""}`} onClick={() => handleSubDomainSwitch(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}

          {/* S */}
          <div className={`nav-item ${activeDomain === "S" ? "active" : ""}`} onClick={() => handleDomainSwitch("S")}>
            Comparative Standards
          </div>

          <div style={{ margin: "0.5rem 0.75rem 0.25rem", fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Diagnosis &amp; Planning
          </div>

          {singleDomains.map(({ key, label }) => (
            <div key={key} className={`nav-item ${activeDomain === key ? "active" : ""}`} onClick={() => handleDomainSwitch(key)}>
              {label}
            </div>
          ))}

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
            <button
              onClick={handleExitRequest}
              style={{ width: "100%", marginTop: "0.75rem", padding: "0.6rem", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
            >
              ⚙ App Settings
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN WORKSPACE ───────────────────────────────────────────────────── */}
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
          onExit={handleExitRequest}
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
            <AnthroDomain
              anthro={anthro}
              setAnthro={setAnthro}
              dexaScans={dexaScans}
              setDexaScans={setDexaScans}
              calculatedMetrics={calculatedMetrics}
              patientData={patientData}
              dietary={dietary}
              activeSubDomain={activeSubDomain}
            />
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
              onCrossDomainUpdate={handleCrossDomainUpdate}
              labs={labs}
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

        {/* Global toast — rendered by useUIStore */}
        <GlobalToast />
      </main>

      {modalOpen && (
        <SubmitModal
          state={modalState}
          missingFields={missingFields}
          onConfirm={handleConfirmSubmit}
          onClose={handleModalClose}
        />
      )}
      {exitModalOpen && (
        <ExitModal
          onClose={() => setExitModalOpen(false)}
          onConfirmExit={handleConfirmExit}
          onDiscard={handleConfirmDiscard}
        />
      )}
    </div>
  );
}

// ── GlobalToast ───────────────────────────────────────────────────────────────
// Renders the most recent toast from useUIStore.
// A single instance of this can live anywhere in the tree; here it's scoped
// to CreateNotePage so it appears in the same position as before.
function GlobalToast() {
  const toasts = useUIStore((s) => s.toasts);
  const latest = toasts[toasts.length - 1];

  return (
    <div className={`toast ${latest ? "show" : ""}`}>
      {latest?.message ?? ""}
    </div>
  );
}