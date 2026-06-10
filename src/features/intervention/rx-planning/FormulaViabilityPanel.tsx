// src/features/intervention/rx-planning/FormulaViabilityPanel.tsx
//
// Shown inside NpEnteralSection once kcal targets are populated.
//
// Two complementary views in one panel:
//
//   Tab 1 — "Ranked Formulas"
//     Uses rankFormulas() from formulaViability.ts (variational scorer).
//     Shows every formula in the formulary ranked by viability score so the
//     clinician can quickly see which formulas fit single-formula prescriptions.
//
//   Tab 2 — "Suggest Blend"
//     Uses optimizeEnteralPrescription() from formulaOptimizer.ts (grid search).
//     Runs once on demand and returns the globally optimal single or 50/50-blend
//     prescription including the ideal flush volume.
//
// onApply(formulaName, rateMlHr, volMlDay) is called when the clinician
// accepts a result from either tab — it back-fills the NP-1.2.3 fields.

import React, { useMemo, useState } from "react";
import { useEnteralFormulaStore } from "../../../stores/useEnteralFormulaStore";
import {
  rankFormulas,
  type FormulaViabilityResult,
  type ViabilityTargets,
} from "../../../shared/utils/formulaViability";
import {
  optimizeEnteralPrescription,
  MODULAR_KCAL_PER_G,
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
  /** Back-fills formula name + infusion rate + daily volume in NP-1.2.3 */
  onApply: (formulaName: string, rateMlHr: number, volMlDay: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_META: Record<
  FormulaViabilityResult["tier"],
  { color: string; bg: string; label: string }
> = {
  great:    { color: "#166534", bg: "#dcfce7", label: "Great"    },
  good:     { color: "#1a6fa8", bg: "#e6f4ff", label: "Good"     },
  marginal: { color: "#92400e", bg: "#fef3c7", label: "Marginal" },
  poor:     { color: "#991b1b", bg: "#fee2e2", label: "Poor"     },
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "#22c55e" :
    score >= 65 ? "#3498db" :
    score >= 40 ? "#f59e0b" :
    "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s ease",
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color, minWidth: 28 }}>
        {score}
      </span>
    </div>
  );
}

// ── Ranked Formulas tab ───────────────────────────────────────────────────────

interface RankedTabProps {
  ranked: FormulaViabilityResult[];
  onApply: FormulaViabilityPanelProps["onApply"];
}

function RankedTab({ ranked, onApply }: RankedTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (ranked.length === 0) {
    return (
      <div style={emptyState}>
        No formulas in the formulary have sufficient data to score.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {ranked.map((r) => {
        const meta = TIER_META[r.tier];
        const isOpen = expanded === r.formula.id;

        return (
          <div
            key={r.formula.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "7px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* Header row */}
            <div
              onClick={() => setExpanded(isOpen ? null : r.formula.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                cursor: "pointer",
                background: isOpen ? "#f8faff" : "#fff",
              }}
            >
              {/* Tier badge */}
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  color: meta.color,
                  background: meta.bg,
                  borderRadius: "4px",
                  padding: "1px 6px",
                  flexShrink: 0,
                }}
              >
                {meta.label.toUpperCase()}
              </span>

              {/* Name */}
              <span
                style={{
                  flex: 1,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.formula.name}
              </span>

              {/* Score bar */}
              <div style={{ width: 80, flexShrink: 0 }}>
                <ScoreBar score={r.score} />
              </div>

              <span style={{ fontSize: "0.65rem", color: "#94a3b8", flexShrink: 0 }}>
                {isOpen ? "▲" : "▼"}
              </span>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div
                style={{
                  padding: "8px 10px",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {/* Nutrient deliveries */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "4px",
                  }}
                >
                  <MiniStat label="Vol/day" value={`${r.optimalVolMl} mL`} />
                  <MiniStat label="Rate" value={`${r.optimalRateMlHr} mL/hr`} />
                  <MiniStat label="Kcal" value={`${r.actualKcal}`} />
                  <MiniStat label="Protein" value={`${r.actualProteinG}g`} />
                </div>

                {/* Per-nutrient penalty bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <PenaltyRow label="Kcal fit"    penalty={r.kcalPenalty}    />
                  <PenaltyRow label="Protein fit" penalty={r.proteinPenalty} />
                  <PenaltyRow label="Fluid fit"   penalty={r.fluidPenalty}   />
                </div>

                {/* Flags */}
                {r.flags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                    {r.flags.map((f) => (
                      <span
                        key={f}
                        style={{
                          fontSize: "0.65rem",
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                          borderRadius: "4px",
                          padding: "1px 5px",
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Apply button */}
                <button
                  onClick={() =>
                    onApply(r.formula.name, r.optimalRateMlHr, r.optimalVolMl)
                  }
                  style={applyBtn}
                >
                  ↙ Apply to Prescription
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>{value}</div>
      <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{label}</div>
    </div>
  );
}

function PenaltyRow({ label, penalty }: { label: string; penalty: number }) {
  // Penalty 0 = perfect fit, 100 = worst. Invert for display.
  const fitPct = Math.max(0, 100 - penalty);
  const color =
    fitPct >= 85 ? "#22c55e" :
    fitPct >= 60 ? "#f59e0b" :
    "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "0.62rem", color: "#64748b", width: 64, flexShrink: 0 }}>
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fitPct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ fontSize: "0.6rem", color, minWidth: 28, textAlign: "right" }}>
        {fitPct}%
      </span>
    </div>
  );
}

// ── Suggest Blend tab ─────────────────────────────────────────────────────────

interface BlendTabProps {
  targets: OptimizationTargets;
  onApply: FormulaViabilityPanelProps["onApply"];
}

function BlendTab({ targets, onApply }: BlendTabProps) {
  const formulas = useEnteralFormulaStore((s) => s.formulas);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [ran, setRan] = useState(false);

  function runOptimizer() {
    const r = optimizeEnteralPrescription(formulas, targets);
    setResult(r);
    setRan(true);
  }

  if (!ran) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>
          Runs a grid search over all formulas (and 50/50 blends) to find the
          combination that best satisfies your kcal, protein, and fluid targets
          with an optimised flush volume.
        </p>
        <button onClick={runOptimizer} style={primaryBtn}>
          ▶ Run Blend Optimizer
        </button>
      </div>
    );
  }

  if (!result || !result.feasible) {
    return (
      <div style={{ ...emptyState, padding: "1rem" }}>
        No feasible result found. Check that the formulary has formulas with
        complete macronutrient data, and that kcal low ≤ kcal high.
        <br />
        <button onClick={runOptimizer} style={{ ...primaryBtn, marginTop: "0.75rem" }}>
          ↺ Retry
        </button>
      </div>
    );
  }

  const isBlend  = result.formulas.length > 1;
  const totalVol = result.formulas.reduce((s, f) => s + f.volumeMl, 0);
  const rateMlHr = Math.round((totalVol / 24) * 10) / 10;
  const blendName = result.formulas.map((f) => f.formula.name).join(" + ");

  // Modular supplementation guidance
  const needsModular  = (result.proteinDeficitG ?? 0) > 0;
  const hasHeadroom   = result.proteinHeadroomG !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px 0" }}>
      {/* Result header */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "10px 12px",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "#166534",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "4px",
          }}
        >
          {isBlend ? "Optimal Blend Found" : "Optimal Single Formula Found"}
        </div>

        {result.formulas.map((f) => (
          <div
            key={f.formula.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.83rem",
              marginBottom: "2px",
            }}
          >
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{f.formula.name}</span>
            <span style={{ color: "#64748b" }}>{f.volumeMl} mL</span>
          </div>
        ))}

        {isBlend && (
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
            50/50 blend — each formula delivered in equal kcal proportion
          </div>
        )}
      </div>

      {/* Totals grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        <MiniStat label="Total vol" value={`${totalVol} mL`} />
        <MiniStat label="Rate"      value={`${rateMlHr} mL/hr`} />
        <MiniStat label="Flush"     value={`${result.flushMl} mL`} />
        <MiniStat label="Kcal"      value={`${result.totals.kcal}`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <MiniStat label="Formula protein" value={`${result.totals.protein}g`} />
        <MiniStat label="Free water"      value={`${result.totals.fluid} mL`} />
      </div>

      {/* Protein modular guidance
          The optimizer uses a ceiling-only protein penalty, so formula protein
          is always ≤ proteinHigh.  If it's also below the floor, we show exactly
          how much modular is safe to add without breaching the ceiling. */}
      
      {/* Deficit exceeds what kcal budget allows — genuinely infeasible */}
      {needsModular &&
        result.proteinHeadroomG !== null &&
        result.proteinDeficitG! > result.proteinHeadroomG && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: "7px", padding: "8px 10px",
          fontSize: "0.78rem", color: "#991b1b", lineHeight: 1.5,
        }}>
          <strong>⛔ Modular target unreachable at this kcal ceiling.</strong><br />
          Need <strong>{result.proteinDeficitG}g</strong> modular
          (+{Math.round(result.proteinDeficitG! * MODULAR_KCAL_PER_G)} kcal) but only{" "}
          <strong>{result.proteinHeadroomG}g</strong> modular
          fits within the {targets.kcalHigh} kcal ceiling.
          Consider raising the kcal target or selecting a higher-protein formula.
        </div>
      )}

      {/* Feasible deficit — modular fits within both ceilings */}
      {needsModular &&
        result.proteinHeadroomG !== null &&
        result.proteinDeficitG! <= result.proteinHeadroomG && (
        <div
          style={{
            background: "#fef9c3",
            border: "1px solid #fde68a",
            borderRadius: "7px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "3px",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#92400e" }}>
            ⚠ Protein modular required
          </div>
          <div style={{ fontSize: "0.78rem", color: "#78350f", lineHeight: 1.5 }}>
            Formula delivers <strong>{result.totals.protein}g</strong> protein.
            Add <strong>{result.proteinDeficitG}g</strong> modular to reach the
            target floor.
          </div>
          <div style={{ fontSize: "0.72rem", color: "#92400e" }}>
            Safe modular range: 0 – <strong>{result.proteinHeadroomG}g</strong>
            {" "}(ceiling is {Math.round((result.totals.protein + result.proteinHeadroomG!) * 10) / 10}g total)
          </div>
        </div>
      )}

      {/* If formula protein already meets or exceeds the floor */}
      {!needsModular && result.proteinDeficitG !== null && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "7px",
            padding: "6px 10px",
            fontSize: "0.72rem",
            color: "#166534",
          }}
        >
          ✓ Formula protein meets target — no modular needed
          {hasHeadroom && result.proteinHeadroomG! > 0 && (
            <span style={{ color: "#64748b" }}>
              {" "}(up to {result.proteinHeadroomG}g modular still safe)
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={() => onApply(blendName, rateMlHr, totalVol)}
          style={{ ...applyBtn, flex: 1 }}
        >
          ↙ Apply to Prescription
        </button>
        <button
          onClick={() => { setRan(false); setResult(null); }}
          style={{
            background: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "0.75rem",
            color: "#64748b",
            cursor: "pointer",
            padding: "4px 10px",
          }}
        >
          ↺ Reset
        </button>
      </div>
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
  const [tab, setTab] = useState<"ranked" | "blend">("ranked");

  // Only render once there are meaningful kcal targets
  const kcalLowNum  = parseFloat(kcalLow);
  const kcalHighNum = parseFloat(kcalHigh);
  if (!kcalLowNum || !kcalHighNum || kcalLowNum > kcalHighNum) return null;

  const viabilityTargets: ViabilityTargets = {
    kcalLow:     kcalLowNum,
    kcalHigh:    kcalHighNum,
    proteinLow:  parseFloat(proteinLow)  || 0,
    proteinHigh: parseFloat(proteinHigh) || 0,
    fluidLow:    parseFloat(fluidLow)    || 0,
    fluidHigh:   parseFloat(fluidHigh)   || 0,
  };

  const optimizerTargets: OptimizationTargets = {
    kcalLow:     kcalLowNum,
    kcalHigh:    kcalHighNum,
    proteinLow:  parseFloat(proteinLow)  || 0,
    proteinHigh: parseFloat(proteinHigh) || 0,
    fluidLow:    parseFloat(fluidLow)    || 0,
    fluidHigh:   parseFloat(fluidHigh)   || 0,
  };

  // Ranked results are memoized against the formulary + targets
  const ranked = useMemo(
    () => rankFormulas(formulas, viabilityTargets),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      formulas,
      kcalLow, kcalHigh,
      proteinLow, proteinHigh,
      fluidLow, fluidHigh,
    ]
  );

  return (
    <div
      style={{
        marginTop: "0.75rem",
        border: "1px solid #dbeafe",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Formula Viability
        </span>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "4px" }}>
          {(["ranked", "blend"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "#3498db" : "transparent",
                color: tab === t ? "#fff" : "#64748b",
                border: `1px solid ${tab === t ? "#3498db" : "#e2e8f0"}`,
                borderRadius: "5px",
                padding: "2px 10px",
                fontSize: "0.7rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t === "ranked" ? "Ranked Formulas" : "Suggest Blend"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      <div style={{ padding: "10px 12px", maxHeight: 400, overflowY: "auto" }}>
        {tab === "ranked" ? (
          <RankedTab ranked={ranked} onApply={onApply} />
        ) : (
          <BlendTab targets={optimizerTargets} onApply={onApply} />
        )}
      </div>
    </div>
  );
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const applyBtn: React.CSSProperties = {
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "5px 12px",
  fontSize: "0.75rem",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "6px 18px",
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyState: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#94a3b8",
  fontStyle: "italic",
  textAlign: "center",
  padding: "1rem",
};