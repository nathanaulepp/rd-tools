import React from "react";
import { useStandardsStore } from "../../stores/useStandardsStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";
import { EvalResult } from "../../types/standards";

function formatFlag(s: string): string {
  if (s.includes("PSU 2003b:") || s.includes("Penn State 2003b:")) {
    const match = s.match(/=\s*(\d+)\s*kcal/i);
    if (match) {
      return `PSU 2003b → ${match[1]} kcal`;
    }
  }
  if (s.length > 80) {
    return s.substring(0, 80) + "…";
  }
  return s;
}

function StatusChip({ status }: { status: "WNL" | "LOW" | "HIGH" | "NONE" | string }) {
  if (!status || status === "NONE") return null;
  let color = "#64748b";
  let bg = "#f1f5f9";
  if (status === "WNL") {
    color = "#16a34a"; bg = "#dcfce7";
  } else if (status === "LOW") {
    color = "#d97706"; bg = "#fef3c7";
  } else if (status === "HIGH") {
    color = "#dc2626"; bg = "#fee2e2";
  }
  return (
    <span className="status-chip" style={{
      display: "inline-block",
      marginLeft: "8px",
      fontSize: "0.65rem",
      fontWeight: 800,
      color,
      backgroundColor: bg,
      padding: "2px 6px",
      borderRadius: "4px"
    }}>
      {status}
    </span>
  );
}

export default function SummaryStandardsCard() {
  const { standards } = useStandardsStore();

  if (!standards?.condition) return null;
  const snapshot = standards.snapshot;

  return (
    <SummaryCard title="S. Comparative Standards" color="#16a34a">
      <SummaryRow label="Condition" value={standards.condition} />
      <SummaryRow label="Sub-type / Variant" value={standards.variant} />
      <SummaryRow label="Current Energy Rx" value={standards.currentKcal} unit="kcal/day" />
      <SummaryRow label="Current Protein Rx" value={standards.currentProtein} unit="g/day" />
      <SummaryRow label="Current Fluid Rx" value={standards.currentFluid} unit="mL/day" />
      {standards.icKcal && <SummaryRow label="IC Measured REE" value={standards.icKcal} unit="kcal/day" />}
      
      {snapshot && (
        <>
          <SummaryRow label="EE Source" value={snapshot.eeSource} />
          <SummaryRow label="Weight Used" value={`${snapshot.weightUsedKg}kg (${snapshot.weightLabel})`} />
          
          {snapshot.flags && snapshot.flags.length > 0 && (
            <SummaryRow label="Clinical Flags" value={snapshot.flags.map(formatFlag).join("; ")} />
          )}

          {snapshot.results.map((r: EvalResult, i: number) => (
            <div key={i} style={{
              borderBottom: i < snapshot.results.length - 1
                ? "1px solid #f1f5f9"
                : "none"
            }}>
              <span style={{ 
                fontSize: "0.65rem", 
                textTransform: "uppercase", 
                letterSpacing: "0.06em", 
                color: "#94a3b8", 
                fontWeight: 600,
                width: "120px",
                flexShrink: 0,
                marginRight: "1rem"
              }}>
                {r.label}:
              </span>
              <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500, color: "#0f172a" }}>
                {r.target}
              </span>
              <span style={{ fontSize: "0.82rem", color: "#64748b", marginRight: "0.75rem", marginLeft: "1rem" }}>
                {r.current} {r.unit}
              </span>
              <StatusChip status={r.status} />
            </div>
          ))}

          <SummaryRow label="Evaluated At" value={new Date(snapshot.evaluatedAt).toLocaleString()} />
        </>
      )}
    </SummaryCard>
  );
}

const styles = {
  subGroup: { fontSize: "0.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569", textTransform: "uppercase" as any },
};
