// src/features/assessment/assess-standards/NutritionStandardsDomain.tsx
// Condition-driven Nutrition Rx Evaluator
// UPDATED: Replaced NutrientScorecardItem with NutrientBarChart (grouped bars + whiskers)
// IC logic: IC trumps weight-based for kcal note; protein note never references IC

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  evaluateNutritionRx,
  calcIBW,
  calcMSJ,
  CONDITION_LABELS,
  CONDITION_VARIANTS,
  CONDITION_EXTRA_INPUTS,
  IC_ACTIVITY_FACTORS,
  MSJ_ACTIVITY_FACTORS,
  EvalStatus,
  EvalResult,
  NutritionEvaluation,
  ConditionKey,
} from "./nutritionStandards";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toKg(val: number, unit: string): number {
  if (unit === "lbs") return val / 2.2046;
  if (unit === "g") return val / 1000;
  return val;
}

function toCm(val: number, unit: string): number {
  if (unit === "in") return val * 2.54;
  return val;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_THEME: Record<EvalStatus, { color: string; bg: string; label: string }> = {
  LOW:  { color: "#2563eb", bg: "#dbeafe", label: "Low" },
  WNL:  { color: "#16a34a", bg: "#dcfce7", label: "WNL" },
  HIGH: { color: "#dc2626", bg: "#fee2e2", label: "High" },
  "N/A": { color: "#64748b", bg: "#f1f5f9", label: "—" },
};

function CompactStatus({ status }: { status: EvalStatus }) {
  const t = STATUS_THEME[status];
  return (
    <span style={{
      background: t.bg, color: t.color,
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const,
      letterSpacing: "0.04em", whiteSpace: "nowrap" as const,
    }}>
      {t.label}
    </span>
  );
}

// ─── Grouped Bar Chart with Whiskers ──────────────────────────────────────────
// One chart covering ALL results. Each nutrient = a pair of horizontal bars:
//   Bar A (TEAL):  Target range midpoint, with error whiskers to low/high
//   Bar B (STATUS-colored): Current intake value
// X-axis is shared across all nutrients (normalized 0–maxVal per nutrient group)

interface NutrientBarChartProps {
  results: EvalResult[];
  icUsedForKcal: boolean;
}

function NutrientBarChart({ results, icUsedForKcal }: NutrientBarChartProps) {
  if (!results.length) return null;

  // Colors
  const TARGET_COLOR = "#2ab3a3";   // teal — always the "needs" bar
  const TARGET_FILL  = "#c8f2ee";
  const STATUS_COLORS: Record<EvalStatus, { bar: string; fill: string; label: string }> = {
    LOW:   { bar: "#3b82f6", fill: "#dbeafe", label: "Low" },
    WNL:   { bar: "#22c55e", fill: "#dcfce7", label: "WNL" },
    HIGH:  { bar: "#ef4444", fill: "#fee2e2", label: "High" },
    "N/A": { bar: "#94a3b8", fill: "#f1f5f9", label: "—" },
  };

  const BAR_HEIGHT = 22;
  const BAR_GAP = 8;        // gap between the two bars in a group
  const GROUP_GAP = 28;     // gap between nutrient groups
  const LEFT_LABEL = 90;    // px reserved for nutrient label
  const RIGHT_PAD = 50;     // px after the longest bar
  const CHART_W = 560;      // total chart content width
  const BAR_AREA = CHART_W - LEFT_LABEL - RIGHT_PAD;
  const TOP_PAD = 12;
  const TICK_LINES = 5;

  // Build per-nutrient data
  const groups = results.map((r) => {
    const rangeMatch = r.target.match(/([\d.]+)(?:–([\d.]+))?/);
    const lo = rangeMatch ? parseFloat(rangeMatch[1]) : 0;
    const hi = rangeMatch && rangeMatch[2] ? parseFloat(rangeMatch[2]) : lo;
    const mid = (lo + hi) / 2;
    const maxVal = Math.max(r.current * 1.25, hi * 1.25, 1);
    return { result: r, lo, hi, mid, maxVal };
  });

  // Layout: compute Y positions
  const rowHeight = BAR_HEIGHT * 2 + BAR_GAP;
  let y = TOP_PAD + 32; // leave room for legend at top
  const rows = groups.map((g) => {
    const yStart = y;
    y += rowHeight + GROUP_GAP;
    return { ...g, yStart };
  });

  const totalH = y + 8;

  // X scale per nutrient (each has its own maxVal for clarity)
  const xScale = (val: number, maxVal: number) =>
    Math.min((val / maxVal) * BAR_AREA, BAR_AREA);

  // Whisker cap height
  const WHISKER_CAP = 6;

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "12px", flexWrap: "wrap" as const, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: TARGET_COLOR }} />
          <span>Target range (midpoint ± bounds)</span>
        </div>
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== "N/A").map(([status, theme]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: theme.bar }} />
            <span>Current intake ({theme.label})</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg
        width="100%"
        viewBox={`0 0 ${CHART_W} ${totalH}`}
        style={{ overflow: "visible" }}
        role="img"
        aria-label={`Grouped bar chart comparing target nutrition ranges to current intake for ${results.map(r => r.label).join(", ")}`}
      >
        {rows.map((row) => {
          const { result, lo, hi, mid, maxVal, yStart } = row;
          const statusTheme = STATUS_COLORS[result.status];
          const xMid = xScale(mid, maxVal);
          const xLo = xScale(lo, maxVal);
          const xHi = xScale(hi, maxVal);
          const xCurrent = xScale(result.current, maxVal);
          const yTarget = yStart;
          const yCurrent = yStart + BAR_HEIGHT + BAR_GAP;

          // Tick positions (5 ticks across bar area)
          const ticks = Array.from({ length: TICK_LINES + 1 }, (_, i) => ({
            x: LEFT_LABEL + (i / TICK_LINES) * BAR_AREA,
            val: Math.round((maxVal * i) / TICK_LINES),
          }));

          return (
            <g key={result.label}>
              {/* Nutrient label */}
              <text
                x={LEFT_LABEL - 8}
                y={yStart + BAR_HEIGHT}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="#334155"
              >
                {result.label}
              </text>

              {/* Gridlines (subtle) */}
              {ticks.map((t, i) => (
                <line
                  key={i}
                  x1={t.x}
                  y1={yStart - 4}
                  x2={t.x}
                  y2={yCurrent + BAR_HEIGHT + 2}
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
              ))}

              {/* ── TARGET BAR (teal) with whisker ── */}
              {/* Full range as a lighter background band */}
              <rect
                x={LEFT_LABEL + xLo}
                y={yTarget}
                width={Math.max(xHi - xLo, 1)}
                height={BAR_HEIGHT}
                fill={TARGET_FILL}
                rx="2"
              />
              {/* Midpoint bar */}
              <rect
                x={LEFT_LABEL}
                y={yTarget}
                width={xMid}
                height={BAR_HEIGHT}
                fill={TARGET_COLOR}
                rx="2"
              />
              {/* Whisker line */}
              <line
                x1={LEFT_LABEL + xLo}
                y1={yTarget + BAR_HEIGHT / 2}
                x2={LEFT_LABEL + xHi}
                y2={yTarget + BAR_HEIGHT / 2}
                stroke={"#000000"}
                strokeWidth="2"
              />
              {/* Whisker caps */}
              <line x1={LEFT_LABEL + xLo} y1={yTarget + BAR_HEIGHT / 2 - WHISKER_CAP / 2} x2={LEFT_LABEL + xLo} y2={yTarget + BAR_HEIGHT / 2 + WHISKER_CAP / 2} stroke={"#000000"} strokeWidth="2" />
              <line x1={LEFT_LABEL + xHi} y1={yTarget + BAR_HEIGHT / 2 - WHISKER_CAP / 2} x2={LEFT_LABEL + xHi} y2={yTarget + BAR_HEIGHT / 2 + WHISKER_CAP / 2} stroke={"#000000"} strokeWidth="2.5" />
              {/* Target range label */}
              <text
                x={LEFT_LABEL + xHi + 6}
                y={yTarget + BAR_HEIGHT / 2}
                dominantBaseline="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {result.target}
              </text>
              {/* "Target" micro-label */}
              <text
                x={LEFT_LABEL + 4}
                y={yTarget + BAR_HEIGHT / 2}
                dominantBaseline="middle"
                fontSize="9"
                fill="white"
                fontWeight="700"
              >
                TARGET
              </text>

              {/* ── CURRENT INTAKE BAR (status-colored) ── */}
              <rect
                x={LEFT_LABEL}
                y={yCurrent}
                width={xCurrent}
                height={BAR_HEIGHT}
                fill={statusTheme.bar}
                rx="2"
              />
              {/* Value label at end */}
              <text
                x={LEFT_LABEL + xCurrent + 6}
                y={yCurrent + BAR_HEIGHT / 2}
                dominantBaseline="middle"
                fontSize="11"
                fill={statusTheme.bar}
                fontWeight="700"
              >
                {Math.round(result.current)}
              </text>
              {/* "Current" micro-label inside bar */}
              {xCurrent > 55 && (
                <text
                  x={LEFT_LABEL + 4}
                  y={yCurrent + BAR_HEIGHT / 2}
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="white"
                  fontWeight="700"
                >
                  CURRENT
                </text>
              )}

              {/* Status badge (foreignObject for HTML rendering) */}
              <foreignObject
                x={CHART_W - RIGHT_PAD + 2}
                y={yCurrent + 2}
                width={RIGHT_PAD - 4}
                height={BAR_HEIGHT - 4}
              >
                <div
                  style={{
                    background: statusTheme.fill,
                    color: statusTheme.bar,
                    borderRadius: 3,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  {statusTheme.label}
                </div>
              </foreignObject>

              {/* Separator line between groups */}
              <line
                x1={LEFT_LABEL - 85}
                y1={yCurrent + BAR_HEIGHT + GROUP_GAP / 2}
                x2={CHART_W - 2}
                y2={yCurrent + BAR_HEIGHT + GROUP_GAP / 2}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Bottom X-axis tick labels (for the last group) */}
        {rows.length > 0 && (() => {
          const lastRow = rows[rows.length - 1];
          const { maxVal, yStart } = lastRow;
          const bottomY = yStart + BAR_HEIGHT * 2 + BAR_GAP + 4;
          const unit = lastRow.result.unit.split("/")[0];
          return Array.from({ length: TICK_LINES + 1 }, (_, i) => (
            <text
              key={i}
              x={LEFT_LABEL + (i / TICK_LINES) * BAR_AREA}
              y={bottomY + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              {Math.round((maxVal * i) / TICK_LINES)}
            </text>
          ));
        })()}
      </svg>

      {/* Per-nutrient "based on" notes */}
      <div style={{ marginTop: "8px", display: "flex", flexDirection: "column" as const, gap: "4px" }}>
        {results.map((r) => {
          // IC trumps any other kcal note; protein note never references IC
          const isKcal = r.label.toLowerCase().includes("energy");
          const noteText = isKcal && icUsedForKcal
            ? `⚡ IC override: ${r.note}`
            : r.note || null;
          return noteText ? (
            <div key={r.label} style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontWeight: 700, color: "#334155", minWidth: 52 }}>{r.label}:</span>
              <span>{noteText}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

// ─── Activity Factor Reference ────────────────────────────────────────────────

function ReferenceToggles() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);

  return (
    <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
      <button onClick={() => toggle('factors')} style={btnRefStyle}>
        {open === 'factors' ? "Hide" : "Show"} Activity Factors
      </button>
      {open === 'factors' && (
        <div style={refPanelStyle}>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
             <div>
                <h5 style={refHeaderStyle}>Clinical Activity Factors (CAF)</h5>
                {IC_ACTIVITY_FACTORS.map((r, i) => (
                  <div key={i} style={refRowStyle}>
                    <span style={{ fontWeight: 600 }}>{r.condition}</span>
                    <span style={{ color: "#2563eb" }}>×{r.cafLow}–{r.cafHigh}</span>
                  </div>
                ))}
             </div>
             <div>
                <h5 style={refHeaderStyle}>MSJ Activity Factors (AF)</h5>
                {MSJ_ACTIVITY_FACTORS.map((r, i) => (
                  <div key={i} style={refRowStyle}>
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    <span style={{ color: "#16a34a" }}>×{r.af}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

const btnRefStyle = { background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", fontSize: "0.7rem", color: "#64748b", cursor: "pointer", fontWeight: 600 };
const refPanelStyle: React.CSSProperties = { position: "absolute", bottom: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", boxShadow: "0 -10px 30px rgba(0,0,0,0.1)", zIndex: 100, marginBottom: "10px" };
const refHeaderStyle = { margin: "0 0 8px", fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" as any, letterSpacing: "0.05em" };
const refRowStyle = { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "4px 0", borderBottom: "1px solid #f1f5f9" };

// ─── Main Component ───────────────────────────────────────────────────────────

interface NutritionStandardsDomainProps {
  anthro: any;
  patientData: any;
  calculatedMetrics: any;
  dietary: any;
  clinical: any;
  standards: any;
  setStandards: (s: any) => void;
}

export default function NutritionStandardsDomain({
  anthro,
  patientData,
  calculatedMetrics,
  dietary,
  clinical,
  standards,
  setStandards,
}: NutritionStandardsDomainProps) {
  if (!standards) return <div>Loading standards...</div>;
  
  const wtKg = useMemo(() => toKg(parseFloat(anthro.wt) || 0, anthro.wtUnit || "kg"), [anthro.wt, anthro.wtUnit]);
  const htCm = useMemo(() => toCm(parseFloat(anthro.ht) || 0, anthro.htUnit || "cm"), [anthro.ht, anthro.htUnit]);
  const sexRaw: "M" | "F" | "" = patientData?.sex || "";
  const sex: "M" | "F" = sexRaw === "F" ? "F" : "M";
  const ageYears = useMemo(() => Math.floor((calculatedMetrics?.ageDays ?? 0) / 365.25), [calculatedMetrics?.ageDays]);
  const bmi = useMemo(() => parseFloat(calculatedMetrics?.bmi) || 0, [calculatedMetrics?.bmi]);

  const [condition, setCondition] = useState<ConditionKey | "">(standards.condition || "");
  const [variant, setVariant] = useState(standards.variant || "");
  const [currentKcal, setCurrentKcal] = useState(standards.currentKcal || "");
  const [currentProtein, setCurrentProtein] = useState(standards.currentProtein || "");
  const [currentFluid, setCurrentFluid] = useState(standards.currentFluid || "");
  const [icKcal, setIcKcal] = useState(standards.icKcal || "");
  const [dryWt, setDryWt] = useState(standards.dryWt || "");
  const [renalDryWeight, setRenalDryWeight] = useState(standards.renalDryWeight || "");
  const [extraInputs, setExtraInputs] = useState<Record<string, string>>(standards.extraInputs || {});
  
  const [evaluation, setEvaluation] = useState<NutritionEvaluation | null>(null);

  const syncToParent = () => {
    setStandards({
      condition, variant, currentKcal, currentProtein, currentFluid,
      icKcal, dryWt, renalDryWeight, extraInputs
    });
  };

  useEffect(() => {
    if (!currentKcal && dietary?.oralCalories) {
      const val = String(Math.round(parseFloat(dietary.oralCalories) || 0) || "");
      setCurrentKcal(val);
    }
    if (!currentProtein && dietary?.oralProtein) {
      const val = String(parseFloat(dietary.oralProtein) || "");
      setCurrentProtein(val);
    }
  }, [dietary]);

  const { effectiveWeight, weightBasis, nfpeWarning } = useMemo(() => {
    if (renalDryWeight) {
      return { effectiveWeight: parseFloat(renalDryWeight), weightBasis: "Renal Dry Weight", nfpeWarning: false };
    }
    if (dryWt) {
      return { effectiveWeight: parseFloat(dryWt), weightBasis: "Dry Weight", nfpeWarning: false };
    }
    let reduction = 0;
    if (clinical.ascites === "Mild") reduction += 0.05;
    else if (clinical.ascites === "Moderate") reduction += 0.10;
    else if (clinical.ascites === "Severe") reduction += 0.15;
    if (clinical.pedalEdema === "Yes") reduction += 0.05;
    const calculatedWeight = wtKg * (1 - reduction);
    const isCirrhosis = condition === "cirrhosis";
    const missingNfpe = isCirrhosis && !clinical.ascites && !clinical.pedalEdema;
    return {
      effectiveWeight: calculatedWeight,
      weightBasis: reduction > 0 ? `Estimated Dry Weight (Actual - ${Math.round(reduction * 100)}%)` : "Actual Weight",
      nfpeWarning: missingNfpe
    };
  }, [renalDryWeight, dryWt, wtKg, condition, clinical]);

  const missingAnthro = useMemo(() => {
    const fields = [];
    if (!sexRaw) fields.push("Sex");
    if (!ageYears) fields.push("Age");
    if (!wtKg) fields.push("Weight");
    if (!htCm) fields.push("Height");
    return fields;
  }, [sexRaw, ageYears, wtKg, htCm]);

  const isReady = missingAnthro.length === 0 && !!condition;

  const runEvaluation = () => {
    if (!isReady) return;
    const result = evaluateNutritionRx({
      condition: condition as ConditionKey,
      variant: variant || undefined,
      patient: { 
        wtKg: effectiveWeight, 
        htCm, 
        ageYears, 
        sex, 
        bmi, 
        weightLabel: weightBasis,
        dryWtKg: dryWt ? parseFloat(dryWt) : undefined, 
        icMeasuredKcal: icKcal ? parseFloat(icKcal) : undefined 
      },
      currentRx: {
        kcalPerDay: parseFloat(currentKcal) || 0,
        proteinGPerDay: parseFloat(currentProtein) || 0,
        fluidMlPerDay: currentFluid ? parseFloat(currentFluid) : undefined
      },
      extraInputs: Object.fromEntries(Object.entries(extraInputs).map(([k, v]) => [k, parseFloat(v) || v])),
    });
    (result as any).weightBasis = weightBasis;
    setEvaluation(result);
  };

  useEffect(() => { 
    if (isReady) runEvaluation(); 
    syncToParent();
  }, [condition, variant, currentKcal, currentProtein, currentFluid, icKcal, dryWt, renalDryWeight, extraInputs, wtKg, htCm, effectiveWeight]);

  const variants = condition ? (CONDITION_VARIANTS[condition] || []) : [];
  const extraFields = condition ? (CONDITION_EXTRA_INPUTS[condition] || []) : [];

  // Determine if IC was used for kcal
  const icUsedForKcal = !!icKcal && parseFloat(icKcal) > 0;

  return (
    <div className="fade-in" style={{ padding: "0.25rem 0", position: "relative" }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.5rem",
      }}>
        <div>
           <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
             <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", color: "#1e293b" }}>Comparative Standards</h3>
           </div>
           <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>Evaluate nutrition prescription against condition-specific evidence.</p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", textAlign: "right" }}>
          <QuickStat label="IBW" value={htCm > 0 ? `${calcIBW(htCm, sex)}kg` : "—"} />
          <QuickStat label="MSJ REE" value={wtKg > 0 && ageYears > 0 ? `${Math.round(calcMSJ(wtKg, htCm, ageYears, sex))}kcal` : "—"} />
          <QuickStat label="BMI" value={bmi > 0 ? bmi.toFixed(1) : "—"} />
        </div>
      </div>

      {/* ── READINESS CHECK ── */}
      {!isReady && (
        <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#854d0e" }}>Evaluation Inactive</div>
              <div style={{ fontSize: "0.72rem", color: "#a16207" }}>
                {missingAnthro.length > 0 
                  ? `Missing: ${missingAnthro.join(", ")} (Update in Header/A1)` 
                  : "Select a condition to begin evaluation."
                }
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem" }}>
        
        {/* ── LEFT COLUMN: INPUTS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div className="card" style={{ padding: "1rem" }}>
            <label style={subHeaderStyle}>1. Clinical Setting</label>
            <div className="input-group">
              <select value={condition} onChange={e => setCondition(e.target.value as ConditionKey)} style={selectStyle}>
                <option value="">Select Condition...</option>
                {Object.entries(CONDITION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            {variants.length > 0 && (
              <div className="input-group">
                <select value={variant} onChange={e => setVariant(e.target.value)} style={selectStyle}>
                  <option value="">Select Sub-type...</option>
                  {variants.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                </select>
              </div>
            )}
            {extraFields.map(f => (
              <div key={f.key} className="input-group">
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b" }}>{f.label}</label>
                <input type={f.type} value={extraInputs[f.key] || ""} onChange={e => setExtraInputs(prev => ({ ...prev, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: "1rem" }}>
            <label style={subHeaderStyle}>2. Current Prescription</label>
            <div className="grid-2-col" style={{ gap: "10px" }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={tinyLabelStyle}>Energy (kcal)</label>
                <input type="number" value={currentKcal} onChange={e => setCurrentKcal(e.target.value)} style={inputStyle} placeholder="1800" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={tinyLabelStyle}>Protein (g)</label>
                <input type="number" value={currentProtein} onChange={e => setCurrentProtein(e.target.value)} style={inputStyle} placeholder="75" />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: "10px" }}>
              <label style={tinyLabelStyle}>Fluid (mL/day)</label>
              <input type="number" value={currentFluid} onChange={e => setCurrentFluid(e.target.value)} style={inputStyle} placeholder="Optional" />
            </div>
          </div>

          <div className="card" style={{ padding: "1rem", background: "#f8fafc" }}>
            <label style={subHeaderStyle}>Advanced Overrides</label>
            {/* IC input with prominent label */}
            <div className="input-group">
              <label style={{ ...tinyLabelStyle, color: icUsedForKcal ? "#b45309" : "#94a3b8" }}>
                {icUsedForKcal ? "⚡ Indirect Calorimetry (mREE) — ACTIVE" : "Indirect Calorimetry (mREE)"}
              </label>
              <input
                type="number"
                value={icKcal}
                onChange={e => setIcKcal(e.target.value)}
                style={{
                  ...inputStyle,
                  border: icUsedForKcal ? "1.5px solid #f59e0b" : inputStyle.border,
                  background: icUsedForKcal ? "#fffbeb" : "#fff",
                }}
                placeholder="Measured kcal"
              />
              {icUsedForKcal && (
                <span style={{ fontSize: "0.62rem", color: "#92400e", marginTop: 2 }}>
                  Overrides weight-based kcal calculation
                </span>
              )}
            </div>
            <div className="input-group">
              <label style={tinyLabelStyle}>Renal Dry Weight (kg)</label>
              <input type="number" value={renalDryWeight} onChange={e => setRenalDryWeight(e.target.value)} style={inputStyle} placeholder="Prescribed (Dialysis)" />
            </div>
            {(condition === "cirrhosis" || condition === "liver_transplant") && (
              <div className="input-group">
                <label style={tinyLabelStyle}>Dry Weight (kg)</label>
                <input type="number" value={dryWt} onChange={e => setDryWt(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: CHART ── */}
        <div>
          {evaluation ? (
            <div className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>Evaluation Results</div>
                <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                  Basis: {evaluation.eeSource} · {weightBasis} ({effectiveWeight.toFixed(1)}kg)
                </div>
              </div>

              {nfpeWarning && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "#92400e", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span>⚠</span>
                    <span><strong>Cirrhosis Alert:</strong> No NFPE (Ascites/Edema) findings recorded. Dry weight assessment recommended.</span>
                  </div>
                </div>
              )}

              <NutrientBarChart
                results={evaluation.results}
                icUsedForKcal={icUsedForKcal}
              />

              {evaluation.flags.length > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "8px", padding: "1rem", marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                    Clinical Guidance
                  </div>
                  {evaluation.flags.map((f, i) => (
                    <div key={i} style={{ fontSize: "0.78rem", color: "#92400e", marginBottom: "6px", display: "flex", gap: "8px" }}>
                      <span>•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: "100%", border: "2px dashed #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚖️</div>
              <div style={{ fontWeight: 600 }}>Awaiting Inputs</div>
              <div style={{ fontSize: "0.75rem", maxWidth: "250px", marginTop: "4px" }}>
                Complete the clinical setting and prescription on the left to see live evaluation.
              </div>
            </div>
          )}
        </div>
      </div>

      <ReferenceToggles />
    </div>
  );
}

// ─── Sub-styles ──────────────────────────────────────────────────────────────

function QuickStat({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>{value}</span>
    </div>
  );
}

const subHeaderStyle = { display: "block", fontSize: "0.72rem", fontWeight: 900, color: "#1e3a5f", textTransform: "uppercase" as any, letterSpacing: "0.06em", marginBottom: "10px" };
const tinyLabelStyle = { fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as any, marginBottom: "4px", display: "block" };
const selectStyle = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" as any, background: "#fff", color: "#1e293b" };
const inputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" };