// src/features/intervention/rx-planning/FormulaViabilityPanel.tsx
// Unchanged externally — same props, same onApply signature.
// Internally updated to use v2 FormulaViabilityResult field names.

import React, { useMemo, useState } from "react";
import { useEnteralFormulaStore } from "../../../stores/useEnteralFormulaStore";
import { rankFormulas } from "../../../shared/utils/formulaViability";
import type { FormulaViabilityResult } from "../../../shared/utils/formulaViability";

interface FormulaViabilityPanelProps {
  kcalLow: string;
  kcalHigh: string;
  proteinLow: string;
  proteinHigh: string;
  fluidLow: string;
  fluidHigh: string;
  onApply: (formulaName: string, rateMlHr: number, volMlDay: number) => void;
}

const TIER_CONFIG = {
  great:    { label: "Great fit",  bg: "#f0fdf4", border: "#86efac", text: "#15803d", dot: "#22c55e" },
  good:     { label: "Good fit",   bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", dot: "#3b82f6" },
  marginal: { label: "Marginal",   bg: "#fffbeb", border: "#fcd34d", text: "#92400e", dot: "#f59e0b" },
  poor:     { label: "Poor fit",   bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444" },
};

// Penalty bar — inverted: 0 penalty = full green bar, 100 = empty
function PenaltyBar({ label, penalty, color }: { label: string; penalty: number; color: string }) {
  const fillPct = Math.max(0, 100 - penalty);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
      <span style={{
        fontSize: "0.6rem", color: "#94a3b8", textTransform: "uppercase",
        letterSpacing: "0.04em", flexShrink: 0, width: 42,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${fillPct}%`, height: "100%", background: color,
          borderRadius: 2, transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontSize: "0.62rem", color: "#64748b", flexShrink: 0, width: 26 }}>
        {fillPct}%
      </span>
    </div>
  );
}

function ResultRow({ result, onApply, rank }: {
  result: FormulaViabilityResult;
  onApply: (r: FormulaViabilityResult) => void;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIER_CONFIG[result.tier];

  return (
    <div style={{ border: `1px solid ${cfg.border}`, borderRadius: 8, overflow: "hidden", background: cfg.bg }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer", userSelect: "none" }}
      >
        <span style={{
          flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
          background: rank <= 3 ? cfg.dot : "#e2e8f0",
          color: rank <= 3 ? "#fff" : "#94a3b8",
          fontSize: "0.62rem", fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {rank}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {result.formula.name}
          </div>
          {result.formula.manufacturer && (
            <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{result.formula.manufacturer}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <StatPill label="Vol" value={`${result.optimalVolMl} mL`} />
          <StatPill label="Rate" value={`${result.optimalRateMlHr} mL/hr`} />
          <StatPill label="Prot" value={`${result.actualProteinG}g`} />
          <StatPill label="Kcal" value={`${result.actualKcal}`} />
        </div>

        <div style={{
          flexShrink: 0, textAlign: "center",
          background: cfg.dot, color: "#fff", borderRadius: 6,
          padding: "2px 8px", fontSize: "0.72rem", fontWeight: 800, minWidth: 40,
        }}>
          {result.score}
        </div>

        <span style={{ flexShrink: 0, fontSize: "0.65rem", fontWeight: 700, color: cfg.text, minWidth: 54 }}>
          {cfg.label}
        </span>

        <span style={{ flexShrink: 0, color: "#94a3b8", fontSize: "0.65rem" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${cfg.border}`, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Fit bars — inverted penalty display */}
          <div>
            <div style={{ fontSize: "0.62rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>
              Fit quality per nutrient (higher = closer to target)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <PenaltyBar label="Kcal"    penalty={result.kcalPenalty}    color="#3b82f6" />
              <PenaltyBar label="Protein" penalty={result.proteinPenalty} color="#8b5cf6" />
              <PenaltyBar label="Fluid"   penalty={result.fluidPenalty}   color="#06b6d4" />
            </div>
          </div>

          {/* Detail grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <DetailCell label="Optimal Volume"  value={`${result.optimalVolMl} mL/day`} />
            <DetailCell label="Continuous Rate" value={`${result.optimalRateMlHr} mL/hr`} />
            <DetailCell label="Kcal Delivered"  value={`${result.actualKcal} kcal/day`} />
            <DetailCell label="Protein"         value={`${result.actualProteinG} g/day`} />
            <DetailCell label="Free Water"      value={result.actualFreeWaterMl > 0 ? `${result.actualFreeWaterMl} mL/day` : "—"} />
            <DetailCell label="kcal/mL"         value={result.formula.kcal_per_ml !== null ? `${result.formula.kcal_per_ml}` : "—"} />
          </div>

          {result.flags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {result.flags.map(f => (
                <span key={f} style={{
                  fontSize: "0.65rem", background: "#fef9c3", color: "#92400e",
                  border: "1px solid #fde68a", borderRadius: 4, padding: "1px 6px",
                }}>
                  ⚠ {f}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => onApply(result)}
            style={{
              alignSelf: "flex-end", background: "#3498db", color: "#fff",
              border: "none", borderRadius: 6, padding: "5px 14px",
              fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            Apply to prescription →
          </button>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e293b" }}>{value}</div>
      <div style={{ fontSize: "0.58rem", color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e293b" }}>{value}</div>
    </div>
  );
}

export default function FormulaViabilityPanel({
  kcalLow, kcalHigh, proteinLow, proteinHigh, fluidLow, fluidHigh, onApply,
}: FormulaViabilityPanelProps) {
  const { formulas } = useEnteralFormulaStore();
  const [showAll, setShowAll] = useState(false);
  const [filterTier, setFilterTier] = useState<string>("all");

  const kLow = parseFloat(kcalLow) || 0;
  const kHigh = parseFloat(kcalHigh) || 0;
  const pLow = parseFloat(proteinLow) || 0;
  const pHigh = parseFloat(proteinHigh) || 0;
  const fLow = parseFloat(fluidLow) || 0;
  const fHigh = parseFloat(fluidHigh) || 0;

  const hasTargets = kLow > 0 && kHigh > 0;

  const ranked = useMemo(() => {
    if (!hasTargets) return [];
    return rankFormulas(formulas, {
      kcalLow: kLow, kcalHigh: kHigh,
      proteinLow: pLow, proteinHigh: pHigh,
      fluidLow: fLow > 0 ? fLow : undefined,
      fluidHigh: fHigh > 0 ? fHigh : undefined,
    });
  }, [formulas, kLow, kHigh, pLow, pHigh, fLow, fHigh, hasTargets]);

  if (!hasTargets || formulas.length === 0) return null;

  const filtered = filterTier === "all" ? ranked : ranked.filter(r => r.tier === filterTier);
  const displayed = showAll ? filtered : filtered.slice(0, 4);

  const tierCounts = {
    great:    ranked.filter(r => r.tier === "great").length,
    good:     ranked.filter(r => r.tier === "good").length,
    marginal: ranked.filter(r => r.tier === "marginal").length,
    poor:     ranked.filter(r => r.tier === "poor").length,
  };

  return (
    <div style={{ marginTop: "1rem", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", background: "#fafbfc" }}>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
            Formula Viability
          </div>
          <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>
            {ranked.length} formula{ranked.length !== 1 ? "s" : ""} optimised against your targets
            {pLow > 0 ? ` · protein ${pLow}–${pHigh}g` : ""}
            {fLow > 0 ? ` · fluid ${fLow}–${fHigh} mL` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {([
            { id: "all",      label: `All (${ranked.length})`,          color: "#64748b" },
            { id: "great",    label: `Great (${tierCounts.great})`,     color: "#22c55e" },
            { id: "good",     label: `Good (${tierCounts.good})`,       color: "#3b82f6" },
            { id: "marginal", label: `Marginal (${tierCounts.marginal})`, color: "#f59e0b" },
          ] as const).map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => setFilterTier(id)}
              style={{
                padding: "2px 8px", borderRadius: 12,
                border: `1px solid ${filterTier === id ? color : "#e2e8f0"}`,
                background: filterTier === id ? `${color}18` : "transparent",
                color: filterTier === id ? color : "#94a3b8",
                fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", padding: "1rem 0" }}>
            No formulas in this tier.
          </div>
        ) : (
          <>
            {displayed.map(result => (
              <ResultRow
                key={result.formula.id}
                result={result}
                rank={ranked.indexOf(result) + 1}
                onApply={r => onApply(r.formula.name, r.optimalRateMlHr, r.optimalVolMl)}
              />
            ))}
            {filtered.length > 4 && (
              <button
                onClick={() => setShowAll(s => !s)}
                style={{
                  alignSelf: "center", background: "transparent",
                  border: "1px solid #e2e8f0", color: "#64748b",
                  borderRadius: 20, padding: "3px 14px",
                  fontSize: "0.72rem", cursor: "pointer", marginTop: 2,
                }}
              >
                {showAll ? "Show fewer" : `Show ${filtered.length - 4} more`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}