// src/features/assessment/assess-standards/NutritionStandardsDomain.tsx
// Condition-driven Nutrition Rx Evaluator

import React, { useState, useMemo, useEffect } from "react";
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
      borderRadius: "4px", padding: "1px 6px",
      fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
    }}>
      {t.label}
    </span>
  );
}

// ─── Scorecard Item ───────────────────────────────────────────────────────────

function NutrientScorecardItem({ result }: { result: EvalResult }) {
  const theme = STATUS_THEME[result.status];
  
  // Parse target range for a simple progress visualization if possible
  const rangeMatch = result.target.match(/(\d+)(?:–(\d+))?/);
  let low = 0, high = 0;
  if (rangeMatch) {
    low = parseInt(rangeMatch[1]);
    high = rangeMatch[2] ? parseInt(rangeMatch[2]) : low;
  }

  return (
    <div style={{
      padding: "0.85rem",
      borderLeft: `4px solid ${theme.color}`,
      background: "#fff",
      borderRadius: "6px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0",
      borderLeftWidth: "4px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#475569" }}>{result.label}</span>
        <CompactStatus status={result.status} />
      </div>
      
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>{Math.round(result.current)}</span>
        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500 }}>{result.unit}</span>
      </div>

      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px", display: "flex", gap: "4px" }}>
        <span>Target:</span>
        <span style={{ fontWeight: 700, color: "#475569" }}>{result.target}</span>
      </div>

      {result.note && (
        <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontStyle: "italic", marginTop: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "4px" }}>
          {result.note}
        </div>
      )}
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
  
  // ── Derived patient base values ───────────────────────────────────────────
  const wtKg = useMemo(() => toKg(parseFloat(anthro.wt) || 0, anthro.wtUnit || "kg"), [anthro.wt, anthro.wtUnit]);
  const htCm = useMemo(() => toCm(parseFloat(anthro.ht) || 0, anthro.htUnit || "cm"), [anthro.ht, anthro.htUnit]);
  const sexRaw: "M" | "F" | "" = patientData?.sex || "";
  const sex: "M" | "F" = sexRaw === "F" ? "F" : "M";
  const ageYears = useMemo(() => Math.floor((calculatedMetrics?.ageDays ?? 0) / 365.25), [calculatedMetrics?.ageDays]);
  const bmi = useMemo(() => parseFloat(calculatedMetrics?.bmi) || 0, [calculatedMetrics?.bmi]);

  // ── State synced with props ───────────────────────────────────────────────
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

  // Sync back to parent for persistence
  const syncToParent = () => {
    setStandards({
      condition, variant, currentKcal, currentProtein, currentFluid,
      icKcal, dryWt, renalDryWeight, extraInputs
    });
  };

  // ── Effects: Pre-fill Rx from dietary domain ──────────────────────────────
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

  // ── Logic: Calculate Effective Weight (ABW) ──────────────────────────────
  const { effectiveWeight, weightBasis, nfpeWarning } = useMemo(() => {
    // 1. Prioritize Renal Dry Weight (for dialysis)
    if (renalDryWeight) {
      return { 
        effectiveWeight: parseFloat(renalDryWeight), 
        weightBasis: "Renal Dry Weight",
        nfpeWarning: false 
      };
    }

    // 2. Fallback to Manual Dry Weight
    if (dryWt) {
      return { 
        effectiveWeight: parseFloat(dryWt), 
        weightBasis: "Dry Weight",
        nfpeWarning: false 
      };
    }

    // 3. Calculate based on NFPE findings (Cirrhosis/Fluid context)
    let reduction = 0;
    if (clinical.ascites === "Mild") reduction += 0.05;
    else if (clinical.ascites === "Moderate") reduction += 0.10;
    else if (clinical.ascites === "Severe") reduction += 0.15;
    
    if (clinical.pedalEdema === "Yes") {
      reduction += 0.05;
    }

    const calculatedWeight = wtKg * (1 - reduction);
    const isCirrhosis = condition === "cirrhosis";
    const missingNfpe = isCirrhosis && !clinical.ascites && !clinical.pedalEdema;

    return {
      effectiveWeight: calculatedWeight,
      weightBasis: reduction > 0 ? `Estimated Dry Weight (Actual - ${Math.round(reduction * 100)}%)` : "Actual Weight",
      nfpeWarning: missingNfpe
    };
  }, [renalDryWeight, dryWt, wtKg, condition, clinical]);

  // ── Logic: Check Readiness ───────────────────────────────────────────────
  const missingAnthro = useMemo(() => {
    const fields = [];
    if (!sexRaw) fields.push("Sex");
    if (!ageYears) fields.push("Age");
    if (!wtKg) fields.push("Weight");
    if (!htCm) fields.push("Height");
    return fields;
  }, [sexRaw, ageYears, wtKg, htCm]);

  const isReady = missingAnthro.length === 0 && !!condition;

  // ── Action: Run Evaluation ────────────────────────────────────────────────
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
      currentRx: { kcalPerDay: parseFloat(currentKcal) || 0, proteinGPerDay: parseFloat(currentProtein) || 0, fluidMlPerDay: currentFluid ? parseFloat(currentFluid) : undefined },
      extraInputs: Object.fromEntries(Object.entries(extraInputs).map(([k, v]) => [k, parseFloat(v) || v])),
    });
    
    // Inject weight basis
    (result as any).weightBasis = weightBasis;
    setEvaluation(result);
  };

  // Auto-run evaluation and sync to parent when inputs change
  useEffect(() => { 
    if (isReady) runEvaluation(); 
    syncToParent();
  }, [condition, variant, currentKcal, currentProtein, currentFluid, icKcal, dryWt, renalDryWeight, extraInputs, wtKg, htCm, effectiveWeight]);

  const variants = condition ? (CONDITION_VARIANTS[condition] || []) : [];
  const extraFields = condition ? (CONDITION_EXTRA_INPUTS[condition] || []) : [];

  return (
    <div className="fade-in" style={{ padding: "0.25rem 0", position: "relative" }}>

      {/* ── HEADER: Minimalist & High-Signal ── */}
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
            <div className="input-group">
              <label style={tinyLabelStyle}>Indirect Calorimetry (mREE)</label>
              <input type="number" value={icKcal} onChange={e => setIcKcal(e.target.value)} style={inputStyle} placeholder="Measured kcal" />
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

        {/* ── RIGHT COLUMN: EVALUATION SCORECARD ── */}
        <div>
          {evaluation ? (
            <div className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e293b" }}>Evaluation Results</div>
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

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
                {evaluation.results.map((r, i) => <NutrientScorecardItem key={i} result={r} />)}
              </div>

              {evaluation.flags.length > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "8px", padding: "1rem" }}>
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
const inputStyle = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" as any };