// src/pages/CreateNotePage.tsx
// Phase 3 refactor: pure layout shell (~90 lines).
//
// All modals, autosave logic, and sidebar nav live in dedicated widgets.
// All state comes from Zustand stores — zero prop drilling.

import React, { useState, useRef, useCallback, useEffect } from "react";
import { submitNote, deleteNote } from "../shared/api/db";
import { useEscapeBackout }       from "../shared/utils/ShortcutContext";

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

// Widgets
import Sidebar, { DomainKey }              from "../widgets/Sidebar";
import PatientHeader                       from "../widgets/PatientHeader";
import ExitModal                           from "../widgets/ExitModal";
import SubmitModal, { SubmitModalState }   from "../widgets/SubmitModal";
import AutosaveManager, { AutosaveManagerRef } from "../widgets/AutosaveManager";

// Domain features
import AnthroDomain          from "../features/assessment/assess-anthro/AnthroDomain";
import BiochemicalDomain     from "../features/assessment/assess-biochemical/BiochemicalDomain";
import ClinicalDomain        from "../features/assessment/assess-clinical/ClinicalDomain";
import DietaryDomain         from "../features/assessment/assess-dietary/DietaryDomain";
import DiagnosisDomain       from "../features/diagnosis/DiagnosisDomain";
import { processNoteEtiologies } from "../features/diagnosis/etiologyData";
import InterventionDomain    from "../features/intervention/InterventionDomain";
import MonitorEvalDomain     from "../features/monitor-evalue/MonitorEvalDomain";
import NutritionStandardsDomain from "../features/assessment/assess-standards/NutritionStandardsDomain";

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreateNotePage() {
  // ── Store reads ─────────────────────────────────────────────────────────────
  const {
    noteId,
    patientId,
    activePatient: patient,
    activeNote:    note,
    patientData,
    setPatientData,
    noteStatus,
    markSubmitted,
    isSaving,
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
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen]     = useState(false);
  const [modalState, setModalState]           = useState<SubmitModalState>("confirm");
  const [missingFields, setMissingFields]     = useState<string[]>([]);

  const isSubmitted = noteStatus === "submitted";

  // AutosaveManager exposes flush + cross-domain handler via ref
  const autosaveRef = useRef<AutosaveManagerRef>({ flushDietary: () => {} });

  // Stable ref to diagnosis for processNoteEtiologies on domain switch
  const diagnosisRef = useRef(diagnosis);
  diagnosisRef.current = diagnosis;

  // ── Escape shortcut ─────────────────────────────────────────────────────────
  const handleExitRequest = useCallback(() => {
    if (isSubmitted) { handleExitToStart(true); return; }
    setExitModalOpen(true);
  }, [isSubmitted, handleExitToStart]);

  useEscapeBackout(handleExitRequest);

  // ── Domain switching ────────────────────────────────────────────────────────
  const handleDomainSwitch = useCallback(
    async (nextDomain: DomainKey) => {
      if (nextDomain === activeDomain) return;
      if (activeDomain === "Dx") processNoteEtiologies(diagnosisRef.current);

      // AutosaveManager flushes dietary if we're leaving domain D
      autosaveRef.current.flushDietary();

      const ok = await saveAllDomains();
      if (ok) showToast(`${activeDomain} saved ✓`);

      setActiveDomain(nextDomain);
      setActiveSubDomain(
        nextDomain === "A" ? "A1-A5"
        : nextDomain === "B" ? "B1"
        : nextDomain === "C" ? "C1"
        : nextDomain === "D" ? "D1"
        : ""
      );

      if (window.innerWidth <= 768) setSidebarOpen(false);
    },
    [activeDomain, saveAllDomains, showToast, setSidebarOpen]
  );

  const handleSubDomainSwitch = useCallback(
    async (nextSub: string) => {
      if (nextSub === activeSubDomain) return;
      const ok = await saveAllDomains();
      if (ok) showToast(`${activeDomain} saved ✓`);
      setActiveSubDomain(nextSub);
    },
    [activeSubDomain, activeDomain, saveAllDomains, showToast]
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmitClick = () => {
    if (isSubmitted) return;
    setModalState("confirm");
    setMissingFields([]);
    setSubmitModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!noteId || !patientId) return;
    setModalState("saving");

    autosaveRef.current.flushDietary();
    const saved = await saveAllDomains();
    if (!saved) { setSubmitModalOpen(false); return; }

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
    else setSubmitModalOpen(false);
  };

  // ── Exit handlers ───────────────────────────────────────────────────────────
  const handleConfirmExit = async () => {
    setExitModalOpen(false);
    autosaveRef.current.flushDietary();
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

  // Cross-domain update handler (Standards → clinical/labs)
  // AutosaveManager stores this — we retrieve it when needed
  const handleCrossDomainUpdate = useCallback((update: Parameters<typeof setClinical>[0] extends infer U ? any : any) => {
    (autosaveRef.current as any).handleCrossDomainUpdate?.(update);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* Invisible autosave orchestrator */}
      <AutosaveManager managerRef={autosaveRef} activeDomain={activeDomain} />

      {/* Sidebar */}
      <Sidebar
        activeDomain={activeDomain}
        activeSubDomain={activeSubDomain}
        onDomainSwitch={handleDomainSwitch}
        onSubDomainSwitch={handleSubDomainSwitch}
        onSubmitClick={handleSubmitClick}
        onExitRequest={handleExitRequest}
      />

      {/* Main workspace */}
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
          <div style={submittedBanner}>
            ✓ This note has been submitted and is read-only. To make changes, create a revision from the Note List.
          </div>
        )}

        <div className="content-area">
          <DomainRenderer
            activeDomain={activeDomain}
            activeSubDomain={activeSubDomain}
            // domain state
            anthro={anthro} setAnthro={setAnthro}
            dexaScans={dexaScans} setDexaScans={setDexaScans}
            labs={labs} setLabs={setLabs}
            clinical={clinical} setClinical={setClinical}
            dietary={dietary} setDietary={setDietary}
            diagnosis={diagnosis} setDiagnosis={setDiagnosis}
            intervention={intervention} setIntervention={setIntervention}
            monitorEval={monitorEval} setMonitorEval={setMonitorEval}
            standards={standards} setStandards={setStandards}
            patientData={patientData}
            calculatedMetrics={calculatedMetrics}
            onCrossDomainUpdate={handleCrossDomainUpdate}
          />
        </div>

        <GlobalToast />
      </main>

      {/* Modals */}
      {submitModalOpen && (
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

// ── DomainRenderer ────────────────────────────────────────────────────────────
// Isolated to its own function to keep CreateNotePage readable.
// Phase 4 will migrate each domain to read from stores directly, removing props.

interface DomainRendererProps {
  activeDomain: DomainKey;
  activeSubDomain: string;
  anthro: any; setAnthro: any;
  dexaScans: any; setDexaScans: any;
  labs: any; setLabs: any;
  clinical: any; setClinical: any;
  dietary: any; setDietary: any;
  diagnosis: any; setDiagnosis: any;
  intervention: any; setIntervention: any;
  monitorEval: any; setMonitorEval: any;
  standards: any; setStandards: any;
  patientData: any;
  calculatedMetrics: any;
  onCrossDomainUpdate: any;
}

function DomainRenderer({
  activeDomain, activeSubDomain,
  anthro, setAnthro, dexaScans, setDexaScans,
  labs, setLabs,
  clinical, setClinical,
  dietary, setDietary,
  diagnosis, setDiagnosis,
  intervention, setIntervention,
  monitorEval, setMonitorEval,
  standards, setStandards,
  patientData, calculatedMetrics, onCrossDomainUpdate,
}: DomainRendererProps) {
  switch (activeDomain) {
    case "A":
      return (
        <AnthroDomain
          anthro={anthro} setAnthro={setAnthro}
          dexaScans={dexaScans} setDexaScans={setDexaScans}
          calculatedMetrics={calculatedMetrics}
          patientData={patientData}
          dietary={dietary}
          activeSubDomain={activeSubDomain}
        />
      );
    case "B":
      return <BiochemicalDomain labs={labs} setLabs={setLabs} activeSubDomain={activeSubDomain} />;
    case "C":
      return <ClinicalDomain clinical={clinical} setClinical={setClinical} activeSubDomain={activeSubDomain} />;
    case "D":
      return <DietaryDomain dietary={dietary} setDietary={setDietary} activeSubDomain={activeSubDomain} clinical={clinical} />;
    case "S":
      return (
        <NutritionStandardsDomain
          anthro={anthro}
          patientData={patientData}
          calculatedMetrics={calculatedMetrics}
          dietary={dietary}
          clinical={clinical}
          standards={standards}
          setStandards={setStandards}
          onCrossDomainUpdate={onCrossDomainUpdate}
          labs={labs}
        />
      );
    case "Dx":
      return (
        <DiagnosisDomain
          diagnosis={diagnosis} setDiagnosis={setDiagnosis}
          anthro={anthro} dietary={dietary}
          clinical={clinical} calculatedMetrics={calculatedMetrics}
        />
      );
    case "I":
      return <InterventionDomain intervention={intervention} setIntervention={setIntervention} />;
    case "ME":
      return <MonitorEvalDomain monitorEval={monitorEval} setMonitorEval={setMonitorEval} />;
    default:
      return null;
  }
}

// ── GlobalToast ───────────────────────────────────────────────────────────────

function GlobalToast() {
  const toasts = useUIStore((s) => s.toasts);
  const latest = toasts[toasts.length - 1];
  return (
    <div className={`toast ${latest ? "show" : ""}`}>
      {latest?.message ?? ""}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const submittedBanner: React.CSSProperties = {
  background: "#d4edda",
  borderBottom: "1px solid #c3e6cb",
  color: "#155724",
  padding: "0.4rem 0.75rem",
  fontSize: "0.78rem",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};