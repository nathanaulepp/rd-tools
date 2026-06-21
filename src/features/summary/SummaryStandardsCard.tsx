import React from "react";
import { useStandardsStore } from "../../stores/useStandardsStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";
import { EvalResult, EvalStatus } from "../../types/standards";
import { useDietaryStore } from "../../stores/useDietaryStore";
import { calculateDietaryTotals } from "../assessment/assess-dietary/helper";

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

function parseRange(target: string): { low: number; high: number } | null {
  if (!target) return null;
  const stripped = target.trim();
  const rangeMatch = stripped.match(/^([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (rangeMatch) {
    const low  = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high)) return { low, high };
  }
  const singleMatch = stripped.match(/^([\d.]+)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (!isNaN(val)) return { low: val, high: val };
  }
  return null;
}

function evalStatus(val: number, low: number, high: number): EvalStatus {
  if (val <= 0) return "N/A";
  if (val < low) return "LOW";
  if (val > high) return "HIGH";
  return "WNL";
}

export default function SummaryStandardsCard() {
  const { standards } = useStandardsStore();
  const dietary = useDietaryStore((s) => s.dietary);

  if (!standards?.condition) return null;
  const snapshot = standards.snapshot;

  const { totalKcal, totalProt, totalFluid } = calculateDietaryTotals(dietary as any);

  const liveKcal = totalKcal > 0 ? String(Math.round(totalKcal)) : "0";
  const liveProtein = totalProt > 0 ? String(Math.round(totalProt * 10) / 10) : "0";
  const liveFluid = totalFluid > 0 ? String(Math.round(totalFluid)) : "0";

  return (
    <SummaryCard title="S. Comparative Standards" color="#16a34a">
      <SummaryRow label="Condition" value={standards.condition} />
      <SummaryRow label="Sub-type / Variant" value={standards.variant} />
      <SummaryRow label="Current Energy Rx" value={liveKcal} unit="kcal/day" />
      <SummaryRow label="Current Protein Rx" value={liveProtein} unit="g/day" />
      <SummaryRow label="Current Fluid Rx" value={liveFluid} unit="mL/day" />
      {standards.icKcal && <SummaryRow label="IC Measured REE" value={standards.icKcal} unit="kcal/day" />}
      
      {snapshot && (
        <>
          <SummaryRow label="EE Source" value={snapshot.eeSource} />
          <SummaryRow label="Weight Used" value={`${snapshot.weightUsedKg}kg (${snapshot.weightLabel})`} />
          
          {snapshot.flags && snapshot.flags.length > 0 && (
            <SummaryRow label="Clinical Flags" value={snapshot.flags.map(formatFlag).join("; ")} />
          )}

          {snapshot.results.map((r: EvalResult, i: number) => {
            let currentVal = r.current;
            let status = r.status;

            if (r.label === "Energy") {
              currentVal = totalKcal > 0 ? Math.round(totalKcal) : 0;
            } else if (r.label === "Protein") {
              currentVal = totalProt > 0 ? Math.round(totalProt * 10) / 10 : 0;
            } else if (r.label === "Fluid") {
              currentVal = Math.round(totalFluid);
            }

            const parsed = parseRange(r.target);
            if (parsed) {
              status = evalStatus(currentVal, parsed.low, parsed.high);
            }

            return (
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
                  {currentVal} {r.unit}
                </span>
                <StatusChip status={status} />
              </div>
            );
          })}

          <SummaryRow label="Evaluated At" value={new Date(snapshot.evaluatedAt).toLocaleString()} />
        </>
      )}
    </SummaryCard>
  );
}

