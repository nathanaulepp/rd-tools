import React from "react";
import { useDiagnosisStore } from "../../stores/useDiagnosisStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryDiagnosisCard() {
  const { diagnosis } = useDiagnosisStore();

  if (!diagnosis?.problem && !(diagnosis?.additionalDiagnoses?.length)) {
    return (
      <SummaryCard title="Dx. Nutrition Diagnosis" color="#2c3e50">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No nutrition diagnoses recorded.</p>
      </SummaryCard>
    );
  }

  const all = [
    { problem: diagnosis?.problem, etiology: diagnosis?.etiology, signsSymptoms: diagnosis?.signsSymptoms },
    ...(diagnosis?.additionalDiagnoses || []),
  ].filter(d => d.problem);

  return (
    <SummaryCard title="Dx. Nutrition Diagnosis" color="#2c3e50">
      {all.map((dx, i) => (
        <div key={i} style={{ 
          marginBottom: "1rem", 
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          pageBreakInside: "avoid"
        }}>
          <div style={styles.pesRow}>
            <div style={styles.chip}>Problem (P)</div>
            <div style={styles.value}>{dx.problem}</div>
          </div>
          {dx.etiology && (
            <div style={{ ...styles.pesRow, borderTop: "1px solid #e2e8f0" }}>
              <div style={styles.chip}>Etiology (E)</div>
              <div style={styles.value}>
                <span style={{ color: "#94a3b8" }}>Related to →</span> {dx.etiology}
              </div>
            </div>
          )}
          {dx.signsSymptoms && (
            <div style={{ ...styles.pesRow, borderTop: "1px solid #e2e8f0" }}>
              <div style={styles.chip}>Signs/Symptoms (S)</div>
              <div style={styles.value}>
                <span style={{ color: "#94a3b8" }}>AEB →</span> {dx.signsSymptoms}
              </div>
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: "1rem" }}>
        <SummaryRow label="First Priority Diagnosis" value={diagnosis?.priorityRanking} />
        <SummaryRow label="Narrative" value={diagnosis?.nutritionDxNarrative} />
      </div>
    </SummaryCard>
  );
}

const styles = {
  pesRow: {
    padding: "0.5rem 0.75rem",
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "flex-start",
  },
  chip: {
    display: "inline-block",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#1e40af",
    background: "#dbeafe",
    padding: "2px 6px",
    borderRadius: "4px",
    marginBottom: "0.35rem",
    textTransform: "uppercase" as any,
  },
  value: {
    fontSize: "0.88rem",
    fontWeight: 500,
    color: "#0f172a",
    lineHeight: 1.4
  }
};
