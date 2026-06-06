// src/features/assessment/assess-standards/NutritionStandardsDomain.tsx
// Phase 5: Reads all stores directly. No props for domain state.

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  evaluateNutritionRx,
  calcIBW,
  calcMSJ,
  calcSchofieldBMR,
  CONDITION_LABELS,
  CONDITION_VARIANTS,
  CONDITION_EXTRA_INPUTS,
  IC_ACTIVITY_FACTORS,
  MSJ_ACTIVITY_FACTORS,
} from "../../../shared/utils/nutrition-engine/nutritionStandards";
import type { EvaluateResult } from "../../../shared/utils/nutrition-engine/nutritionStandards";
import type {
  EvalStatus,
  EvalResult,
  NutritionEvaluation,
  ConditionKey,
} from "../../../types/standards";
import { PalSlider, PalSliderPeds } from "./PalSlider";

import { useStandardsStore } from "../../../stores/useStandardsStore";
import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useNoteStore } from "../../../stores/useNoteStore";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { useLabsStore } from "../../../stores/useLabsStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import { classifyPediatricWeightStatus } from "../../../shared/utils/pediatricWeightStatus";

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

// ─── Grouped Bar Chart with Whiskers ──────────────────────────────────────────

interface NutrientBarChartProps {
  results: EvalResult[];
  icUsedForKcal: boolean;
  eeSource?: string;
}

function NutrientBarChart({ results, icUsedForKcal, eeSource }: NutrientBarChartProps) {
  if (!results.length) return null;

  const TARGET_COLOR = "#2ab3a3";
  const TARGET_FILL  = "#c8f2ee";
  const STATUS_COLORS: Record<EvalStatus, { bar: string; fill: string; label: string }> = {
    LOW:   { bar: "#3b82f6", fill: "#dbeafe", label: "Low" },
    WNL:   { bar: "#22c55e", fill: "#dcfce7", label: "WNL" },
    HIGH:  { bar: "#ef4444", fill: "#fee2e2", label: "High" },
    "N/A": { bar: "#94a3b8", fill: "#f1f5f9", label: "—" },
  };

  const BAR_HEIGHT = 22;
  const BAR_GAP = 8;
  const GROUP_GAP = 28;
  const LEFT_LABEL = 90;
  const RIGHT_PAD = 50;
  const CHART_W = 560;
  const BAR_AREA = CHART_W - LEFT_LABEL - RIGHT_PAD;
  const TOP_PAD = 12;
  const TICK_LINES = 5;
  const WHISKER_CAP = 6;

  const groups = results.map((r) => {
    const rangeMatch = r.target.match(/([\d.]+)(?:–([\d.]+))?/);
    const lo = rangeMatch ? parseFloat(rangeMatch[1]) : 0;
    const hi = rangeMatch && rangeMatch[2] ? parseFloat(rangeMatch[2]) : lo;
    const mid = (lo + hi) / 2;
    const maxVal = Math.max(r.current * 1.25, hi * 1.25, 1);
    return { result: r, lo, hi, mid, maxVal };
  });

  let y = TOP_PAD + 32;
  const rows = groups.map((g) => {
    const yStart = y;
    y += BAR_HEIGHT * 2 + BAR_GAP + GROUP_GAP;
    return { ...g, yStart };
  });

  const totalH = y + 8;
  const xScale = (val: number, maxVal: number) =>
    Math.min((val / maxVal) * BAR_AREA, BAR_AREA);

  const energySourceLabel = eeSource || "MSJ×AF";

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
        {eeSource && eeSource !== "MSJ×AF" && (
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#92400e", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px", padding: "2px 8px" }}>
            EE via {energySourceLabel}
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <svg
        width="100%"
        viewBox={`0 0 ${CHART_W} ${totalH}`}
        style={{ overflow: "visible" }}
        role="img"
        aria-label="Grouped bar chart comparing target nutrition ranges to current intake"
      >
        {rows.map((row) => {
          const { result, lo, hi, mid, maxVal, yStart } = row;
          const statusTheme = STATUS_COLORS[result.status];
          const xMid = xScale(mid, maxVal);
          const xLo = xScale(lo, maxVal);
          const xHi = xScale(hi, maxVal);
          const xCurrent = xScale(result.current, maxVal);
          const yCurrent = yStart;
          const yTarget = yStart + BAR_HEIGHT + BAR_GAP;

          const ticks = Array.from({ length: TICK_LINES + 1 }, (_, i) => ({
            x: LEFT_LABEL + (i / TICK_LINES) * BAR_AREA,
            val: Math.round((maxVal * i) / TICK_LINES),
          }));

          return (
            <g key={result.label}>
              <text x={LEFT_LABEL - 8} y={yStart + BAR_HEIGHT} textAnchor="end" dominantBaseline="middle" fontSize="12" fontWeight="600" fill="#334155">
                {result.label}
              </text>
              {ticks.map((t, i) => (
                <line key={i} x1={t.x} y1={yStart - 4} x2={t.x} y2={yTarget + BAR_HEIGHT + 2} stroke="#e2e8f0" strokeWidth="0.5" />
              ))}

              {/* CURRENT BAR (TOP) */}
              <rect x={LEFT_LABEL} y={yCurrent} width={xCurrent} height={BAR_HEIGHT} fill={statusTheme.bar} rx="2" />
              <text x={LEFT_LABEL + xCurrent + 6} y={yCurrent + BAR_HEIGHT / 2} dominantBaseline="middle" fontSize="11" fill={statusTheme.bar} fontWeight="700">{Math.round(result.current)}</text>
              {xCurrent > 55 && (
                <text x={LEFT_LABEL + 4} y={yCurrent + BAR_HEIGHT / 2} dominantBaseline="middle" fontSize="9" fill="white" fontWeight="700">CURRENT</text>
              )}
              <foreignObject x={CHART_W - RIGHT_PAD + 2} y={yCurrent + 2} width={RIGHT_PAD - 4} height={BAR_HEIGHT - 4}>
                <div style={{ background: statusTheme.fill, color: statusTheme.bar, borderRadius: 3, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
                  {statusTheme.label}
                </div>
              </foreignObject>

              {/* TARGET RANGE (BOTTOM) */}
              <rect x={LEFT_LABEL + xLo} y={yTarget} width={Math.max(xHi - xLo, 1)} height={BAR_HEIGHT} fill={TARGET_FILL} rx="2" />
              <rect x={LEFT_LABEL} y={yTarget} width={xMid} height={BAR_HEIGHT} fill={TARGET_COLOR} rx="2" />
              <line x1={LEFT_LABEL + xLo} y1={yTarget + BAR_HEIGHT / 2} x2={LEFT_LABEL + xHi} y2={yTarget + BAR_HEIGHT / 2} stroke="#000000" strokeWidth="2" />
              <line x1={LEFT_LABEL + xLo} y1={yTarget + BAR_HEIGHT / 2 - WHISKER_CAP / 2} x2={LEFT_LABEL + xLo} y2={yTarget + BAR_HEIGHT / 2 + WHISKER_CAP / 2} stroke="#000000" strokeWidth="2" />
              <line x1={LEFT_LABEL + xHi} y1={yTarget + BAR_HEIGHT / 2 - WHISKER_CAP / 2} x2={LEFT_LABEL + xHi} y2={yTarget + BAR_HEIGHT / 2 + WHISKER_CAP / 2} stroke="#000000" strokeWidth="2.5" />
              <text x={LEFT_LABEL + xHi + 6} y={yTarget + BAR_HEIGHT / 2} dominantBaseline="middle" fontSize="10" fill="#64748b" fontWeight="500">{result.target}</text>
              <text x={LEFT_LABEL + 4} y={yTarget + BAR_HEIGHT / 2} dominantBaseline="middle" fontSize="9" fill="white" fontWeight="700">TARGET</text>

              <line x1={LEFT_LABEL - 85} y1={yTarget + BAR_HEIGHT + GROUP_GAP / 2} x2={CHART_W - 2} y2={yTarget + BAR_HEIGHT + GROUP_GAP / 2} stroke="#f1f5f9" strokeWidth="1" />
            </g>
          );
        })}

        {rows.length > 0 && (() => {
          const lastRow = rows[rows.length - 1];
          const { maxVal, yStart } = lastRow;
          const bottomY = yStart + BAR_HEIGHT * 2 + BAR_GAP + 4;
          return Array.from({ length: TICK_LINES + 1 }, (_, i) => (
            <text key={i} x={LEFT_LABEL + (i / TICK_LINES) * BAR_AREA} y={bottomY + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {Math.round((maxVal * i) / TICK_LINES)}
            </text>
          ));
        })()}
      </svg>

      {/* Per-nutrient notes */}
      <div style={{ marginTop: "8px", display: "flex", flexDirection: "column" as const, gap: "4px" }}>
        {results.map((r) => {
          const isKcal = r.label.toLowerCase().includes("energy");
          const noteText = isKcal && icUsedForKcal
            ? `⚡ ${energySourceLabel} override: ${r.note}`
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
    <div style={{ marginTop: "1rem", display: "flex", gap: "10px", position: "relative" }}>
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

const btnRefStyle: React.CSSProperties = { background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", fontSize: "0.7rem", color: "#64748b", cursor: "pointer", fontWeight: 600 };
const refPanelStyle: React.CSSProperties = { position: "absolute", bottom: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", boxShadow: "0 -10px 30px rgba(0,0,0,0.1)", zIndex: 100, marginBottom: "10px" };
const refHeaderStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" };
const refRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "4px 0", borderBottom: "1px solid #f1f5f9" };

// ─── PSU Info Banner ──────────────────────────────────────────────────────────

function PSUBanner({ eeSource }: { eeSource: string }) {
  if (eeSource === "PSU 2003b") {
    return (
      <div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", borderRadius: "8px", padding: "0.65rem 1rem", marginBottom: "1rem", fontSize: "0.75rem", color: "#4c1d95", lineHeight: 1.5 }}>
        <strong>Penn State 2003b:</strong> MSJ REE × 0.96 + T<sub>max</sub>(°C) × 167 + V<sub>E</sub> × 31 − 6212.
        Indicated for mechanically ventilated adults with BMI &lt; 30 (or obese &lt; 60 y).
      </div>
    );
  }
  if (eeSource === "PSU 2010") {
    return (
      <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "0.65rem 1rem", marginBottom: "1rem", fontSize: "0.75rem", color: "#6b21a8", lineHeight: 1.5 }}>
        <strong>Penn State 2010:</strong> MSJ REE × 0.71 + V<sub>E</sub> × 64 + T<sub>max</sub>(°C) × 85 − 3085.
        Indicated for mechanically ventilated <strong>obese adults (BMI ≥ 30) aged ≥ 60 years</strong>.
      </div>
    );
  }
  return null;
}

// ─── Extra-input renderer ──────────────────────────────────────────────────────

interface ExtraInputRendererProps {
  condition: ConditionKey | "";
  variant: string;
  extraInputs: Record<string, string>;
  setExtraInputs: (ei: Record<string, string>) => void;
  ageYears: number;
  sex: "M" | "F";
}

function ExtraInputRenderer({
  condition,
  variant,
  extraInputs,
  setExtraInputs,
  ageYears,
  sex,
}: ExtraInputRendererProps) {
  const { clinical, setClinical } = useClinicalStore();
  const { labs, setLabs } = useLabsStore();

  if (!condition) return null;
  const fields = CONDITION_EXTRA_INPUTS[condition as ConditionKey] || [];
  if (fields.length === 0) return null;

  const handleChange = (key: string, value: string, autoPullFrom?: string) => {
    setExtraInputs({ ...extraInputs, [key]: value });

    if (autoPullFrom) {
      const [domain, fieldKey] = autoPullFrom.split(".");
      if (domain === "clinical") {
        setClinical({ [fieldKey]: value } as any);
      } else if (domain === "labs") {
        setLabs({
          ...labs,
          [fieldKey]: { ...(labs[fieldKey] ?? { current: "", historical: "" }), current: value },
        });
      }
    }
  };

  const getAutoPulledValue = (autoPullFrom?: string): string => {
    if (!autoPullFrom) return "";
    const [domain, fieldKey] = autoPullFrom.split(".");
    if (domain === "clinical") return (clinical as any)[fieldKey] || "";
    if (domain === "labs") return labs[fieldKey]?.current || "";
    return "";
  };

  return (
    <>
      {fields.map(f => {
        // Metadata-driven visibility checks
        if (f.minAge !== undefined && ageYears < f.minAge) return null;
        if (f.maxAge !== undefined && ageYears > f.maxAge) return null;
        if (f.sex && f.sex !== sex) return null;
        if (f.onlyForVariants && !f.onlyForVariants.includes(variant)) return null;

        // PSU fields only show when mech vent is checked
        if (condition === "critical_illness" && (f.key === "tempMax" || f.key === "ve")) {
          if (extraInputs.isMechVent !== "true") return null;
        }

        const autoPulledRaw = getAutoPulledValue(f.autoPullFrom);
        const currentVal = extraInputs[f.key] ?? autoPulledRaw;

        if (f.type === "checkbox") {
          return (
            <div key={f.key} className="input-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id={`extra-${f.key}`}
                checked={currentVal === "true"}
                onChange={e => handleChange(f.key, e.target.checked ? "true" : "false", f.autoPullFrom)}
                style={{ width: "auto", margin: 0 }}
              />
              <label htmlFor={`extra-${f.key}`} style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#334155", cursor: "pointer", textTransform: "none" }}>
                {f.label}
              </label>
            </div>
          );
        }

        const isPulled = !extraInputs[f.key] && !!autoPulledRaw;

        return (
          <div key={f.key} className="input-group">
            <label style={{ ...tinyLabelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{f.label}</span>
              {isPulled && (
                <span style={{ fontSize: "0.6rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: "4px", padding: "1px 5px", fontWeight: 700 }}>
                  auto-pulled
                </span>
              )}
            </label>
            <input
              type="number"
              value={currentVal}
              onChange={e => handleChange(f.key, e.target.value, f.autoPullFrom)}
              placeholder={f.hint || ""}
              style={{
                ...inputStyle,
                borderColor: isPulled ? "#93c5fd" : "#e2e8f0",
                background: isPulled ? "#eff6ff" : "#fff",
              }}
            />
            {f.hint && <span style={{ fontSize: "0.62rem", color: "#94a3b8", marginTop: 2 }}>{f.hint}</span>}
          </div>
        );
      })}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NutritionStandardsDomain() {
  const { standards, setStandards, setSnapshot } = useStandardsStore();
  const { anthro } = useAnthroStore();
  const { patientData } = useNoteStore();
  const calculatedMetrics = useCalculatedMetrics();
  const { dietary } = useDietaryStore();
  const { clinical } = useClinicalStore();
  const { labs } = useLabsStore();

  if (!standards) return <div>Loading standards...</div>;

  const wtKg = useMemo(() => toKg(parseFloat(anthro.wt) || 0, anthro.wtUnit || "kg"), [anthro.wt, anthro.wtUnit]);
  const htCm = useMemo(() => toCm(parseFloat(anthro.ht) || 0, anthro.htUnit || "cm"), [anthro.ht, anthro.htUnit]);
  const sexRaw = (patientData?.sex || "") as "M" | "F" | "";
  const sex: "M" | "F" = sexRaw === "F" ? "F" : "M";
  const ageYears = useMemo(() => Math.floor((calculatedMetrics?.ageDays ?? 0) / 365.25), [calculatedMetrics?.ageDays]);
  const isPeds = ageYears < 18;
  const bmi = useMemo(() => parseFloat(calculatedMetrics?.bmi) || 0, [calculatedMetrics?.bmi]);

  const [condition, setCondition] = useState<ConditionKey | "">(standards.condition || "");
  const [variant, setVariant] = useState(standards.variant || "");
  const [currentKcal, setCurrentKcal] = useState(standards.currentKcal || "");
  const [currentProtein, setCurrentProtein] = useState(standards.currentProtein || "");
  const [currentFat, setCurrentFat] = useState(standards.currentFat || "");
  const [currentCho, setCurrentCho] = useState(standards.currentCho || "");
  const [currentFluid, setCurrentFluid] = useState(standards.currentFluid || "");
  const [icKcal, setIcKcal] = useState(standards.icKcal || "");
  const [icCaf, setIcCaf] = useState(standards.icCaf || "1.0");
  const [extraInputs, setExtraInputs] = useState<Record<string, string>>(standards.extraInputs || {});

  const [evaluation, setEvaluation] = useState<NutritionEvaluation | null>(null);

  const syncToParent = useCallback(() => {
    setStandards({ condition, variant, currentKcal, currentProtein, currentFat, currentCho, currentFluid, icKcal, icCaf, extraInputs });
  }, [condition, variant, currentKcal, currentProtein, currentFat, currentCho, currentFluid, icKcal, icCaf, extraInputs, setStandards]);

  useEffect(() => {
    // Prioritize global 'Total' fields from Dietary store, fallback to Oral Rx
    if (!currentKcal) {
      const kcal = dietary?.totalKcal || dietary?.oralCalories;
      if (kcal) setCurrentKcal(String(Math.round(parseFloat(kcal) || 0) || ""));
    }
    if (!currentProtein) {
      const prot = dietary?.totalProtein || dietary?.oralProtein;
      if (prot) setCurrentProtein(String(parseFloat(prot) || ""));
    }
    if (!currentFat && dietary?.totalFat) {
      setCurrentFat(String(parseFloat(dietary.totalFat) || ""));
    }
    if (!currentCho && dietary?.totalCho) {
      setCurrentCho(String(parseFloat(dietary.totalCho) || ""));
    }
  }, [dietary]);

  useEffect(() => {
    if (!condition) return;
    const fields = CONDITION_EXTRA_INPUTS[condition as ConditionKey] || [];
    const updates: Record<string, string> = { ...extraInputs };
    let changed = false;

    for (const f of fields) {
      if (!f.autoPullFrom) continue;
      if (updates[f.key] !== undefined && updates[f.key] !== "") continue;

      const [domain, fieldKey] = f.autoPullFrom.split(".");
      let pulled = "";
      if (domain === "clinical") pulled = (clinical as any)?.[fieldKey] || "";
      if (domain === "labs") pulled = labs?.[fieldKey]?.current || "";

      if (pulled) {
        updates[f.key] = pulled;
        changed = true;
      }
    }

    if (changed) setExtraInputs(updates);
  }, [condition, clinical, labs]);

  useEffect(() => {
    if (!bmi || bmi <= 0) return;

    if (condition === "critical_illness") {
      const bmiGroup = bmi < 30 ? "bmi_lt30" : bmi <= 50 ? "bmi_30_50" : "bmi_gt50";
      if (variant !== bmiGroup) setVariant(bmiGroup);
    } else if (condition === "masld_mash") {
      if (!variant || variant.startsWith("bmi_")) {
        const bmiGroup = bmi < 30 ? "bmi_lt30" : bmi <= 40 ? "bmi_30_40" : "bmi_gt40";
        if (variant !== bmiGroup) setVariant(bmiGroup);
      }
    } else if (condition === "sickle_cell" && ageYears > 0) {
      if (ageYears < 18 && !variant.startsWith("peds_")) setVariant("peds_stable");
      if (ageYears >= 18 && !variant.startsWith("adult_")) setVariant("adult_stable");
    } else if (condition === "hsct" && ageYears > 0) {
      let v = "adult";
      if (ageYears < 6) v = "infant_child";
      else if (ageYears <= 16) v = "child_16";
      else if (ageYears < 18) v = "older_adol";
      if (variant !== v && variant !== "post_engraft") setVariant(v);
    } else if (condition === "short_bowel") {
      const isAdultVariant = variant === "adult_standard";
      const isPedsVariant  = variant === "peds_pn_dependent" || variant === "peds_enteral_autonomous";
      if (ageYears >= 18 && isPedsVariant) setVariant("adult_standard");
      if (ageYears < 18 && isAdultVariant) setVariant("");
    }
  }, [condition, bmi, variant, ageYears]);

  const { effectiveWeight, weightBasis, nfpeWarning } = useMemo(() => {
    if (anthro.isFluidShift && anthro.edw) {
      const edwKg = toKg(parseFloat(anthro.edw) || 0, anthro.edwUnit || "kg");
      if (edwKg > 0) {
        return { effectiveWeight: edwKg, weightBasis: "Target/Dry Weight", nfpeWarning: false };
      }
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
      weightBasis: reduction > 0 ? `Estimated Dry Weight (Actual − ${Math.round(reduction * 100)}%)` : "Actual Weight",
      nfpeWarning: missingNfpe,
    };
  }, [anthro.isFluidShift, anthro.edw, anthro.edwUnit, wtKg, condition, clinical]);

  const missingAnthro = useMemo(() => {
    const fields = [];
    if (!sexRaw) fields.push("Sex");
    if (!ageYears) fields.push("Age");
    if (!wtKg) fields.push("Weight");
    if (!htCm) fields.push("Height");
    return fields;
  }, [sexRaw, ageYears, wtKg, htCm]);

  const isReady = missingAnthro.length === 0 && !!condition;

  const runEvaluation = useCallback(() => {
    if (!isReady) return;

    // Phase 5 fix: inject overweight status for pediatric healthy path
    const weightStatus = classifyPediatricWeightStatus({
      ageDays: calculatedMetrics.ageDays ?? 0,
      bmi,
      sex,
    });
    const enrichedExtraInputs = {
      ...extraInputs,
      isOverweight: weightStatus.useOverweightEER ? "true" : "false",
    };

    const { evaluation, snapshot } = evaluateNutritionRx({
      condition: condition as ConditionKey,
      variant: variant || undefined,
      patient: {
        wtKg: effectiveWeight,
        htCm,
        ageYears,
        sex,
        bmi:      parseFloat(calculatedMetrics.bmi) || 0,
        correctedWtKg: calculatedMetrics.correctedWtKg,
        adjIbwKg:      calculatedMetrics.adjIbw ?? undefined,
        icMeasuredKcal: parseFloat(standards.icKcal) || 0,
        icCaf:          parseFloat(standards.icCaf)  || 1.0,
        weightLabel:    calculatedMetrics.adjIbw ? "Corrected Wt (Amputee)" : weightBasis,
        },
        currentRx: {
        kcalPerDay: parseFloat(currentKcal) || 0,
        proteinGPerDay: parseFloat(currentProtein) || 0,
        fatGPerDay: parseFloat(currentFat) || 0,
        choGPerDay: parseFloat(currentCho) || 0,
        fluidMlPerDay: currentFluid ? parseFloat(currentFluid) : undefined,
      },
      extraInputs: Object.fromEntries(Object.entries(enrichedExtraInputs).map(([k, v]) => [k, parseFloat(v) || v])),
    });
    setEvaluation(evaluation);
    setSnapshot(snapshot);   // writes into standards.snapshot → autosaved with the note
  }, [isReady, condition, variant, effectiveWeight, htCm, ageYears, sex, bmi, weightBasis, icKcal, icCaf, currentKcal, currentProtein, currentFat, currentCho, currentFluid, extraInputs, calculatedMetrics.ageDays, setSnapshot]);
// Note: add `setSnapshot` to the useCallback dependency array.

  useEffect(() => {
    if (isReady) runEvaluation();
    syncToParent();
  }, [condition, variant, currentKcal, currentProtein, currentFluid, icKcal, icCaf, extraInputs, wtKg, htCm, effectiveWeight, isReady, runEvaluation, syncToParent]);

  const variants = condition ? (CONDITION_VARIANTS[condition] || []) : [];

  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (v.sex && sex && v.sex !== sex) return false;
      if (v.minAge !== undefined && ageYears < v.minAge) return false;
      if (v.maxAge !== undefined && ageYears > v.maxAge) return false;
      return true;
    });
  }, [variants, sex, ageYears]);

  const icUsedForKcal = !!icKcal && parseFloat(icKcal) > 0;

  // PSU detection: true for either 2003b or 2010
  const isPSU = evaluation?.eeSource === "PSU 2003b" || evaluation?.eeSource === "PSU 2010";

  const isConditionVisible = (key: ConditionKey) => {
  if (key === "pregnancy" || key === "breastfeeding") {
    if (sex === "M") return false;
    if (ageYears > 0 && ageYears < 12) return false;
  }
  if (key === "bpd") {
    if (ageYears >= 18) return false;
  }
  return true;
};

  const activeCafVal = parseFloat(icCaf) || 1.0;
  const cafLabel = useMemo(() => {
    const factor = IC_ACTIVITY_FACTORS.find(f => activeCafVal >= f.cafLow && activeCafVal <= f.cafHigh);
    return factor ? factor.condition : "Custom adjustment";
  }, [activeCafVal]);

  return (
    <div className="fade-in" style={{ padding: "0.25rem 0", position: "relative" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", color: "#1e293b" }}>Comparative Standards</h3>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>Evaluate nutrition prescription against condition-specific evidence.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", textAlign: "right" }}>
          {ageYears >= 18 && (
            <QuickStat label="IBW" value={htCm > 0 ? `${calcIBW(htCm, sex)}kg` : "—"} />
          )}
          {ageYears < 18 ? (
            <QuickStat 
              label="Schofield REE" 
              value={wtKg > 0 && ageYears > 0 ? `${Math.round(calcSchofieldBMR(wtKg, htCm / 100, ageYears, sex))}kcal` : "—"} 
            />
          ) : (
            <QuickStat 
              label="MSJ REE" 
              value={wtKg > 0 && ageYears > 0 ? `${Math.round(calcMSJ(wtKg, htCm, ageYears, sex))}kcal` : "—"} 
            />
          )}
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
                  : "Select a condition to begin evaluation."}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem" }}>

        {/* ── LEFT COLUMN: INPUTS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <div className="card" style={{ padding: "1rem", border: "1.5px solid #f59e0b", background: "#fffdfa" }}>
            <label style={{ ...subHeaderStyle, color: "#b45309" }}>⚡ Indirect Calorimetry (mREE)</label>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ ...tinyLabelStyle, color: icUsedForKcal ? "#b45309" : "#94a3b8" }}>
                Measured Resting Energy Expenditure
              </label>
              <input
                type="number"
                value={icKcal}
                onChange={e => setIcKcal(e.target.value)}
                style={{ ...inputStyle, border: icUsedForKcal ? "1.5px solid #f59e0b" : inputStyle.border, background: icUsedForKcal ? "#fffbeb" : "#fff" }}
                placeholder="mREE kcal/day"
              />
            </div>

            {icUsedForKcal && (
              <div className="fade-in" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #fcd34d" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ ...tinyLabelStyle, color: "#92400e", marginBottom: 0 }}>Clinical Activity Factor (CAF)</label>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#b45309" }}>×{activeCafVal.toFixed(2)}</span>
                </div>

                <input
                  type="range"
                  min="1.0"
                  max="1.8"
                  step="0.05"
                  value={icCaf}
                  onChange={e => setIcCaf(e.target.value)}
                  style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer" }}
                />

                <div style={{ fontSize: "0.62rem", color: "#b45309", marginTop: "4px", fontWeight: 600, textAlign: "center", fontStyle: "italic" }}>
                  {cafLabel}
                </div>

                <div style={{ fontSize: "0.62rem", color: "#92400e", marginTop: 8, fontWeight: 700, background: "#fef3c7", padding: "4px 8px", borderRadius: "4px" }}>
                  Floor Target: {Math.round(parseFloat(icKcal) * activeCafVal)} kcal/day
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "1rem" }}>
            <label style={subHeaderStyle}>1. Clinical Setting</label>

            <div className="input-group">
              <select value={condition} onChange={e => { setCondition(e.target.value as ConditionKey); setVariant(""); }} style={selectStyle}>
                <option value="">Select Condition...</option>
                <optgroup label="Acute / Critical Care">
                  {(["critical_illness", "aki", "acute_pancreatitis", "bpd", "burns", "trauma", "stroke"] as ConditionKey[]).filter(isConditionVisible).map(k => (
                    <option key={k} value={k}>{CONDITION_LABELS[k]}</option>
                  ))}
                </optgroup>
                <optgroup label="Chronic Disease">
                  {(["copd", "heart_failure", "ckd_3_5", "ckd_5d", "kidney_transplant", "cirrhosis", "liver_transplant", "masld_mash", "cystic_fibrosis", "sickle_cell"] as ConditionKey[]).filter(isConditionVisible).map(k => (
                    <option key={k} value={k}>{CONDITION_LABELS[k]}</option>
                  ))}
                </optgroup>
                <optgroup label="Oncology / Transplant">
                  {(["oncology", "hsct"] as ConditionKey[]).filter(isConditionVisible).map(k => (
                    <option key={k} value={k}>{CONDITION_LABELS[k]}</option>
                  ))}
                </optgroup>
                <optgroup label="GI / Malabsorption">
                  {(["short_bowel"] as ConditionKey[]).filter(isConditionVisible).map(k => (
                    <option key={k} value={k}>{CONDITION_LABELS[k]}</option>
                  ))}
                </optgroup>
                <optgroup label="Nutritional Status">
                  {(["pressure_injuries", "severe_malnutrition", "obesity_stable"] as ConditionKey[]).filter(isConditionVisible).map(k => (
                    <option key={k} value={k}>{CONDITION_LABELS[k]}</option>
                  ))}
                </optgroup>
                <optgroup label="Life Stage">
                  {(["pregnancy", "breastfeeding", "healthy"] as ConditionKey[]).filter(isConditionVisible).map(k => (
                    <option key={k} value={k}>{CONDITION_LABELS[k]}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {condition === "healthy" || (condition === "heart_failure" && !isPeds) ? (
              isPeds ? (
                <PalSliderPeds
                  value={Number(extraInputs.pal) || 1.3}
                  onChange={(val) => setExtraInputs(prev => ({ ...prev, pal: val.toString() }))}
                />
              ) : (
                <PalSlider
                  value={Number(extraInputs.pal) || (condition === "heart_failure" ? 1.3 : 1.5)}
                  onChange={(val) => setExtraInputs(prev => ({ ...prev, pal: val.toString() }))}
                />
              )
            ) : filteredVariants.length > 0 && (
              <div className="input-group">
                <select value={variant} onChange={e => setVariant(e.target.value)} style={selectStyle}>
                  <option value="">Select Sub-type...</option>
                  {filteredVariants.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                </select>
              </div>
            )}

            {condition && condition !== "healthy" && condition !== "heart_failure" && (
              <ExtraInputRenderer
                condition={condition}
                variant={variant}
                extraInputs={extraInputs}
                setExtraInputs={setExtraInputs}
                ageYears={ageYears}
                sex={sex}
              />
            )}
          </div>

          <div className="card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ ...subHeaderStyle, marginBottom: 0 }}>2. Current Diet Rx</label>
            </div>
            <div className="grid-2-col" style={{ gap: "10px" }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={tinyLabelStyle}>Energy (kcal)</label>
                <input type="number" value={currentKcal} readOnly style={readOnlyInputStyle} placeholder="—" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={tinyLabelStyle}>Protein (g)</label>
                <input type="number" value={currentProtein} readOnly style={readOnlyInputStyle} placeholder="—" />
              </div>
            </div>
            <div className="grid-2-col" style={{ gap: "10px", marginTop: "10px" }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={tinyLabelStyle}>Fat (g)</label>
                <input type="number" value={currentFat} readOnly style={readOnlyInputStyle} placeholder="—" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={tinyLabelStyle}>CHO (g)</label>
                <input type="number" value={currentCho} readOnly style={readOnlyInputStyle} placeholder="—" />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: "10px" }}>
              <label style={tinyLabelStyle}>Fluid (mL/day)</label>
              <input type="number" value={currentFluid} readOnly style={readOnlyInputStyle} placeholder="—" />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: CHART ── */}
        <div>
          {evaluation ? (
            <div className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>Evaluation Results</div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {/* PSU equation badge */}
                  {isPSU && (
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 800,
                      background: evaluation.eeSource === "PSU 2010" ? "#fdf4ff" : "#ede9fe",
                      color: evaluation.eeSource === "PSU 2010" ? "#6b21a8" : "#6d28d9",
                      border: `1px solid ${evaluation.eeSource === "PSU 2010" ? "#e9d5ff" : "#ddd6fe"}`,
                      borderRadius: "6px", padding: "2px 8px",
                    }}>
                      {evaluation.eeSource}
                    </span>
                  )}
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                    {evaluation.eeSource} · {weightBasis} ({effectiveWeight.toFixed(1)}kg)
                  </div>
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

              {/* PSU equation info banner — handles both 2003b and 2010 */}
              {isPSU && <PSUBanner eeSource={evaluation.eeSource} />}

              <NutrientBarChart
                results={evaluation.results}
                icUsedForKcal={icUsedForKcal}
                eeSource={evaluation.eeSource}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>{value}</span>
    </div>
  );
}

const subHeaderStyle: React.CSSProperties = { display: "block", fontSize: "0.72rem", fontWeight: 900, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" };
const tinyLabelStyle: React.CSSProperties = { fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px", display: "block" };
const selectStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1e293b" };
const inputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" };
const readOnlyInputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box", background: "#f8fafc", color: "#64748b", cursor: "default" };