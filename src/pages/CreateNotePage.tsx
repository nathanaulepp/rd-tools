// src/pages/CreateNotePage.tsx
// Phase 5 refactor: pure layout shell (~60 lines).
//
// All state comes from Zustand stores — zero prop drilling.
// Domain switching triggers automatic saves via effects.

import React, { useRef, useCallback, useEffect } from "react";
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
import RefeedingDomain from "../features/assessment/assess-refeeding/RefeedingDomain";
import InterventionDomain    from "../features/intervention/InterventionDomain";
import MonitorEvalDomain     from "../features/monitor-evalue/MonitorEvalDomain";
import NutritionStandardsDomain from "../features/assessment/assess-standards/NutritionStandardsDomain";

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreateNotePage() {
  // ── Store reads ─────────────────────────────────────────────────────────────
  const {
    noteId,
    patientId,
    noteStatus,
    markSubmitted,
    saveAllDomains,
    handleExitToStart,
  } = useNoteStore();

  const {
    activeDomain,
    activeSubDomain,
    setActiveDomain,
    setActiveSubDomain,
    showToast,
    setSidebarOpen,
    submitModalOpen,
    setSubmitModalOpen,
    exitModalOpen,
    setExitModalOpen,
  } = useUIStore();

  const { diagnosis } = useDiagnosisStore();

  const [modalState, setModalState]       = React.useState<SubmitModalState>("confirm");
  const [missingFields, setMissingFields] = React.useState<string[]>([]);

  // Reset modal state when opened
  useEffect(() => {
    if (submitModalOpen) {
      setModalState("confirm");
      setMissingFields([]);
    }
  }, [submitModalOpen]);

  const isSubmitted = noteStatus === "submitted";

  // AutosaveManager exposes flush via ref
  const autosaveRef = useRef<AutosaveManagerRef>({ flushDietary: () => Promise.resolve() });

  // ── Escape shortcut ─────────────────────────────────────────────────────────
  const handleExitRequest = useCallback(() => {
    if (isSubmitted) { handleExitToStart(true); return; }
    setExitModalOpen(true);
  }, [isSubmitted, handleExitToStart, setExitModalOpen]);

  useEscapeBackout(handleExitRequest);

  // ── Domain switching side-effects ───────────────────────────────────────────
  const prevDomainRef = useRef(activeDomain);
  const prevSubRef    = useRef(activeSubDomain);

  useEffect(() => {
    const triggerSave = async () => {
      if (prevDomainRef.current === activeDomain && prevSubRef.current === activeSubDomain) return;

      if (prevDomainRef.current === "Dx") processNoteEtiologies(diagnosis);

      // AutosaveManager flushes dietary if we're leaving domain D
      await autosaveRef.current.flushDietary();

      const ok = await saveAllDomains();
      if (ok) showToast(`${prevDomainRef.current} saved ✓`);

      prevDomainRef.current = activeDomain;
      prevSubRef.current    = activeSubDomain;
    };

    triggerSave();
  }, [activeDomain, activeSubDomain, saveAllDomains, showToast, diagnosis]);

  // Scroll to the domain section when activeDomain changes via sidebar click
  useEffect(() => {
    const el = document.getElementById(`domain-${activeDomain}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeDomain]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!noteId || !patientId) return;
    setModalState("saving");

    await autosaveRef.current.flushDietary();
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
    await autosaveRef.current.flushDietary();
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <AutosaveManager managerRef={autosaveRef} activeDomain={activeDomain} />

      <Sidebar
        onSubmitClick={() => setSubmitModalOpen(true)}
        onExitRequest={handleExitRequest}
      />

      <main className="main-workspace">
        <header className="top-nav">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        </header>

        <PatientHeader />

        {isSubmitted && (
          <div style={submittedBanner}>
            ✓ This note has been submitted and is read-only. To make changes, create a revision from the Note List.
          </div>
        )}

        <div className="content-area">
          <section id="domain-A" style={{ scrollMarginTop: "1rem" }}>
            <AnthroDomain />
          </section>
          <section id="domain-B" style={{ scrollMarginTop: "1rem" }}>
            <BiochemicalDomain />
          </section>
          <section id="domain-C" style={{ scrollMarginTop: "1rem" }}>
            <ClinicalDomain />
          </section>
          <section id="domain-D" style={{ scrollMarginTop: "1rem" }}>
            <DietaryDomain />
          </section>
          <section id="domain-S" style={{ scrollMarginTop: "1rem" }}>
            <NutritionStandardsDomain />
          </section>
          <section id="domain-RF" style={{ scrollMarginTop: "1rem" }}>
            <RefeedingDomain />
          </section>
          <section id="domain-Dx" style={{ scrollMarginTop: "1rem" }}>
            <DiagnosisDomain />
          </section>
          <section id="domain-I" style={{ scrollMarginTop: "1rem" }}>
            <InterventionDomain />
          </section>
          <section id="domain-ME" style={{ scrollMarginTop: "1rem" }}>
            <MonitorEvalDomain />
          </section>
        </div>

        <GlobalToast />
      </main>

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