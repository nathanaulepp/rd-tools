// src/features/assessment/assess-standards/NutritionStandardsDomain.tsx
// Condition-driven Nutrition Rx Evaluator
// Lives below A/B/C/D in the assessment sidebar as "A9: Nutrition Standards"

import React, { useState, useMemo } from "react";
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

const STATUS_COLORS: Record<EvalStatus, { bg: string; border: string; text: string; label: string }> = {
  LOW:  { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", label: "↓ LOW" },
  WNL:  { bg: "#f0fdf4", border: "#86efac", text: "#15803d", label: "✓ WNL" },
  HIGH: { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626", label: "↑ HIGH" },
  "N/A": { bg: "#f8fafc", border: "#e2e8f0", text: "#94a3b8", label: "—" },
};

function StatusBadge({ status }: { status: EvalStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      color: c.text, borderRadius: "8px", padding: "3px 12px",
      fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {c.label}
    </span>
  );
}

// ─── Result Row ───────────────────────────────────────────────────────────────

function ResultRow({ row }: { row: EvalResult }) {
  const c = STATUS_COLORS[row.status];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "110px 1fr 1fr 1fr 110px",
      gap: "0.5rem",
      alignItems: "center",
      padding: "0.75rem 1rem",
      borderRadius: "8px",
      background: c.bg,
      border: `1px solid ${c.border}`,
      marginBottom: "0.5rem",
    }}>
      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>{row.label}</span>
      <div>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Target</div>
        <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.92rem" }}>{row.target}</div>
      </div>
      <div>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Current Rx</div>
        <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.92rem" }}>{Math.round(row.current)} {row.unit}</div>
      </div>
      <div>
        {row.note && <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.4, fontStyle: "italic" }}>{row.note}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <StatusBadge status={row.status} />
      </div>
    </div>
  );
}

// ─── IC Factor Reference Table ────────────────────────────────────────────────

function ICFactorTable() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "0.75rem" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: "1px solid #e2e8f0",
          borderRadius: "6px", padding: "4px 12px",
          fontSize: "0.72rem", color: "#64748b", cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {open ? "▲ Hide" : "▼ Show"} IC / MSJ Activity Factor Reference
      </button>
      {open && (
        <div style={{
          marginTop: "0.5rem", border: "1px solid #e2e8f0",
          borderRadius: "8px", overflow: "hidden", fontSize: "0.78rem",
        }}>
          <div style={{
            background: "#f8fafc", padding: "6px 12px",
            fontWeight: 800, fontSize: "0.68rem", color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em",
            borderBottom: "1px solid #e2e8f0",
          }}>
            IC Clinical Activity Factors (CAF) — used when MSJ is the fallback for IC
          </div>
          {IC_ACTIVITY_FACTORS.map((r, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2fr 80px 1fr",
              gap: "0.5rem", padding: "6px 12px",
              borderBottom: i < IC_ACTIVITY_FACTORS.length - 1 ? "1px solid #f1f5f9" : "none",
              alignItems: "center",
            }}>
              <span style={{ color: "#334155", fontWeight: 600 }}>{r.condition}</span>
              <span style={{
                background: "#eff6ff", color: "#1d4ed8",
                borderRadius: "6px", padding: "2px 8px",
                fontWeight: 800, textAlign: "center",
              }}>
                ×{r.cafLow}–{r.cafHigh}
              </span>
              <span style={{ color: "#94a3b8", fontStyle: "italic" }}>{r.note}</span>
            </div>
          ))}

          <div style={{
            background: "#f0fdf4", padding: "6px 12px",
            fontWeight: 800, fontSize: "0.68rem", color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em",
            borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0",
          }}>
            MSJ Activity Factors (AF) — Ambulatory / Outpatient
          </div>
          {MSJ_ACTIVITY_FACTORS.map((r, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 2fr",
              gap: "0.5rem", padding: "6px 12px",
              borderBottom: i < MSJ_ACTIVITY_FACTORS.length - 1 ? "1px solid #f1f5f9" : "none",
              alignItems: "center",
            }}>
              <span style={{ color: "#334155", fontWeight: 600 }}>{r.label}</span>
              <span style={{
                background: "#f0fdf4", color: "#15803d",
                borderRadius: "6px", padding: "2px 8px",
                fontWeight: 800, textAlign: "center",
              }}>
                ×{r.af}
              </span>
              <span style={{ color: "#94a3b8", fontStyle: "italic" }}>{r.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NutritionStandardsDomainProps {
  anthro: any;
  patientData: any;
  calculatedMetrics: any;
  dietary: any;
}

export default function NutritionStandardsDomain({
  anthro,
  patientData,
  calculatedMetrics,
  dietary,
}: NutritionStandardsDomainProps) {
  // ── Derived patient base values from anthro/patientData ─────────────────
  const wtKg = useMemo(() => {
    const v = parseFloat(anthro.wt) || 0;
    return toKg(v, anthro.wtUnit || "kg");
  }, [anthro.wt, anthro.wtUnit]);

  const htCm = useMemo(() => {
    const v = parseFloat(anthro.ht) || 0;
    return toCm(v, anthro.htUnit || "cm");
  }, [anthro.ht, anthro.htUnit]);

  const sexRaw: "M" | "F" | "" = patientData?.sex || "";
  const sex: "M" | "F" = sexRaw === "F" ? "F" : "M";

  const ageYears = useMemo(() => {
    if (!calculatedMetrics?.ageDays) return 0;
    return Math.floor(calculatedMetrics.ageDays / 365.25);
  }, [calculatedMetrics?.ageDays]);

  const bmi = useMemo(() => {
    const b = parseFloat(calculatedMetrics?.bmi);
    return isNaN(b) ? 0 : b;
  }, [calculatedMetrics?.bmi]);

  const ibwKg = useMemo(() => htCm > 0 ? calcIBW(htCm, sex) : 0, [htCm, sex]);
  const reeKcal = useMemo(
    () => wtKg > 0 && htCm > 0 && ageYears > 0 ? calcMSJ(wtKg, htCm, ageYears, sex) : 0,
    [wtKg, htCm, ageYears, sex]
  );

  // ── Form state ────────────────────────────────────────────────────────────
  const [condition, setCondition] = useState<ConditionKey | "">("");
  const [variant, setVariant] = useState("");
  const [currentKcal, setCurrentKcal] = useState(
    String(Math.round(parseFloat(dietary?.oralCalories || "") || 0) || "")
  );
  const [currentProtein, setCurrentProtein] = useState(
    String(parseFloat(dietary?.oralProtein || "") || "")
  );
  const [currentFluid, setCurrentFluid] = useState("");
  const [icKcal, setIcKcal] = useState("");
  const [dryWt, setDryWt] = useState("");
  const [extraInputs, setExtraInputs] = useState<Record<string, string>>({});
  const [evaluated, setEvaluated] = useState<NutritionEvaluation | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const variants = condition ? (CONDITION_VARIANTS[condition] || []) : [];
  const extraFields = condition ? (CONDITION_EXTRA_INPUTS[condition] || []) : [];
  const canEvaluate = !!(condition && wtKg > 0 && htCm > 0 && ageYears > 0 && sexRaw);

  const handleEvaluate = () => {
    if (!condition || !canEvaluate) return;
    const result = evaluateNutritionRx({
      condition,
      variant: variant || undefined,
      patient: {
        wtKg,
        htCm,
        ageYears,
        sex,
        bmi,
        dryWtKg: dryWt ? parseFloat(dryWt) : undefined,
        icMeasuredKcal: icKcal ? parseFloat(icKcal) : undefined,
      },
      currentRx: {
        kcalPerDay: parseFloat(currentKcal) || 0,
        proteinGPerDay: parseFloat(currentProtein) || 0,
        fluidMlPerDay: currentFluid ? parseFloat(currentFluid) : undefined,
      },
      extraInputs: Object.fromEntries(
        Object.entries(extraInputs).map(([k, v]) => [k, parseFloat(v) || v])
      ),
    });
    setEvaluated(result);
    setHasEvaluated(true);
  };

  const handleConditionChange = (c: string) => {
    setCondition(c as ConditionKey | "");
    setVariant("");
    setEvaluated(null);
    setHasEvaluated(false);
    setExtraInputs({});
  };

  // ── Missing data guard ────────────────────────────────────────────────────
  const missingFields: string[] = [];
  if (!sexRaw) missingFields.push("Patient Sex (Patient Header)");
  if (!ageYears) missingFields.push("Age / DOB + Note Date");
  if (!wtKg) missingFields.push("Current Weight (A1)");
  if (!htCm) missingFields.push("Height/Length (A1)");

  return (
    <div className="fade-in" style={{ padding: "0.25rem 0" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        borderRadius: "10px", padding: "1rem 1.25rem",
        marginBottom: "1rem", color: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{
            fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.1em", opacity: 0.7, marginBottom: "2px",
          }}>
            Assessment · A9
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
            Nutrition Standards Evaluator
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", opacity: 0.75 }}>
            Condition-driven Rx vs. evidence-based targets · LOW / WNL / HIGH matrix
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.72rem", opacity: 0.8, lineHeight: 1.8 }}>
          <div>IBW (Hamwi): <strong>{ibwKg > 0 ? `${ibwKg} kg` : "—"}</strong></div>
          <div>MSJ REE: <strong>{reeKcal > 0 ? `${Math.round(reeKcal)} kcal` : "—"}</strong></div>
          <div>BMI: <strong>{bmi > 0 ? bmi.toFixed(1) : "—"}</strong></div>
        </div>
      </div>

      {/* ── Missing data warning ── */}
      {missingFields.length > 0 && (
        <div style={{
          background: "#fef3c7", border: "1px solid #fcd34d",
          borderRadius: "8px", padding: "0.65rem 1rem",
          fontSize: "0.78rem", color: "#92400e",
          marginBottom: "1rem", fontWeight: 600,
        }}>
          ⚠ Complete the following to enable evaluation: {missingFields.join(" · ")}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* ── Left: Condition + Extra inputs ── */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1e293b", marginBottom: "0.75rem" }}>
            Clinical Condition
          </div>

          <div className="input-group">
            <label>Condition</label>
            <select
              value={condition}
              onChange={e => handleConditionChange(e.target.value)}
              style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
            >
              <option value="">— Select condition —</option>
              {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {variants.length > 0 && (
            <div className="input-group">
              <label>Sub-type / Variant</label>
              <select
                value={variant}
                onChange={e => { setVariant(e.target.value); setEvaluated(null); }}
                style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
              >
                <option value="">— Select variant —</option>
                {variants.map(v => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </select>
            </div>
          )}

          {extraFields.map(f => (
            <div key={f.key} className="input-group">
              <label>{f.label}</label>
              <input
                type={f.type}
                value={extraInputs[f.key] || ""}
                onChange={e => setExtraInputs(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder="Enter value…"
                style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}

          <div className="input-group">
            <label>Indirect Calorimetry — mREE (kcal/day)</label>
            <input
              type="number"
              value={icKcal}
              onChange={e => { setIcKcal(e.target.value); setEvaluated(null); }}
              placeholder="Measured value — leave blank if unavailable"
              style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
            />
            {!icKcal && (
              <span style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                No IC entered → MSJ × AF fallback applied automatically
              </span>
            )}
          </div>

          {(condition === "cirrhosis" || condition === "liver_transplant") && (
            <div className="input-group">
              <label>Dry Weight (kg)</label>
              <input
                type="number"
                value={dryWt}
                onChange={e => { setDryWt(e.target.value); setEvaluated(null); }}
                placeholder="Estimated euvolemic / dry weight"
                style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          )}
        </div>

        {/* ── Right: Current Rx ── */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1e293b", marginBottom: "0.75rem" }}>
            Current Nutrition Rx
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.75rem", fontStyle: "italic" }}>
            Pre-filled from D3 oral intake when available. Edit to reflect total EN/PN delivery.
          </div>

          <div className="input-group">
            <label>Energy (kcal/day)</label>
            <input
              type="number"
              value={currentKcal}
              onChange={e => { setCurrentKcal(e.target.value); setEvaluated(null); }}
              placeholder="e.g. 1800"
              style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div className="input-group">
            <label>Protein (g/day)</label>
            <input
              type="number"
              value={currentProtein}
              onChange={e => { setCurrentProtein(e.target.value); setEvaluated(null); }}
              placeholder="e.g. 75"
              style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div className="input-group">
            <label>Fluid (mL/day) — optional</label>
            <input
              type="number"
              value={currentFluid}
              onChange={e => { setCurrentFluid(e.target.value); setEvaluated(null); }}
              placeholder="e.g. 1500"
              style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Patient summary strip */}
          <div style={{
            marginTop: "1rem", background: "#f8fafc",
            border: "1px solid #e2e8f0", borderRadius: "8px",
            padding: "0.65rem 0.85rem",
          }}>
            <div style={{
              fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px",
            }}>
              Patient Summary (from header / A1)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.78rem", color: "#475569" }}>
              <span>Actual Wt: <strong>{wtKg > 0 ? `${wtKg.toFixed(1)} kg` : "—"}</strong></span>
              <span>IBW: <strong>{ibwKg > 0 ? `${ibwKg} kg` : "—"}</strong></span>
              <span>Ht: <strong>{htCm > 0 ? `${htCm.toFixed(1)} cm` : "—"}</strong></span>
              <span>Sex: <strong>{sexRaw || "—"}</strong></span>
              <span>Age: <strong>{ageYears > 0 ? `${ageYears} yr` : "—"}</strong></span>
              <span>BMI: <strong>{bmi > 0 ? bmi.toFixed(1) : "—"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Evaluate Button ── */}
      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <button
          onClick={handleEvaluate}
          disabled={!canEvaluate || !condition}
          style={{
            background: canEvaluate && condition
              ? "linear-gradient(135deg, #1e3a5f, #2563eb)"
              : "#e2e8f0",
            color: canEvaluate && condition ? "#fff" : "#94a3b8",
            border: "none", borderRadius: "10px",
            padding: "0.65rem 2.5rem",
            fontSize: "0.92rem", fontWeight: 800,
            cursor: canEvaluate && condition ? "pointer" : "not-allowed",
            letterSpacing: "0.02em",
            boxShadow: canEvaluate && condition ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
            transition: "all 0.2s",
          }}
        >
          Calculate Targets & Evaluate →
        </button>
      </div>

      {/* ── Results ── */}
      {hasEvaluated && evaluated && (
        <div>
          {/* Calculation provenance strip */}
          <div style={{
            display: "flex", gap: "0.65rem", flexWrap: "wrap",
            marginBottom: "0.85rem", alignItems: "center",
          }}>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700,
              background: evaluated.eeSource === "IC" ? "#dcfce7" : "#eff6ff",
              color: evaluated.eeSource === "IC" ? "#15803d" : "#1d4ed8",
              border: `1px solid ${evaluated.eeSource === "IC" ? "#86efac" : "#93c5fd"}`,
              borderRadius: "6px", padding: "3px 10px",
            }}>
              {evaluated.eeSource === "IC"
                ? `IC: ${evaluated.eeKcal} kcal/day (CAF ×${evaluated.cafUsed})`
                : `MSJ REE: ${evaluated.reeKcal} kcal × AF ${evaluated.afUsed} = ${evaluated.eeKcal} kcal/day`
              }
            </span>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700,
              background: "#f8fafc", color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "6px", padding: "3px 10px",
            }}>
              Wt used for kcal: {evaluated.weightLabel} ({evaluated.weightUsed} kg)
            </span>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700,
              background: "#f8fafc", color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "6px", padding: "3px 10px",
            }}>
              IBW (Hamwi): {evaluated.ibwKg} kg
            </span>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr 110px",
            gap: "0.5rem", padding: "0 1rem 0.4rem",
            fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            <span>Measure</span>
            <span>Target Range</span>
            <span>Current Rx</span>
            <span>Basis</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          {evaluated.results.length > 0 ? (
            evaluated.results.map((row, i) => <ResultRow key={i} row={row} />)
          ) : (
            <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.82rem", padding: "0.75rem 0" }}>
              No evaluable targets for this condition/variant combination.
            </div>
          )}

          {/* Clinical flags */}
          {evaluated.flags.length > 0 && (
            <div style={{
              marginTop: "0.75rem",
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
            }}>
              <div style={{
                fontSize: "0.68rem", fontWeight: 800, color: "#92400e",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px",
              }}>
                Clinical Flags & Notes
              </div>
              {evaluated.flags.map((f, i) => (
                <div key={i} style={{ fontSize: "0.78rem", color: "#78350f", lineHeight: 1.7, marginBottom: "1px" }}>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Activity Factor Reference Table ── */}
      <ICFactorTable />
    </div>
  );
}