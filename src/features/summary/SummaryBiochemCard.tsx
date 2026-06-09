import React from "react";
import { useLabsStore } from "../../stores/useLabsStore";
import { GLOBAL_LAB_CATALOG } from "../../shared/data/biochemicalCatalog";
import { SummaryCard } from "./SummaryShared";

export default function SummaryBiochemCard() {
  const { labs, activeLabKeys } = useLabsStore();

  if (!activeLabKeys || activeLabKeys.length === 0) {
    return (
      <SummaryCard title="B. Biochemical Data" color="#e74c3c">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No biochemical data recorded.</p>
      </SummaryCard>
    );
  }

  // Group by panel
  const groups: Record<string, string[]> = {};
  activeLabKeys.forEach(key => {
    const entry = GLOBAL_LAB_CATALOG[key];
    if (!entry) return;
    if (!labs[key]?.current && !labs[key]?.historical) return;

    if (!groups[entry.panel]) groups[entry.panel] = [];
    groups[entry.panel].push(key);
  });

  const panels = Object.keys(groups);
  if (panels.length === 0) {
    return (
      <SummaryCard title="B. Biochemical Data" color="#e74c3c">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No biochemical data recorded.</p>
      </SummaryCard>
    );
  }

  return (
    <SummaryCard title="B. Biochemical Data" color="#e74c3c">
      {panels.map(panelName => (
        <div key={panelName} style={{ marginBottom: "1rem" }}>
          <h4 style={styles.subGroup}>{panelName}</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Test</th>
                <th style={styles.th}>Unit</th>
                <th style={styles.th}>Historical</th>
                <th style={styles.th}>Current</th>
              </tr>
            </thead>
            <tbody>
              {groups[panelName].map(key => {
                const entry = GLOBAL_LAB_CATALOG[key];
                return (
                  <tr key={key}>
                    <td style={styles.td}><strong>{entry?.name || key}</strong></td>
                    <td style={styles.td}>{entry?.defaultUnit || "---"}</td>
                    <td style={styles.td}>{labs[key]?.historical || "---"}</td>
                    <td style={styles.td}>{labs[key]?.current || "---"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </SummaryCard>
  );
}

const styles = {
  subGroup: { fontSize: "0.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569", textTransform: "uppercase" as any },
  table: { width: "100%", borderCollapse: "collapse" as any, fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left" as any, padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9" },
};
