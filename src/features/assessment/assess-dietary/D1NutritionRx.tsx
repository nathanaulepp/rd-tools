// src/features/assessment/assess-dietary/D1NutritionRx.tsx
// Phase 5: Reads useDietaryStore and useAnthroStore directly. No props for domain state.

import React, { useState } from "react";
import * as helper from "./helper";
import * as constant from "./constant";
import { MicroNutrientParams, ENFeed, PNFeed, ENState, PNState } from "../../../shared/types/index";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { SelectInput as Sel } from "../../../shared/ui/SelectInput";
import { StatChip as NutrientChip } from "../../../shared/ui/StatChip";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Tooltip } from "../../../shared/ui/Tooltip";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import type { Dietary } from "../../../types";

// ─── GIR Badge ────────────────────────────────────────────────────────────────
function GIRBadge({ dextGPerDay, wtKg, label = "GIR", ageDays }: { dextGPerDay: number; wtKg: number; label?: string; ageDays?: number | null }) {
  const gir = helper.calcGIR(dextGPerDay, wtKg);
  if (gir === null) return null;
  const status = helper.girStatus(gir, ageDays);
  return (
    <Tooltip text="Glucose Infusion Rate = (Dextrose g/day × 1000) ÷ (weight kg × 1440 min). Targets: infants 10–14, children 8–10, adolescents 5–6, adults <5 mg/kg/min (ASPEN).">
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        background: status.bg, color: status.color,
        border: `1px solid ${status.color}40`,
        borderRadius: "6px", padding: "2px 8px",
        fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
        cursor: "default",
      }}>
        {label}: {gir.toFixed(2)} mg/kg/min
        <span style={{ fontSize: "0.62rem", opacity: 0.8 }}>({status.label})</span>
      </span>
    </Tooltip>
  );
}

// ─── TNA Delivery Summary ─────────────────────────────────────────────────────
function TNASummary({ totalVol, rate, dextG, aaG, lipidG, dextConc, aaConc, lipidConc, bagGIR, patientWtKg, ageDays }: {
  totalVol: number; rate: number;
  dextG: number; aaG: number; lipidG: number;
  dextConc: string; aaConc: string; lipidConc: string;
  bagGIR: number | null; patientWtKg: number; ageDays?: number | null;
}) {
  const dGL = helper.num(dextConc) * 10;
  const aGL = helper.num(aaConc) * 10;
  const lGL = helper.num(lipidConc) * 10;

  if (totalVol <= 0) return null;

  return (
    <div style={{ background: "#f8f4ff", border: "1px solid #e9d8fd", borderRadius: "7px", padding: "0.85rem 1rem", marginBottom: "0.6rem", color: "#4a5568" }}>
      <div style={{ fontWeight: 800, color: "#6b46c1", fontSize: "0.88rem", marginBottom: "0.4rem" }}>
        Total Volume: {Math.round(totalVol)} mL @ {rate} mL/hr
      </div>
      <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.5rem", color: "#2d3748" }}>
        {dextConc || "0"}% Dextrose, {aaConc || "0"}% Amino Acids, {lipidConc || "0"}% Lipids
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px", fontSize: "0.82rem" }}>
        <div><strong>Dextrose:</strong> {Math.round(dextG * 10)/10} g / day, {Math.round(dGL * 10)/10} g / L</div>
        <div><strong>Amino Acids:</strong> {Math.round(aaG * 10)/10} g / day, {Math.round(aGL * 10)/10} g / L</div>
        <div><strong>Lipids:</strong> {Math.round(lipidG * 10)/10} g / day, {Math.round(lGL * 10)/10} g / L</div>
      </div>
      {bagGIR !== null && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid #e9d8fd" }}>
          <GIRBadge dextGPerDay={dextG} wtKg={patientWtKg} label="GIR (this bag)" ageDays={ageDays} />
        </div>
      )}
    </div>
  );
}

// ─── Small inline derived-value display ──────────────────────────────────────
function DerivedBadge({ g, kcal, unit, color }: { g: number; kcal: number; unit: string; color: string }) {
  if (g <= 0) return null;
  return (
    <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", background: `${color}10`, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 8px", fontSize: "0.76rem", marginTop: "3px", flexWrap: "wrap" }}>
      <span style={{ color, fontWeight: 700 }}>{Math.round(g * 10) / 10} {unit}</span>
      <span style={{ color: "#718096" }}>·</span>
      <span style={{ color, fontWeight: 600 }}>{Math.round(kcal)} kcal</span>
    </div>
  );
}

// ─── Lipid derived display — shows both per-infusion and avg/day ──────────────
function LipidDerivedBadge({
  derivedResult,
  freq,
  color,
}: {
  derivedResult: { g: number; kcal: number } | null;
  freq: string;
  color: string;
}) {
  if (!derivedResult || derivedResult.g <= 0) return null;

  // Parse frequency multiplier (e.g. "3x" → 3/7 of daily)
  const freqNum = freq && freq.endsWith("x") ? parseInt(freq) : 7;
  const isEveryDay = freqNum === 7;

  // derivedResult.g already accounts for the weekly multiplier (via deriveLipid helper)
  // so it IS the avg g/day. Back-calculate per-infusion g:
  const avgGPerDay = derivedResult.g;
  const avgKcalPerDay = derivedResult.kcal;
  const gPerInfusion = isEveryDay ? avgGPerDay : avgGPerDay * 7 / freqNum;
  const kcalPerInfusion = isEveryDay ? avgKcalPerDay : avgKcalPerDay * 7 / freqNum;

  if (isEveryDay) {
    return (
      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", background: `${color}10`, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 8px", fontSize: "0.76rem", marginTop: "3px", flexWrap: "wrap" }}>
        <span style={{ color, fontWeight: 700 }}>{Math.round(avgGPerDay * 10) / 10} g lipid</span>
        <span style={{ color: "#718096" }}>·</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(avgKcalPerDay)} kcal</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
      {/* Per-infusion row */}
      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", background: `${color}10`, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 8px", fontSize: "0.76rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.65rem", color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Per infusion</span>
        <span style={{ color, fontWeight: 700 }}>{Math.round(gPerInfusion * 10) / 10} g lipid</span>
        <span style={{ color: "#718096" }}>·</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(kcalPerInfusion)} kcal</span>
      </div>
      {/* Avg/day row */}
      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "3px 8px", fontSize: "0.76rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.65rem", color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Avg/day ({freqNum}×/wk)</span>
        <span style={{ color: "#64748b", fontWeight: 700 }}>{Math.round(avgGPerDay * 10) / 10} g</span>
        <span style={{ color: "#718096" }}>·</span>
        <span style={{ color: "#64748b", fontWeight: 600 }}>{Math.round(avgKcalPerDay)} kcal</span>
      </div>
    </div>
  );
}

// ─── Shared Duration + Hours row (used by TNA and 2-in-1 shared fields) ───────
interface SharedDurationRowProps {
  label: string;
  color: string;
  duration: string;
  onDuration: (v: string) => void;
  hrs: string | number;
  onHrs: (v: string) => void;
  hrsDisabled?: boolean;
}

function SharedDurationRow({ label, color, duration, onDuration, hrs, onHrs, hrsDisabled }: SharedDurationRowProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
      background: `${color}08`, border: `1px solid ${color}25`,
      borderRadius: "6px", padding: "0.5rem 0.75rem", marginBottom: "0.6rem",
    }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em", minWidth: "fit-content" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Field label="Duration" style={{ minWidth: "130px" }}>
          <Sel value={duration} onChange={onDuration} options={constant.PN_DURATIONS} placeholder="Select..." />
        </Field>
        <Field label="Hrs" style={{ minWidth: "70px" }}>
          <Tooltip text={hrsDisabled ? "Continuous is fixed at 24h." : ""}>
            <NumInput value={hrs} onChange={onHrs} placeholder="24" disabled={hrsDisabled} />
          </Tooltip>
        </Field>
      </div>
      {duration === "Cyclic" && (
        <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic" }}>
          Cyclic: set hours below 24 to run over a defined infusion window.
        </span>
      )}
    </div>
  );
}

// ─── PN MacroSection (compact) ────────────────────────────────────────────────
// hideDurationHrs: when true, suppresses the Duration + Hrs columns (shared above)
interface MacroSectionProps {
  label: string;
  color: string;
  hrs: string | number; onHrs: (v: string) => void; hrsDisabled?: boolean;
  duration: string; onDuration: (v: string) => void;
  freq?: string; onFreq?: (v: string) => void;
  rate: string | number; onRate: (v: string) => void;
  showRate: boolean;
  rateLabel?: string;
  amount: string | number;
  onAmount: (v: string) => void;
  conc: string; onConc: (v: string) => void;
  concOptions?: string[];
  showConc: boolean;
  derivedResult: { g: number; kcal: number } | null;
  derivedUnit: string;
  extra?: React.ReactNode;
  concPlaceholder?: string;
  /** When true, hides Duration + Hrs columns (because a shared row handles them) */
  hideDurationHrs?: boolean;
  /** Pass freq for lipid-specific avg/day display; undefined uses standard DerivedBadge */
  lipidFreqForDisplay?: string;
}

function MacroSection({
  label, color, hrs, onHrs, hrsDisabled, duration, onDuration, freq, onFreq,
  rate, onRate, showRate, rateLabel = "Rate (mL/hr)",
  amount, onAmount,
  conc, onConc, concOptions = [], showConc,
  derivedResult, derivedUnit, extra,
  concPlaceholder,
  hideDurationHrs = false,
  lipidFreqForDisplay,
}: MacroSectionProps) {
  // Build column template dynamically based on what's visible
  const cols: string[] = [];
  if (!hideDurationHrs) {
    cols.push("120px"); // Duration
    cols.push("65px");  // Hrs
  }
  if (onFreq) cols.push("105px");  // Frequency
  if (showRate) cols.push("95px"); // Rate
  cols.push("1fr");                // Amount
  if (showConc) cols.push("95px"); // Conc
  if (extra) cols.push("120px");

  const isLipid = lipidFreqForDisplay !== undefined;

  return (
    <div style={{ background: "#fff", border: `1px solid ${color}25`, borderRadius: "6px", padding: "0.6rem 0.75rem", marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: cols.join(" "), gap: "0.4rem", alignItems: "end" }}>
        {!hideDurationHrs && (
          <Field label="Duration">
            <Sel value={duration} onChange={onDuration} options={constant.PN_DURATIONS} placeholder="Select..." />
          </Field>
        )}
        {!hideDurationHrs && (
          <Field label="Hrs">
            <Tooltip text={hrsDisabled ? "Continuous is fixed at 24h." : ""}>
              <NumInput value={hrs} onChange={onHrs} placeholder="24" disabled={hrsDisabled} />
            </Tooltip>
          </Field>
        )}
        {onFreq && (
          <Field label="Frequency">
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <select value={freq} onChange={e => onFreq!(e.target.value)}
                style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", flex: 1 }}>
                {constant.LIPID_FREQ_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span style={{ fontSize: "0.68rem", color: "#718096", whiteSpace: "nowrap" }}>/wk</span>
            </div>
          </Field>
        )}
        {showRate && (
          <Field label={rateLabel}>
            <NumInput value={rate} onChange={onRate} placeholder="mL/hr" />
          </Field>
        )}
        <Field label="Amount (g/day)">
          <NumInput
            value={amount}
            onChange={onAmount}
            placeholder={derivedResult ? `${Math.round(derivedResult.g * 10) / 10} (auto)` : "g/day"}
          />
        </Field>
        {showConc && (
          <Field label="Conc (%)">
            {concOptions.length > 0 ? (
              <select value={conc} onChange={e => onConc(e.target.value)}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}>
                <option value="">—</option>
                {concOptions.map(o => <option key={o} value={o}>{o}%</option>)}
              </select>
            ) : (
              <NumInput value={conc} onChange={onConc} placeholder={concPlaceholder || "%"} />
            )}
          </Field>
        )}
        {extra}
      </div>
      {/* Lipid: show per-infusion + avg/day when frequency < 7x; otherwise standard badge */}
      {isLipid ? (
        <LipidDerivedBadge derivedResult={derivedResult} freq={lipidFreqForDisplay!} color={color} />
      ) : (
        derivedResult && <DerivedBadge g={derivedResult.g} kcal={derivedResult.kcal} unit={derivedUnit} color={color} />
      )}
    </div>
  );
}

// ─── Lipid concentration button group ────────────────────────────────────────
function LipidConcButtons({ value, onChange, color }: { value: string; onChange: (v: "10" | "20" | "30") => void; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#34495e" }}>Conc</label>
      <div style={{ display: "flex", gap: "3px", justifyContent: "flex-end" }}>
        {constant.LIPID_CONCS.map(c => (
          <button key={c.pct} onClick={() => onChange(c.pct as "10" | "20" | "30")}
            title={`${c.pct}% — ${c.kcalPerMl} kcal/mL — ${c.note}`}
            style={{
              padding: "5px 9px", border: `1px solid ${value === c.pct ? color : "#e2e8f0"}`,
              borderRadius: "5px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
              background: value === c.pct ? color : "#fff",
              color: value === c.pct ? "#fff" : "#4a5568",
              transition: "all 0.15s",
            }}>
            {c.pct}%
          </button>
        ))}
      </div>
      {value && (
        <span style={{ fontSize: "0.68rem", color: "#718096", textAlign: "right" }}>
          {constant.getLipidMeta(value).kcalPerMl} kcal/mL
          {value === "30" && <span style={{ color: "#c05621", fontWeight: 700 }}> ⚠ admix only</span>}
        </span>
      )}
    </div>
  );
}

// ─── MicroPanel ───────────────────────────────────────────────────────────────
interface MicroPanelProps {
  title: string;
  fields: { key: string; label: string; defaultUnit: string }[];
  values: Record<string, MicroNutrientParams>;
  onChange: (key: string, subField: string, val: string) => void;
  accent: string;
  expanded: boolean;
  onToggle: () => void;
}

function MicroPanel({ title, fields, values, onChange, accent, expanded, onToggle }: MicroPanelProps) {
  return (
    <div style={{ marginTop: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
      <CollapseHeader label={title} expanded={expanded} onToggle={onToggle} accent={accent} />
      {expanded && (
        <div style={{ padding: "0.65rem", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0 0 0.5rem", fontStyle: "italic" }}>
            Units defaulted to US clinical standards (ASPEN/ASHP).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.5rem" }}>
            {fields.map(f => {
              const currentUnit = values[f.key]?.unit || f.defaultUnit;
              return (
                <Field key={f.key} label={f.label}>
                  <div style={{ display: "flex", gap: "3px" }}>
                    <NumInput value={values[f.key]?.amount || ""} onChange={v => onChange(f.key, "amount", v)} style={{ flex: 1 }} />
                    <select
                      value={currentUnit}
                      onChange={e => onChange(f.key, "unit", e.target.value)}
                      style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "55px" }}
                    >
                      {constant.AMOUNT_UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <select value={values[f.key]?.rate || "per day"} onChange={e => onChange(f.key, "rate", e.target.value)}
                      style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "68px" }}>
                      {constant.RATE_UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </Field>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EN Modular Card ──────────────────────────────────────────────────────────
interface ENModularCardProps {
  modular: constant.ENModular;
  onUpdate: (updated: constant.ENModular) => void;
  onRemove: () => void;
}

function ENModularCard({ modular, onUpdate, onRemove }: ENModularCardProps) {
  const upd = (field: keyof constant.ENModular, val: any) => onUpdate({ ...modular, [field]: val });
  const kcalNum = helper.num(modular.kcal);
  const protNum = helper.num(modular.protein);

  return (
    <div style={{ background: "#fff", border: "1px solid #e0f2fe", borderLeft: "3px solid #0ea5e9", borderRadius: "6px", padding: "0.6rem 0.75rem", marginBottom: "0.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.4rem" }}>
        <Field label="Modular Type">
          <select value={modular.type} onChange={e => upd("type", e.target.value)}
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}>
            <option value="">— Type —</option>
            {constant.EN_MODULAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Product">
          <input type="text" value={modular.product} onChange={e => upd("product", e.target.value)} placeholder="e.g. Beneprotein…"
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }} />
        </Field>
        <Field label="Frequency">
          <select value={modular.frequency} onChange={e => upd("frequency", e.target.value)}
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}>
            {constant.EN_MODULAR_FREQ.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.4rem", alignItems: "end" }}>
        <Field label="Amount">
          <div style={{ display: "flex", gap: "3px" }}>
            <NumInput value={modular.amount} onChange={v => upd("amount", v)} style={{ flex: 1 }} placeholder="qty" />
            <select value={modular.unit} onChange={e => upd("unit", e.target.value)}
              style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "58px" }}>
              {constant.EN_MODULAR_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </Field>
        <Field label="kcal"><NumInput value={modular.kcal} onChange={v => upd("kcal", v)} placeholder="0" /></Field>
        <Field label="Protein (g)"><NumInput value={modular.protein} onChange={v => upd("protein", v)} placeholder="0" /></Field>
        <Field label="Notes">
          <input type="text" value={modular.notes} onChange={e => upd("notes", e.target.value)} placeholder="optional"
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }} />
        </Field>
      </div>
      {(kcalNum > 0 || protNum > 0) && (
        <div style={{ display: "flex", gap: "6px", marginTop: "0.4rem" }}>
          {kcalNum > 0 && <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", borderRadius: "4px", padding: "2px 6px", fontWeight: 700 }}>+{Math.round(kcalNum)} kcal</span>}
          {protNum > 0 && <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#166534", borderRadius: "4px", padding: "2px 6px", fontWeight: 700 }}>+{protNum}g protein</span>}
        </div>
      )}
      <button onClick={onRemove} style={{ marginTop: "0.4rem", background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "0.7rem" }}>
        Remove
      </button>
    </div>
  );
}

// ─── EN Modular Panel ─────────────────────────────────────────────────────────
interface ENModularPanelProps {
  modulars: constant.ENModular[];
  nextModularId: number;
  onUpdate: (modulars: constant.ENModular[], nextId: number) => void;
}

function ENModularPanel({ modulars, nextModularId, onUpdate }: ENModularPanelProps) {
  const [expanded, setExpanded] = useState(modulars.length > 0);

  const addModular = () => {
    const next = nextModularId;
    onUpdate([...modulars, constant.makeENModular(next)], next + 1);
    setExpanded(true);
  };

  const updateModular = (id: number, updated: constant.ENModular) =>
    onUpdate(modulars.map(m => m.id === id ? updated : m), nextModularId);

  const removeModular = (id: number) =>
    onUpdate(modulars.filter(m => m.id !== id), nextModularId);

  const totalKcal    = modulars.reduce((sum, m) => sum + helper.num(m.kcal), 0);
  const totalProtein = modulars.reduce((sum, m) => sum + helper.num(m.protein), 0);

  return (
    <div style={{ marginTop: "0.5rem", border: "1px solid #bae6fd", borderRadius: "6px", overflow: "hidden" }}>
      <div onClick={() => setExpanded(e => !e)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "6px 12px", background: modulars.length > 0 ? "#f0f9ff" : "#f8fafc", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0369a1" }}>Modular Additives</span>
          {modulars.length > 0 && <span style={{ fontSize: "0.65rem", background: "#0ea5e9", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontWeight: 700 }}>{modulars.length}</span>}
          {totalKcal > 0 && <span style={{ fontSize: "0.65rem", background: "#fef3c7", color: "#92400e", borderRadius: "10px", padding: "1px 7px", fontWeight: 700 }}>+{Math.round(totalKcal)} kcal</span>}
          {totalProtein > 0 && <span style={{ fontSize: "0.65rem", background: "#f0fdf4", color: "#166534", borderRadius: "10px", padding: "1px 7px", fontWeight: 700 }}>+{totalProtein}g prot</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button onClick={e => { e.stopPropagation(); addModular(); }}
            style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "4px", padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
            + Add
          </button>
          <span style={{ color: "#0369a1", fontSize: "0.7rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0.65rem", borderTop: "1px solid #bae6fd", background: "#f0f9ff" }}>
          {modulars.length === 0
            ? <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>Click "+ Add" to supplement protein, carbs, fat, or other nutrients.</p>
            : modulars.map(m => <ENModularCard key={m.id} modular={m} onUpdate={updated => updateModular(m.id, updated)} onRemove={() => removeModular(m.id)} />)
          }
        </div>
      )}
    </div>
  );
}

// ─── D11: Oral Nutrition ──────────────────────────────────────────────────────
interface D11OralProps { dietary: Dietary; setDietary: (d: Dietary) => void; }

function D11Oral({ dietary, setDietary }: D11OralProps) {
  const handleUpdate = (field: string, val: string) => setDietary({ ...dietary, [field]: val });
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div className="card">
        <SectionHeader title="D11: Oral Diet & Intake" color="#3498db" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>Current Rx Diet Order</label>
            <textarea value={dietary.dietOrder || ""} onChange={e => handleUpdate("dietOrder", e.target.value)}
              placeholder="e.g. Standard Diet, Regular" style={{ background: "#edf2f7", minHeight: "45px" }} />
          </div>
          <Field label="Calories (kcal/day)"><NumInput value={dietary.oralCalories || ""} onChange={v => handleUpdate("oralCalories", v)} placeholder="e.g. 1800" /></Field>
          <Field label="Protein (g/day)"><NumInput value={dietary.oralProtein || ""} onChange={v => handleUpdate("oralProtein", v)} placeholder="e.g. 75" /></Field>
          <Field label="Water / Fluid (mL/day)"><NumInput value={dietary.oralWater || ""} onChange={v => handleUpdate("oralWater", v)} placeholder="e.g. 1500" /></Field>
        </div>
      </div>
    </div>
  );
}

// ─── D12: Enteral Nutrition ───────────────────────────────────────────────────

interface FormulaManagerProps {
  savedFormulas: string[];
  value: string;
  onChange: (val: string) => void;
  onAddFormula: (name: string) => void;
  onDeleteFormula: (name: string) => void;
}

function FormulaManager({ savedFormulas, value, onChange, onAddFormula, onDeleteFormula }: FormulaManagerProps) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddFormula(trimmed);
    onChange(trimmed);
    setNewName("");
    setEditing(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "5px", alignItems: "center", marginBottom: "3px" }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }}>
          <option value="">— Select formula —</option>
          {savedFormulas.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button onClick={() => setEditing(e => !e)} title="Add new formula"
          style={{ background: "#3498db", color: "#fff", border: "none", borderRadius: "4px", padding: "5px 8px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
          + New
        </button>
        {value && (
          <button onClick={() => { onDeleteFormula(value); onChange(""); }} title="Remove formula"
            style={{ background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "4px", padding: "5px 6px", fontSize: "0.72rem", cursor: "pointer" }}>
            🗑
          </button>
        )}
      </div>
      {editing && (
        <div style={{ display: "flex", gap: "5px", marginTop: "3px", padding: "6px", background: "#eff6ff", borderRadius: "5px", border: "1px solid #bfdbfe" }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setEditing(false); }}
            placeholder="Formula name (e.g. Jevity 1.5…)" autoFocus
            style={{ flex: 1, padding: "5px 8px", border: "1px solid #93c5fd", borderRadius: "4px", fontSize: "0.85rem" }} />
          <button onClick={handleAdd} disabled={!newName.trim()}
            style={{ background: "#3498db", color: "#fff", border: "none", borderRadius: "4px", padding: "5px 12px", fontSize: "0.78rem", fontWeight: 700, cursor: newName.trim() ? "pointer" : "not-allowed", opacity: newName.trim() ? 1 : 0.6 }}>
            Save
          </button>
          <button onClick={() => { setEditing(false); setNewName(""); }}
            style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "5px 8px", fontSize: "0.78rem", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

interface ENFeedCardProps {
  feed: ENFeed;
  idx: number;
  onChange: (updated: ENFeed) => void;
  onRemove: () => void;
  savedFormulas: string[];
  onAddFormula: (name: string) => void;
  onDeleteFormula: (name: string) => void;
}

function ENFeedCard({ feed, idx, onChange, onRemove, savedFormulas, onAddFormula, onDeleteFormula }: ENFeedCardProps) {
  const update = (field: keyof ENFeed, val: any) => onChange({ ...feed, [field]: val });
  const nutrients = helper.calcENNutrients(feed);
  const isExpanded = feed.expanded;
  const modulars: constant.ENModular[] = (feed as any).modulars || [];
  const nextModularId: number = (feed as any).nextModularId || 1;

  const updateModulars = (newModulars: constant.ENModular[], nextId: number) =>
    onChange({ ...feed, modulars: newModulars, nextModularId: nextId } as any);

  const modularKcal    = modulars.reduce((s, m) => s + helper.num(m.kcal), 0);
  const modularProtein = modulars.reduce((s, m) => s + helper.num(m.protein), 0);
  const totalCalWithMod  = nutrients.totalCal + Math.round(modularKcal);
  const totalProtWithMod = Math.round((nutrients.totalProt + modularProtein) * 10) / 10;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "7px", marginBottom: "0.75rem", overflow: "hidden" }}>
      <CollapseHeader
        label={feed.label || `Feed ${idx + 1}`}
        expanded={isExpanded}
        onToggle={() => update("expanded", !isExpanded)}
        accent="#27ae60"
        badge={feed.route ? feed.route.split(" ")[0] : null}
      />
      {isExpanded && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
          {/* Row 1: Label, Route, Delivery type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "0.65rem", marginBottom: "0.65rem", alignItems: "end" }}>
            <Field label="Feed Label">
              <input type="text" value={feed.label} onChange={e => update("label", e.target.value)} placeholder={`Feed ${idx + 1}`}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </Field>
            <Field label="Route & Access">
              <Sel value={feed.route} onChange={v => update("route", v)} options={constant.EN_ROUTES} placeholder="Select route..." />
            </Field>
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Type</label>
              <div style={{ display: "flex", gap: "5px" }}>
                {["continuous", "bolus"].map(t => (
                  <button key={t} onClick={() => update("type", t)} style={{
                    padding: "5px 12px", borderRadius: "14px", border: "1px solid",
                    borderColor: feed.type === t ? "#27ae60" : "#e2e8f0",
                    background: feed.type === t ? "#27ae60" : "transparent",
                    color: feed.type === t ? "#fff" : "#555",
                    fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Formula + delivery params side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "0.65rem", marginBottom: "0.65rem" }}>
            <Field label="Formula">
              <FormulaManager savedFormulas={savedFormulas} value={feed.formula} onChange={v => update("formula", v)}
                onAddFormula={onAddFormula} onDeleteFormula={onDeleteFormula} />
            </Field>
            <div>
              {feed.type === "bolus" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                  <Field label="mL/bolus"><NumInput value={feed.bolusMl} onChange={v => update("bolusMl", v)} /></Field>
                  <Field label="Times/day"><NumInput value={feed.bolusTimesPerDay} onChange={v => update("bolusTimesPerDay", v)} /></Field>
                  <Field label="Every (hrs)"><NumInput value={feed.bolusEveryHrs} onChange={v => update("bolusEveryHrs", v)} /></Field>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <Field label="Rate (mL/hr)"><NumInput value={feed.continuousRate} onChange={v => update("continuousRate", v)} /></Field>
                  <Field label="Hrs/day"><NumInput value={feed.continuousHrs} onChange={v => update("continuousHrs", v)} /></Field>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Nutrition params + flushes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <Field label="Cal/mL" hint="e.g. 1.5"><NumInput value={feed.calPerMl} onChange={v => update("calPerMl", v)} placeholder="1.0" /></Field>
            <Field label="Prot g/L"><NumInput value={feed.protGPerL} onChange={v => update("protGPerL", v)} placeholder="44" /></Field>
            <Field label="Free H₂O %"><NumInput value={feed.fwPct} onChange={v => update("fwPct", v)} placeholder="85" /></Field>
            <Field label="Flush mL"><NumInput value={feed.flushMl} onChange={v => update("flushMl", v)} /></Field>
            <Field label="Flush ×/day"><NumInput value={feed.flushTimesPerDay} onChange={v => update("flushTimesPerDay", v)} /></Field>
            <Field label="Flush every (h)"><NumInput value={feed.flushEveryHrs} onChange={v => update("flushEveryHrs", v)} /></Field>
          </div>

          {/* Modulars */}
          <ENModularPanel modulars={modulars} nextModularId={nextModularId} onUpdate={updateModulars} />

          {/* Totals row */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "0.6rem", borderTop: "1px solid #f0f0f0", marginTop: "0.6rem" }}>
            <NutrientChip label="Volume" value={nutrients.totalMl} unit="mL/day" color="#3498db" />
            <NutrientChip label="Calories" value={totalCalWithMod > 0 ? (modularKcal > 0 ? `${totalCalWithMod} (+${Math.round(modularKcal)})` : totalCalWithMod) : nutrients.totalCal} unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Protein" value={totalProtWithMod > 0 ? (modularProtein > 0 ? `${totalProtWithMod} (+${modularProtein})` : totalProtWithMod) : nutrients.totalProt} unit="g/day" color="#8e44ad" />
            <NutrientChip label="Free Water" value={nutrients.totalFw} unit="mL/day" color="#27ae60" />
            <NutrientChip label="Flush Water" value={nutrients.flushMl} unit="mL/day" color="#0891b2" />
          </div>

          <button onClick={onRemove} style={{ marginTop: "0.6rem", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem" }}>
            Remove Feed
          </button>
        </div>
      )}
    </div>
  );
}

interface D12EnteralProps {
  state: ENState;
  setState: (s: ENState) => void;
  savedFormulas: string[];
  onAddFormula: (name: string) => void;
  onDeleteFormula: (name: string) => void;
}

function D12Enteral({ state, setState, savedFormulas, onAddFormula, onDeleteFormula }: D12EnteralProps) {
  const addFeed    = () => setState({ ...state, feeds: [...state.feeds, helper.makeENFeed(state.nextId)], nextId: state.nextId + 1 });
  const updateFeed = (id: number, updated: ENFeed) => setState({ ...state, feeds: state.feeds.map(f => f.id === id ? updated : f) });
  const removeFeed = (id: number) => setState({ ...state, feeds: state.feeds.filter(f => f.id !== id) });

  const totals = state.feeds.reduce((acc, f) => {
    const n = helper.calcENNutrients(f);
    const mods: constant.ENModular[] = (f as any).modulars || [];
    const modKcal = mods.reduce((s, m) => s + helper.num(m.kcal), 0);
    const modProt = mods.reduce((s, m) => s + helper.num(m.protein), 0);
    return { vol: acc.vol + n.totalMl, cal: acc.cal + n.totalCal + modKcal, prot: acc.prot + n.totalProt + modProt, fw: acc.fw + n.totalFw, flush: acc.flush + n.flushMl };
  }, { vol: 0, cal: 0, prot: 0, fw: 0, flush: 0 });

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <SectionHeader title="D12: Enteral Nutrition (EN)" subtitle="Add one entry per formula or delivery method" color="#27ae60" />
        <button onClick={addFeed} style={{ background: "#27ae60", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Add Feed
        </button>
      </div>

      {state.feeds.map((feed, idx) => (
        <ENFeedCard key={feed.id} feed={feed} idx={idx} onChange={updated => updateFeed(feed.id, updated)} onRemove={() => removeFeed(feed.id)}
          savedFormulas={savedFormulas} onAddFormula={onAddFormula} onDeleteFormula={onDeleteFormula} />
      ))}

      {state.feeds.length > 1 && (
        <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "7px", padding: "0.75rem", marginTop: "0.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#276749", marginBottom: "0.5rem" }}>Total EN (All Feeds + Modulars)</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <NutrientChip label="Total Volume" value={Math.round(totals.vol)} unit="mL/day" color="#27ae60" />
            <NutrientChip label="Total Calories" value={Math.round(totals.cal)} unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Total Protein" value={Math.round(totals.prot * 10) / 10} unit="g/day" color="#8e44ad" />
            <NutrientChip label="Total Free Water" value={Math.round(totals.fw)} unit="mL/day" color="#3498db" />
            <NutrientChip label="Total Flush" value={Math.round(totals.flush)} unit="mL/day" color="#0891b2" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── D13: Parenteral Nutrition ────────────────────────────────────────────────

interface PNFeedCardProps {
  feed: PNFeed;
  idx: number;
  onChange: (updated: PNFeed) => void;
  onRemove: () => void;
  /** Patient weight in kg — passed down for GIR calculation */
  patientWtKg: number;
  ageDays: number | null;
}

function PNFeedCard({ feed, idx, onChange, onRemove, patientWtKg, ageDays }: PNFeedCardProps) {
  const update = (field: keyof PNFeed, val: any) => onChange({ ...feed, [field]: val });
  const isExpanded = feed.expanded;
  const rateMode = helper.getRateMode(feed.delivery);

  // ── Shared duration/hrs handlers for TNA and 2-in-1 ──────────────────────
  // TNA: one Duration+Hrs drives all three macros (dext, aa, lipid)
  // 2-in-1: one Duration+Hrs drives dext+aa; lipid keeps its own
  const sharedDuration = feed.dextDuration; // canonical shared field
  const sharedHrs      = feed.dextHrs;      // canonical shared field
  const sharedHrsDisabled = sharedDuration === "Continuous";

  const handleSharedDurationChange = (plan: string) => {
    const isContTNA    = rateMode === "tna";
    const isContTwoOne = rateMode === "twoplusone";
    const updates: Partial<PNFeed> = {
      dextDuration: plan,
      aaDuration:   plan,
    };
    if (isContTNA) {
      updates.lipidDuration = plan;
    }
    if (plan === "Continuous") {
      updates.dextHrs = "24";
      updates.aaHrs   = "24";
      if (isContTNA) updates.lipidHrs = "24";
    } else if (plan === "Cyclic") {
      // Clear if previously locked to 24
      if (feed.dextHrs === "24") updates.dextHrs = "";
      if (feed.aaHrs === "24")   updates.aaHrs   = "";
      if (isContTNA && feed.lipidHrs === "24") updates.lipidHrs = "";
    }
    onChange({ ...feed, ...updates });
  };

  const handleSharedHrsChange = (v: string) => {
    const updates: Partial<PNFeed> = {
      dextHrs: v,
      aaHrs:   v,
    };
    if (rateMode === "tna") updates.lipidHrs = v;
    onChange({ ...feed, ...updates });
  };

  // Lipid-only duration handler (2-in-1: lipid is independent)
  const handleLipidDurationChange = (plan: string) => {
    const updates: Partial<PNFeed> = { lipidDuration: plan };
    if (plan === "Continuous") updates.lipidHrs = "24";
    else if (plan === "Cyclic" && feed.lipidHrs === "24") updates.lipidHrs = "";
    onChange({ ...feed, ...updates });
  };

  const updateElectrolyte = (key: string, sf: string, val: string) =>
    onChange({ ...feed, electrolytes: { ...feed.electrolytes, [key]: { ...(feed.electrolytes[key] || {}), [sf]: val } } });
  const updateVitamin = (key: string, sf: string, val: string) =>
    onChange({ ...feed, vitamins: { ...feed.vitamins, [key]: { ...(feed.vitamins[key] || {}), [sf]: val } } });

  const effectiveDextRate  = (rateMode === "tna" || rateMode === "twoplusone") ? feed.combinedRate : feed.dextRate;
  const effectiveAARate    = (rateMode === "tna" || rateMode === "twoplusone") ? feed.combinedRate : feed.aaRate;
  const effectiveLipidRate = rateMode === "tna" ? feed.combinedRate : feed.lipidRate;

  // For TNA, fallback to shared hrs if individual fields are blank
  const masterHrs = rateMode === "tna"
    ? (helper.num(feed.dextHrs) || helper.num(feed.aaHrs) || helper.num(feed.lipidHrs) || 24)
    : 0;
  const dHrs = (rateMode === "tna" && !feed.dextHrs)  ? masterHrs : feed.dextHrs;
  const aHrs = (rateMode === "tna" && !feed.aaHrs)    ? masterHrs : feed.aaHrs;
  const lHrs = (rateMode === "tna" && !feed.lipidHrs) ? masterHrs : feed.lipidHrs;

  // Volume and derived calculations
  const lipidMultiplier = (feed.lipidFreq && feed.lipidFreq.endsWith("x")) ? (parseInt(feed.lipidFreq) / 7) : 1;
  let totalVol = 0;
  if (rateMode === "tna") {
    totalVol = helper.num(effectiveDextRate) * helper.num(dHrs);
  } else if (rateMode === "twoplusone") {
    const mainVol  = helper.num(effectiveDextRate) * (helper.num(feed.dextHrs) || 24);
    const lipidVol = (helper.num(effectiveLipidRate) * (helper.num(feed.lipidHrs) || 24)) * lipidMultiplier;
    totalVol = mainVol + lipidVol;
  } else {
    const dVol = helper.num(effectiveDextRate) * (helper.num(feed.dextHrs) || 24);
    const aVol = helper.num(effectiveAARate)   * (helper.num(feed.aaHrs)   || 24);
    const lVol = (helper.num(effectiveLipidRate) * (helper.num(feed.lipidHrs) || 24)) * lipidMultiplier;
    totalVol = dVol + aVol + lVol;
  }

  const calcTNAConc = (gDay: string | number) => (totalVol > 0 && gDay) ? ((helper.num(gDay) / totalVol) * 100).toFixed(1) : "";
  const calcTNAGDay = (concPct: string | number) => (totalVol > 0 && concPct) ? ((helper.num(concPct) / 100) * totalVol).toFixed(1) : "";

  const dextDerived  = helper.deriveDextrose(effectiveDextRate, dHrs, feed.dextConc);
  const aaDerived    = helper.deriveAA(effectiveAARate, aHrs, feed.aaConc);
  const lipidDerived = rateMode === "tna"
    ? helper.deriveTNALipid(effectiveLipidRate, lHrs, feed.lipidConc)
    : helper.deriveLipid(effectiveLipidRate, lHrs, feed.lipidConc, feed.lipidFreq);

  const dextG  = dextDerived  ? dextDerived.g  : helper.num(feed.dextAmount);
  const aaG    = aaDerived    ? aaDerived.g    : helper.num(feed.aaAmount);
  const lipidG = lipidDerived ? lipidDerived.g : helper.num(feed.lipidAmount);

  const totalCal  = Math.round(dextG * 3.4 + aaG * 4 + lipidG * (rateMode === "tna" ? 10 : (constant.getLipidMeta(feed.lipidConc).kcalPerMl / constant.getLipidMeta(feed.lipidConc).gPerMl)));
  const totalProt = Math.round(aaG * 10) / 10;

  // For "three" mode, each macro has its own rate column
  const dextShowRate  = rateMode === "three";
  const aaShowRate    = rateMode === "three";
  const lipidShowRate = rateMode === "three";

  // Shared: TNA hides duration/hrs per-macro; 2-in-1 hides for dext+aa only
  const hideSharedMacroDurationHrs = rateMode === "tna" || rateMode === "twoplusone";

  // GIR for this individual bag
  const bagGIR = helper.calcGIR(dextG, patientWtKg);

  // Lipid frequency for display
  const lipidFreqDisplay = feed.lipidFreq || "7x";

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "7px", marginBottom: "0.75rem", overflow: "hidden" }}>
      <CollapseHeader
        label={feed.label || `PN Bag ${idx + 1}`}
        expanded={isExpanded}
        onToggle={() => update("expanded", !isExpanded)}
        accent="#8e44ad"
        badge={feed.route || null}
      />
      {isExpanded && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid #e2e8f0", background: "#fff" }}>

          {/* Row 1: Bag identity fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <Field label="Bag Label">
              <input type="text" value={feed.label} onChange={e => update("label", e.target.value)} placeholder={`PN Bag ${idx + 1}`}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </Field>
            <Field label="Indication">
              <input type="text" value={feed.indication} onChange={e => update("indication", e.target.value)} placeholder="e.g. GI failure…"
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              <Field label="Start Date"><input type="date" value={feed.startDate} onChange={e => update("startDate", e.target.value)} style={{ padding: "5px 6px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.82rem" }} /></Field>
              <Field label="Start Time"><input type="time" value={feed.startTime} onChange={e => update("startTime", e.target.value)} style={{ padding: "5px 6px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.82rem" }} /></Field>
            </div>
          </div>

          {/* Row 2: Clinical config */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem", marginBottom: "0.6rem" }}>
            <Field label="Route"><Sel value={feed.route} onChange={v => update("route", v)} options={constant.PN_ROUTES} /></Field>
            <Field label="Access Line"><Sel value={feed.access} onChange={v => update("access", v)} options={constant.PN_ACCESS} /></Field>
            <Field label="Delivery Method"><Sel value={feed.delivery} onChange={v => update("delivery", v)} options={constant.PN_DELIVERY} /></Field>
            <Field label="Goal"><Sel value={feed.goal} onChange={v => update("goal", v)} options={constant.PN_GOALS} /></Field>
          </div>

          {/* Macronutrients section */}
          <div style={{ background: "#faf5ff", border: "1px solid #e9d8fd", borderRadius: "7px", padding: "0.65rem 0.75rem", marginBottom: "0.6rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#6b46c1", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Macronutrients
            </div>

            {/* ── Combined rate bar (TNA and 2-in-1) ── */}
            {(rateMode === "tna" || rateMode === "twoplusone") && (
              <div style={{ marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "10px", background: "#ede9fe", borderRadius: "5px", padding: "0.45rem 0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b46c1" }}>
                    {rateMode === "tna" ? "TNA Rate:" : "Dext + AA Rate:"}
                  </span>
                  <NumInput value={feed.combinedRate} onChange={v => update("combinedRate", v)} placeholder="mL/hr" style={{ width: "80px" }} />
                  <span style={{ fontSize: "0.75rem", color: "#718096" }}>mL/hr</span>
                </div>
                {rateMode === "twoplusone" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", borderLeft: "1px solid #d8b4fe", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b46c1" }}>Lipid Rate:</span>
                    <NumInput value={feed.lipidRate} onChange={v => update("lipidRate", v)} placeholder="mL/hr" style={{ width: "80px" }} />
                    <span style={{ fontSize: "0.75rem", color: "#718096" }}>mL/hr</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Shared Duration + Hrs row for TNA (all 3 macros) and 2-in-1 (dext+aa) ── */}
            {rateMode === "tna" && (
              <SharedDurationRow
                label="Bag Duration (all macros)"
                color="#6b46c1"
                duration={sharedDuration}
                onDuration={handleSharedDurationChange}
                hrs={sharedHrs}
                onHrs={handleSharedHrsChange}
                hrsDisabled={sharedHrsDisabled}
              />
            )}
            {rateMode === "twoplusone" && (
              <SharedDurationRow
                label="Dextrose + AA Duration"
                color="#3182ce"
                duration={sharedDuration}
                onDuration={handleSharedDurationChange}
                hrs={sharedHrs}
                onHrs={handleSharedHrsChange}
                hrsDisabled={sharedHrsDisabled}
              />
            )}

            {/* ── Amino Acids ── */}
            <MacroSection label="Amino Acids" color="#3182ce"
              hrs={feed.aaHrs} onHrs={v => update("aaHrs", v)} hrsDisabled={feed.aaDuration === "Continuous"}
              duration={feed.aaDuration} onDuration={v => {
                const updates: any = { aaDuration: v };
                if (v === "Continuous") updates.aaHrs = "24";
                onChange({ ...feed, ...updates });
              }}
              rate={feed.aaRate} onRate={v => update("aaRate", v)} showRate={aaShowRate}
              amount={feed.aaAmount} onAmount={v => {
                const updates: any = { aaAmount: v };
                if (rateMode === "tna") updates.aaConc = calcTNAConc(v);
                onChange({ ...feed, ...updates });
              }}
              conc={feed.aaConc} onConc={v => {
                const updates: any = { aaConc: v };
                if (rateMode === "tna") updates.aaAmount = calcTNAGDay(v);
                onChange({ ...feed, ...updates });
              }}
              concOptions={constant.AA_CONC_OPTIONS} showConc={true}
              concPlaceholder={rateMode === "tna" ? calcTNAConc(feed.aaAmount) : "%"}
              derivedResult={aaDerived} derivedUnit="g protein"
              hideDurationHrs={hideSharedMacroDurationHrs}
            />

            {/* ── Dextrose ── */}
            <MacroSection label="Dextrose" color="#d69e2e"
              hrs={feed.dextHrs} onHrs={v => update("dextHrs", v)} hrsDisabled={feed.dextDuration === "Continuous"}
              duration={feed.dextDuration} onDuration={v => {
                const updates: any = { dextDuration: v };
                if (v === "Continuous") updates.dextHrs = "24";
                onChange({ ...feed, ...updates });
              }}
              rate={feed.dextRate} onRate={v => update("dextRate", v)} showRate={dextShowRate}
              amount={feed.dextAmount} onAmount={v => {
                const updates: any = { dextAmount: v };
                if (rateMode === "tna") updates.dextConc = calcTNAConc(v);
                onChange({ ...feed, ...updates });
              }}
              conc={feed.dextConc} onConc={v => {
                const updates: any = { dextConc: v };
                if (rateMode === "tna") updates.dextAmount = calcTNAGDay(v);
                onChange({ ...feed, ...updates });
              }}
              concOptions={constant.DEXT_CONC_OPTIONS} showConc={true}
              concPlaceholder={rateMode === "tna" ? calcTNAConc(feed.dextAmount) : "%"}
              derivedResult={dextDerived} derivedUnit="g dextrose"
              hideDurationHrs={hideSharedMacroDurationHrs}
            />

            {/* ── Lipids — 2-in-1 lipid keeps its own Duration+Hrs; TNA lipid shares ── */}
            <MacroSection label="Lipids (ILE)" color="#e67e22"
              hrs={feed.lipidHrs} onHrs={v => update("lipidHrs", v)} hrsDisabled={feed.lipidDuration === "Continuous"}
              duration={feed.lipidDuration} onDuration={handleLipidDurationChange}
              freq={rateMode !== "tna" ? (feed.lipidFreq || "7x") : undefined}
              onFreq={rateMode !== "tna" ? v => update("lipidFreq", v) : undefined}
              rate={feed.lipidRate} onRate={v => update("lipidRate", v)} showRate={lipidShowRate}
              rateLabel={rateMode === "twoplusone" ? "ILE Rate (mL/hr)" : "Rate (mL/hr)"}
              amount={feed.lipidAmount} onAmount={v => {
                const updates: any = { lipidAmount: v };
                if (rateMode === "tna") updates.lipidConc = calcTNAConc(v);
                onChange({ ...feed, ...updates });
              }}
              conc={feed.lipidConc} onConc={v => {
                const updates: any = { lipidConc: v };
                if (rateMode === "tna") updates.lipidAmount = calcTNAGDay(v);
                onChange({ ...feed, ...updates });
              }}
              showConc={rateMode === "tna"}
              concPlaceholder={rateMode === "tna" ? calcTNAConc(feed.lipidAmount) : "%"}
              derivedResult={lipidDerived} derivedUnit="g lipid"
              extra={rateMode !== "tna" ? <LipidConcButtons value={feed.lipidConc} onChange={v => update("lipidConc", v)} color="#e67e22" /> : null}
              // TNA lipid shares Duration+Hrs via the shared row above
              hideDurationHrs={rateMode === "tna"}
              // Pass freq for the per-infusion vs avg/day display (only for non-TNA)
              lipidFreqForDisplay={rateMode !== "tna" ? lipidFreqDisplay : undefined}
            />

            {/* Insulin */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4a5568" }}>Regular Insulin:</span>
              <NumInput value={feed.insulinUnits} onChange={v => update("insulinUnits", v)} placeholder="units" style={{ width: "80px" }} />
              <span style={{ fontSize: "0.75rem", color: "#718096" }}>units/bag</span>
            </div>
          </div>

          {/* Totals + GIR row */}
          {rateMode === "tna" ? (
            <TNASummary
              totalVol={totalVol}
              rate={helper.num(effectiveDextRate)}
              dextG={dextG}
              aaG={aaG}
              lipidG={lipidG}
              dextConc={feed.dextConc || calcTNAConc(feed.dextAmount)}
              aaConc={feed.aaConc || calcTNAConc(feed.aaAmount)}
              lipidConc={feed.lipidConc || calcTNAConc(feed.lipidAmount)}
              bagGIR={bagGIR}
              patientWtKg={patientWtKg}
              ageDays={ageDays}
            />
          ) : (
            <div style={{ background: "#f8f4ff", border: "1px solid #e9d8fd", borderRadius: "7px", padding: "0.85rem 1rem", marginBottom: "0.6rem", color: "#4a5568" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <NutrientChip label="Est. Calories" value={totalCal  > 0 ? totalCal  : "—"} unit="kcal/day" color="#e67e22" />
                <NutrientChip label="Est. Protein"  value={totalProt > 0 ? totalProt : "—"} unit="g/day"    color="#8e44ad" />
                <NutrientChip label="Est. Volume"   value={totalVol  > 0 ? Math.round(totalVol) : "—"} unit="mL/day" color="#3498db" />
                {bagGIR !== null && (
                  <GIRBadge dextGPerDay={dextG} wtKg={patientWtKg} label="GIR (this bag)" ageDays={ageDays} />
                )}
              </div>
              {bagGIR === null && patientWtKg <= 0 && dextG > 0 && (
                <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "6px 0 0", fontStyle: "italic" }}>
                  Enter patient weight in A1 to calculate GIR.
                </p>
              )}
            </div>
          )}

          {/* Micros — collapsed by default */}
          <MicroPanel title="Electrolytes & Trace Elements" fields={constant.ELECTROLYTES} values={feed.electrolytes}
            onChange={updateElectrolyte} accent="#2980b9" expanded={feed.electroExpanded} onToggle={() => update("electroExpanded", !feed.electroExpanded)} />
          <MicroPanel title="Vitamins" fields={constant.VITAMINS} values={feed.vitamins}
            onChange={updateVitamin} accent="#d35400" expanded={feed.vitExpanded} onToggle={() => update("vitExpanded", !feed.vitExpanded)} />

          <button onClick={onRemove} style={{ marginTop: "0.75rem", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem" }}>
            Remove Bag
          </button>
        </div>
      )}
    </div>
  );
}

interface D13ParenteralProps {
  state: PNState;
  setState: (s: PNState) => void;
  /** Patient weight kg for GIR calculation — sourced from anthro state */
  patientWtKg: number;
  ageDays: number | null;
}

function D13Parenteral({ state, setState, patientWtKg, ageDays }: D13ParenteralProps) {
  const addBag    = () => setState({ bags: [...state.bags, helper.makePNFeed(state.nextId)], nextId: state.nextId + 1 });
  const updateBag = (id: number, updated: PNFeed) => setState({ ...state, bags: state.bags.map(b => b.id === id ? updated : b) });
  const removeBag = (id: number) => setState({ ...state, bags: state.bags.filter(b => b.id !== id) });

  // Aggregate GIR across all PN bags
  const aggregateDextG = state.bags.reduce((sum, bag) => {
    const rateMode = helper.getRateMode(bag.delivery);
    const effectiveDextRate = (rateMode === "tna" || rateMode === "twoplusone") ? bag.combinedRate : bag.dextRate;
    const masterHrs = rateMode === "tna" ? (helper.num(bag.dextHrs) || helper.num(bag.aaHrs) || helper.num(bag.lipidHrs) || 24) : 0;
    const dHrs = (rateMode === "tna" && !bag.dextHrs) ? masterHrs : bag.dextHrs;
    const dextDerived = helper.deriveDextrose(effectiveDextRate, dHrs, bag.dextConc);
    const dextG = dextDerived ? dextDerived.g : helper.num(bag.dextAmount);
    return sum + dextG;
  }, 0);

  const aggregateGIR = helper.calcGIR(aggregateDextG, patientWtKg);
  const showAggregateGIR = state.bags.length > 1 && aggregateGIR !== null;

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <SectionHeader title="D13: Parenteral Nutrition (PN)" subtitle="Add one entry per PN bag order" color="#8e44ad" />
          {patientWtKg <= 0 && (
            <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "-0.5rem 0 0", fontStyle: "italic" }}>
              Enter patient weight in A1 to enable GIR calculation.
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {showAggregateGIR && (
            <GIRBadge dextGPerDay={aggregateDextG} wtKg={patientWtKg} label="Total GIR" ageDays={ageDays} />
          )}
          <button onClick={addBag} style={{ background: "#8e44ad", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}>
            + Add PN Bag
          </button>
        </div>
      </div>

      {state.bags.map((bag, idx) => (
        <PNFeedCard key={bag.id} feed={bag} idx={idx} onChange={updated => updateBag(bag.id, updated)} onRemove={() => removeBag(bag.id)} patientWtKg={patientWtKg} ageDays={ageDays} />
      ))}

      {/* Aggregate GIR summary when multiple bags */}
      {showAggregateGIR && (
        <div style={{ background: "#faf5ff", border: "1px solid #e9d8fd", borderRadius: "7px", padding: "0.75rem", marginTop: "0.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b46c1", marginBottom: "0.5rem" }}>
            Aggregate PN Glucose Load (All Bags)
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <GIRBadge dextGPerDay={aggregateDextG} wtKg={patientWtKg} label="Combined GIR" ageDays={ageDays} />
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
              Total dextrose: {Math.round(aggregateDextG * 10) / 10} g/day across {state.bags.length} bags
            </span>
          </div>
          <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "6px 0 0" }}>
            ASPEN targets: infants 10–14, children 8–10, adolescents 5–6, adults &lt;5 mg/kg/min (preferred &lt;3). Excess GIR risks hyperglycemia and hepatic steatosis.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab Navigation & Root ────────────────────────────────────────────────────

const TABS = [
  { id: "D11", label: "D11 – Oral",       color: "#3498db" },
  { id: "D12", label: "D12 – Enteral",    color: "#27ae60" },
  { id: "D13", label: "D13 – Parenteral", color: "#8e44ad" },
];

export default function D1NutritionRx() {
  const { dietary, setDietary } = useDietaryStore();
  const { anthro } = useAnthroStore();
  const patientWtKg = helper.num(anthro.wt);
  const { ageDays } = useCalculatedMetrics();

  const [activeTab, setActiveTab] = useState<string>("D11");

  const savedFormulas: string[] = (dietary as any).savedFormulas || [];

  const handleAddFormula = (name: string) => {
    if (savedFormulas.includes(name)) return;
    setDietary({ savedFormulas: [...((dietary as any).savedFormulas || []), name] } as any);
  };

  const handleDeleteFormula = (name: string) => {
    setDietary({ savedFormulas: ((dietary as any).savedFormulas || []).filter((f: string) => f !== name) } as any);
  };

  const enState: ENState = (dietary as any).enState || { feeds: [helper.makeENFeed(1)], savedFormulas: [], nextId: 2 };
  const pnState: PNState = (dietary as any).pnState || { bags: [helper.makePNFeed(1)], nextId: 2 };

  const setEnState = (s: ENState) => setDietary({ enState: s } as any);
  const setPnState = (s: PNState) => setDietary({ pnState: s } as any);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: "3px", marginBottom: "1rem", background: "#f4f7f6", padding: "3px", borderRadius: "9px", width: "fit-content" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 18px", border: "none", borderRadius: "6px", cursor: "pointer",
            fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
            background: activeTab === tab.id ? tab.color : "transparent",
            color: activeTab === tab.id ? "#fff" : "#718096",
            boxShadow: activeTab === tab.id ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: activeTab === "D11" ? "block" : "none" }}>
        <D11Oral dietary={dietary} setDietary={setDietary as (d: Dietary) => void} />
      </div>
      <div style={{ display: activeTab === "D12" ? "block" : "none" }}>
        <D12Enteral state={enState} setState={setEnState} savedFormulas={savedFormulas} onAddFormula={handleAddFormula} onDeleteFormula={handleDeleteFormula} />
      </div>
      <div style={{ display: activeTab === "D13" ? "block" : "none" }}>
        <D13Parenteral state={pnState} setState={setPnState} patientWtKg={patientWtKg} ageDays={ageDays} />
      </div>

      <div className="card" style={{ marginTop: "1.5rem", borderTop: "2px solid #3498db" }}>
        <SectionHeader title="D14: Total Daily Intake (Global)" color="#2c3e50" />
        <p style={{ fontSize: "0.8rem", color: "#718096", marginBottom: "1rem" }}>
          Final verified intakes used for calculations. (Optional)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
          <Field label="Total Calories (kcal/d)">
            <NumInput value={dietary.totalKcal || ""} onChange={v => setDietary({ totalKcal: v })} placeholder="Total kcal" />
          </Field>
          <Field label="Total Protein (g/d)">
            <NumInput value={dietary.totalProtein || ""} onChange={v => setDietary({ totalProtein: v })} placeholder="Total g" />
          </Field>
          <Field label="Total Fat (g/d)">
            <NumInput value={dietary.totalFat || ""} onChange={v => setDietary({ totalFat: v })} placeholder="Total g" />
          </Field>
          <Field label="Total CHO (g/d)">
            <NumInput value={dietary.totalCho || ""} onChange={v => setDietary({ totalCho: v })} placeholder="Total g" />
          </Field>
        </div>
      </div>
    </div>
  );
}