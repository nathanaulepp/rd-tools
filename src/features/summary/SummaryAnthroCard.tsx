import React from "react";
import { useAnthroStore } from "../../stores/useAnthroStore";
import { useCalculatedMetrics } from "../../stores/useCalculatedMetrics";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryAnthroCard() {
  const { anthro, dexaScans } = useAnthroStore();
  const calculatedMetrics = useCalculatedMetrics();

  const hasSkinfolds = anthro?.triceps || anthro?.subscapular || anthro?.suprailiac || anthro?.thigh;
  const hasPast = anthro?.past_ht || anthro?.past_wt || anthro?.past_head || anthro?.past_htDate || anthro?.past_wtDate;

  return (
    <SummaryCard title="A. Anthropometrics & Body Composition" color="#3498db">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div>
          <h4 style={styles.subGroup}>Current Measurements</h4>
          <SummaryRow label="Height" value={anthro?.ht} unit={anthro?.htUnit} />
          <SummaryRow label="Weight" value={anthro?.wt} unit={anthro?.wtUnit} />
          <SummaryRow label="BMI" value={calculatedMetrics.bmi} unit="kg/m²" />
          <SummaryRow label="UBW" value={anthro?.ubw} unit={anthro?.wtUnit} />
        </div>
        <div>
          <h4 style={styles.subGroup}>Physical Exam Measures</h4>
          <SummaryRow label="Waist Circ" value={anthro?.waist} unit={anthro?.circUnit} />
          <SummaryRow label="Mid-Arm Circ" value={anthro?.mac} unit={anthro?.circUnit} />
          <SummaryRow label="Calf Circ" value={anthro?.calf} unit={anthro?.circUnit} />
          <SummaryRow label="Head Circ" value={anthro?.head} unit={anthro?.circUnit} />
        </div>
      </div>

      {hasSkinfolds && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>Skinfolds</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <SummaryRow label="Triceps Skinfold" value={anthro?.triceps} unit={anthro?.skinfoldUnit} />
              <SummaryRow label="Subscapular Skinfold" value={anthro?.subscapular} unit={anthro?.skinfoldUnit} />
            </div>
            <div>
              <SummaryRow label="Suprailiac Skinfold" value={anthro?.suprailiac} unit={anthro?.skinfoldUnit} />
              <SummaryRow label="Thigh Skinfold" value={anthro?.thigh} unit={anthro?.skinfoldUnit} />
            </div>
          </div>
        </div>
      )}

      {anthro?.isFluidShift && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>Fluid Shift</h4>
          <SummaryRow label="Estimated Dry Weight" value={anthro?.edw} unit={anthro?.edwUnit} />
        </div>
      )}

      {anthro?.amputations && anthro.amputations.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <SummaryRow label="Amputations" value={anthro.amputations.join(", ")} />
        </div>
      )}

      {hasPast && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>Past Measurements</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <SummaryRow label="Past Height" value={anthro?.past_ht} unit={anthro?.past_htUnit} />
              <SummaryRow label="Past Weight" value={anthro?.past_wt} unit={anthro?.past_wtUnit} />
              <SummaryRow label="Past Head Circ" value={anthro?.past_head} unit={anthro?.past_headUnit} />
            </div>
            <div>
              <SummaryRow label="Past Height Date" value={anthro?.past_htDate} />
              <SummaryRow label="Past Weight Date" value={anthro?.past_wtDate} />
            </div>
          </div>
        </div>
      )}

      {dexaScans && dexaScans.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>DEXA Scans</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>BMD</th>
                <th style={styles.th}>Fat Mass</th>
                <th style={styles.th}>Lean Mass</th>
                <th style={styles.th}>Body Fat %</th>
              </tr>
            </thead>
            <tbody>
              {dexaScans.map((s, i) => (
                <tr key={i}>
                  <td style={styles.td}>{s.date}</td>
                  <td style={styles.td}>{s.bmd}</td>
                  <td style={styles.td}>{s.fatMass}</td>
                  <td style={styles.td}>{s.leanMass}</td>
                  <td style={styles.td}>{s.bodyFatPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SummaryCard>
  );
}

const styles = {
  subGroup: { fontSize: "0.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569", textTransform: "uppercase" as any },
  table: { width: "100%", borderCollapse: "collapse" as any, fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left" as any, padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9" },
};
