// src/features/intervention/rx-planning/FormulaViabilityPanel.tsx

import React, { useMemo } from "react";
import { useEnteralFormulaStore } from "../../../stores/useEnteralFormulaStore";
import {
  optimizeEnteralPrescription,
  type OptimizationResult,
  type OptimizationTargets,
} from "../../../shared/utils/formulaOptimizer";

// ── Props ─────────────────────────────────────────────────────────────────────

interface FormulaViabilityPanelProps {
  kcalLow:    string;
  kcalHigh:   string;
  proteinLow: string;
  proteinHigh: string;
  fluidLow:   string;
  fluidHigh:  string;
  onApply: (formulaName: string, rateMlHr: number, volMlDay: number) => void;
}

// ── Condensed Row Component ───────────────────────────────────────────────────

function CondensedRow({
  result,
  onApply,
}: {
  result: OptimizationResult;
  onApply: FormulaViabilityPanelProps["onApply"];
}) {
  const totalVol = result.formulas[0].volumeMl;
  const rate = Math.round((totalVol / 24) * 10) / 10;
  const name = result.formulas[0].formula.name;

  const needsMod = (result.proteinDeficitG ?? 0) > 0;
  const modExceeds = needsMod && result.proteinDeficitG! > (result.proteinHeadroomG ?? 0);

  let badge = null;
  if (modExceeds) {
    badge = (
      <span style={{ color: "#991b1b", background: "#fee2e2", padding: "2px 5px", borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700 }}>
        Infeasible
      </span>
    );
  } else if (needsMod) {
    badge = (
      <span style={{ color: "#92400e", background: "#fef9c3", padding: "2px 5px", borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700 }}>
        +{result.proteinDeficitG}g Mod
      </span>
    );
  } else {
    badge = (
      <span style={{ color: "#166534", background: "#dcfce7", padding: "2px 5px", borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700 }}>
        Fits Targets
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        padding: "6px 10px",
        gap: "8px",
        background: "#fff"
      }}
    >
      {/* Formula Detail */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
          {rate} mL/hr • {totalVol} mL/day • Flush: {result.flushMl} mL
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: "65px", flexShrink: 0 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b" }}>
          {result.totals.kcal} <span style={{ fontSize: "0.6rem", fontWeight: 400, color: "#64748b" }}>kcal</span>
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b" }}>
          {result.totals.protein} <span style={{ fontSize: "0.6rem", fontWeight: 400, color: "#64748b" }}>g</span>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ width: "70px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
        {badge}
      </div>

      {/* Actions */}
      <button
        onClick={() => onApply(name, rate, totalVol)}
        style={{
          background: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          padding: "5px 12px",
          fontSize: "0.7rem",
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0
        }}
      >
        Apply
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FormulaViabilityPanel({
  kcalLow,
  kcalHigh,
  proteinLow,
  proteinHigh,
  fluidLow,
  fluidHigh,
  onApply,
}: FormulaViabilityPanelProps) {
  const formulas = useEnteralFormulaStore((s) => s.formulas);

  // Only render once there are meaningful kcal targets
  const kcalLowNum  = parseFloat(kcalLow);
  const kcalHighNum = parseFloat(kcalHigh);
  if (!kcalLowNum || !kcalHighNum || kcalLowNum > kcalHighNum) return null;

  const optimizerTargets: OptimizationTargets = {
    kcalLow:     kcalLowNum,
    kcalHigh:    kcalHighNum,
    proteinLow:  parseFloat(proteinLow)  || 0,
    proteinHigh: parseFloat(proteinHigh) || 0,
    fluidLow:    parseFloat(fluidLow)    || 0,
    fluidHigh:   parseFloat(fluidHigh)   || 0,
  };

  // Compute the optimal config for *every* formula on the fly
  const results = useMemo(
    () => optimizeEnteralPrescription(formulas, optimizerTargets),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formulas, kcalLow, kcalHigh, proteinLow, proteinHigh, fluidLow, fluidHigh]
  );

  if (results.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "0.75rem",
        border: "1px solid #dbeafe",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#f8faff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "7px 12px",
          background: "#eff6ff",
          borderBottom: "1px solid #dbeafe",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            color: "#1a6fa8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Fitting Formulas
        </span>
      </div>

      <div
        style={{
          padding: "8px 10px",
          maxHeight: 320,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {results.map((r, i) => (
          <CondensedRow
            key={`${r.formulas[0].formula.id}-${i}`}
            result={r}
            onApply={onApply}
          />
        ))}
      </div>
    </div>
  );
}