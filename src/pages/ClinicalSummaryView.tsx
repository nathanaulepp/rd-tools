// src/pages/ClinicalSummaryView.tsx
import React, { CSSProperties } from "react";
import { useNoteStore } from "../stores/useNoteStore";
import {
  SummaryPatientBanner,
  SummaryAnthroCard,
  SummaryBiochemCard,
  SummaryClinicalCard,
  SummaryDietaryCard,
  SummaryDiagnosisCard,
  SummaryInterventionCard,
  SummaryMonitorEvalCard,
  SummaryStandardsCard,
  SummaryRefeedingCard
} from "../features/summary";

interface ClinicalSummaryViewProps {
  handleExitToStart: () => void;
}

export default function ClinicalSummaryView({ handleExitToStart }: ClinicalSummaryViewProps) {
  const { activePatient: patient, activeNote: note } = useNoteStore();

  if (!patient || !note) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        No note data available.
      </div>
    );
  }

  return (
    <div style={styles.container} className="print-safe-container">
      <SummaryPatientBanner handleExitToStart={handleExitToStart} />

      <div style={styles.page} className="printable-note">
        <SummaryAnthroCard />
        <SummaryBiochemCard />
        <SummaryClinicalCard />
        <SummaryDietaryCard />
        <SummaryStandardsCard />
        <SummaryRefeedingCard />
        <SummaryDiagnosisCard />
        <SummaryInterventionCard />
        <SummaryMonitorEvalCard />

        <div style={styles.footer}>
          <div style={styles.signatureRow}>
            <span>Electronically Submitted: {note.submitted_at ? new Date(note.submitted_at).toLocaleString() : "---"}</span>
            <span style={styles.signatureLine}>Registered Dietitian Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { background: "#f1f5f9", minHeight: "100vh", paddingBottom: "2rem" },
  page: { background: "#fff", maxWidth: "850px", margin: "0 auto", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "8px", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", lineHeight: 1.5 },
  footer: { marginTop: "3rem" },
  signatureRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "0.8rem", color: "#64748b" },
  signatureLine: { width: "250px", borderTop: "1px solid #cbd5e1", paddingTop: "0.5rem", textAlign: "center", fontWeight: 700, color: "#475569" },
};
