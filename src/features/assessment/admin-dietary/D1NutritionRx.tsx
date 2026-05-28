import React, { useState } from "react";
import * as helper from "./helper";
import * as constant from "./constant";
import { Dietary, MicroNutrientParams, ENFeed, PNFeed, ENState, PNState } from "../../../shared/types/index";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { SelectInput as Sel } from "../../../shared/ui/SelectInput";
import { StatChip as NutrientChip } from "../../../shared/ui/StatChip";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Tooltip } from "../../../shared/ui/Tooltip";


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

// ─── PN MacroSection ──────────────────────────────────────────────────────────
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
}

function MacroSection({
  label, color, hrs, onHrs, hrsDisabled, duration, onDuration, freq, onFreq,
  rate, onRate, showRate, rateLabel = "Rate (mL/hr)",
  amount, onAmount,
  conc, onConc, concOptions = [], showConc,
  derivedResult, derivedUnit, extra,
}: MacroSectionProps) {
  const cols: string[] = ["135px", "75px"];
  if (onFreq) cols.push("115px");
  if (showRate) cols.push("105px");
  cols.push("1fr");
  if (showConc) cols.push("105px");
  if (extra) cols.push("130px");

  return (
    <div style={{ background: "#fff", border: `1px solid ${color}30`, borderRadius: "8px", padding: "0.85rem", marginBottom: "0.75rem" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color, marginBottom: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: cols.join(" "), gap: "0.55rem", alignItems: "end" }}>
        <Field label="Duration Plan">
          <Sel value={duration} onChange={onDuration} options={constant.PN_DURATIONS} placeholder="Select..." />
        </Field>
        <Field label="Hours">
          <Tooltip text={hrsDisabled ? "Continuous duration is fixed at 24 hours." : ""}>
            <NumInput value={hrs} onChange={onHrs} placeholder="24" disabled={hrsDisabled} />
          </Tooltip>
        </Field>
        {onFreq && (
          <Field label="Frequency">
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <select value={freq} onChange={e => onFreq(e.target.value)}
                style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", flex: 1 }}>
                {constant.LIPID_FREQ_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span style={{ fontSize: "0.72rem", color: "#718096", whiteSpace: "nowrap" }}>per week</span>
            </div>
          </Field>
        )}
        {showRate && (
          <Field label={rateLabel}>
            <NumInput value={rate} onChange={onRate} placeholder="mL/hr" />
          </Field>
        )}
        <Field label="Amount (g) per day">
          <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
            <NumInput
              value={amount}
              onChange={onAmount}
              placeholder={derivedResult ? `${Math.round(derivedResult.g * 10) / 10} (Auto)` : "g/day"}
              style={{ flex: 1 }}
            />
          </div>
        </Field>
        {showConc && (
          <Field label="Conc (%)">
            <select value={conc} onChange={e => onConc(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}>
              <option value="">—</option>
              {concOptions.map(o => <option key={o} value={o}>{o}%</option>)}
            </select>
          </Field>
        )}
        {extra}
      </div>
      {derivedResult && (
        <DerivedBadge g={derivedResult.g} kcal={derivedResult.kcal} unit={derivedUnit} color={color} />
      )}
    </div>
  );
}

// ─── Lipid concentration button group ────────────────────────────────────────
function LipidConcButtons({ value, onChange, color }: { value: string; onChange: (v: "10" | "20" | "30") => void; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#34495e" }}>Conc</label>
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

// ─── MicroPanel — uses defaultUnit from constant lists ───────────────────────
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
    <div style={{ marginTop: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
      <CollapseHeader label={title} expanded={expanded} onToggle={onToggle} accent={accent} />
      {expanded && (
        <div style={{ padding: "0.75rem", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0 0 0.6rem", fontStyle: "italic" }}>
            Units defaulted to US clinical standards (ASPEN/ASHP). Change as needed.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem" }}>
            {fields.map(f => {
              const currentUnit = values[f.key]?.unit || f.defaultUnit;
              return (
                <Field key={f.key} label={f.label}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <NumInput value={values[f.key]?.amount || ""} onChange={v => onChange(f.key, "amount", v)} style={{ flex: 1 }} />
                    <select
                      value={currentUnit}
                      onChange={e => onChange(f.key, "unit", e.target.value)}
                      style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "58px" }}
                    >
                      {constant.AMOUNT_UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <select value={values[f.key]?.rate || "per day"} onChange={e => onChange(f.key, "rate", e.target.value)}
                      style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "72px" }}>
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
    <div style={{ background: "#fff", border: "1px solid #e0f2fe", borderLeft: "3px solid #0ea5e9", borderRadius: "6px", padding: "0.75rem", marginBottom: "0.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <Field label="Modular Type">
          <select
            value={modular.type}
            onChange={e => upd("type", e.target.value)}
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
          >
            <option value="">— Select type —</option>
            {constant.EN_MODULAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Product / Brand">
          <input
            type="text"
            value={modular.product}
            onChange={e => upd("product", e.target.value)}
            placeholder="e.g. Beneprotein, Polycose…"
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
          />
        </Field>
        <Field label="Frequency">
          <select
            value={modular.frequency}
            onChange={e => upd("frequency", e.target.value)}
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
          >
            {constant.EN_MODULAR_FREQ.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", alignItems: "end" }}>
        <Field label="Amount">
          <div style={{ display: "flex", gap: "3px" }}>
            <NumInput value={modular.amount} onChange={v => upd("amount", v)} style={{ flex: 1 }} placeholder="qty" />
            <select
              value={modular.unit}
              onChange={e => upd("unit", e.target.value)}
              style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "62px" }}
            >
              {constant.EN_MODULAR_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </Field>
        <Field label="kcal contributed">
          <NumInput value={modular.kcal} onChange={v => upd("kcal", v)} placeholder="0" />
        </Field>
        <Field label="Protein (g)">
          <NumInput value={modular.protein} onChange={v => upd("protein", v)} placeholder="0" />
        </Field>
        <Field label="Notes">
          <input
            type="text"
            value={modular.notes}
            onChange={e => upd("notes", e.target.value)}
            placeholder="optional"
            style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
          />
        </Field>
      </div>

      {(kcalNum > 0 || protNum > 0) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
          {kcalNum > 0 && <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", borderRadius: "4px", padding: "2px 8px", fontWeight: 700 }}>+{Math.round(kcalNum)} kcal</span>}
          {protNum > 0 && <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#166534", borderRadius: "4px", padding: "2px 8px", fontWeight: 700 }}>+{protNum}g protein</span>}
        </div>
      )}

      <button onClick={onRemove} style={{ marginTop: "0.6rem", background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "4px", padding: "2px 10px", cursor: "pointer", fontSize: "0.72rem" }}>
        Remove Modular
      </button>
    </div>
  );
}

// ─── EN Modular Panel ────────────────────────────────────────────────────────
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
    <div style={{ marginTop: "0.75rem", border: "1px solid #bae6fd", borderRadius: "8px", overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", padding: "8px 14px",
          background: modulars.length > 0 ? "#f0f9ff" : "#f8fafc",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0369a1" }}>
            Modular Additives
          </span>
          {modulars.length > 0 && (
            <span style={{ fontSize: "0.68rem", background: "#0ea5e9", color: "#fff", borderRadius: "10px", padding: "1px 8px", fontWeight: 700 }}>
              {modulars.length} added
            </span>
          )}
          {totalKcal > 0 && (
            <span style={{ fontSize: "0.68rem", background: "#fef3c7", color: "#92400e", borderRadius: "10px", padding: "1px 8px", fontWeight: 700 }}>
              +{Math.round(totalKcal)} kcal
            </span>
          )}
          {totalProtein > 0 && (
            <span style={{ fontSize: "0.68rem", background: "#f0fdf4", color: "#166534", borderRadius: "10px", padding: "1px 8px", fontWeight: 700 }}>
              +{totalProtein}g protein
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={e => { e.stopPropagation(); addModular(); }}
            style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "5px", padding: "3px 10px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
          >
            + Add Modular
          </button>
          <span style={{ color: "#0369a1", fontSize: "0.75rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid #bae6fd", background: "#f0f9ff" }}>
          {modulars.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
              No modular additives. Click "+ Add Modular" to supplement protein, carbohydrates, fat, or other nutrients.
            </p>
          ) : (
            modulars.map(m => (
              <ENModularCard
                key={m.id}
                modular={m}
                onUpdate={updated => updateModular(m.id, updated)}
                onRemove={() => removeModular(m.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── D11: Oral Nutrition ──────────────────────────────────────────────────────
interface D11OralProps { dietary: Dietary; setDietary: (d: Dietary) => void; }

function D11Oral({ dietary, setDietary }: D11OralProps) {
  const handleUpdate = (field: string, val: string) =>
    setDietary({ ...dietary, [field]: val });
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="card">
        <SectionHeader title="D11: Oral Diet & Intake" color="#3498db" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label>Rx Diet Order</label>
            <textarea
              value={dietary.dietOrder || ""}
              onChange={e => handleUpdate("dietOrder", e.target.value)}
              placeholder="e.g. Standard Diet, Regular"
              style={{ background: "#edf2f7", minHeight: "45px" }}
            />
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
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }}
        >
          <option value="">— Select formula —</option>
          {savedFormulas.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button
          onClick={() => setEditing(e => !e)}
          title="Add new formula to library"
          style={{ background: "#3498db", color: "#fff", border: "none", borderRadius: "5px", padding: "5px 10px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + New
        </button>
        {value && (
          <button
            onClick={() => { onDeleteFormula(value); onChange(""); }}
            title="Remove this formula from library"
            style={{ background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "5px", padding: "5px 8px", fontSize: "0.72rem", cursor: "pointer" }}
          >
            🗑
          </button>
        )}
      </div>

      {editing && (
        <div style={{ display: "flex", gap: "6px", marginTop: "4px", padding: "8px", background: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setEditing(false); }}
            placeholder="Formula name (e.g. Jevity 1.5, Peptamen…)"
            autoFocus
            style={{ flex: 1, padding: "5px 8px", border: "1px solid #93c5fd", borderRadius: "4px", fontSize: "0.85rem" }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            style={{ background: "#3498db", color: "#fff", border: "none", borderRadius: "5px", padding: "5px 14px", fontSize: "0.8rem", fontWeight: 700, cursor: newName.trim() ? "pointer" : "not-allowed", opacity: newName.trim() ? 1 : 0.6 }}
          >
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setNewName(""); }}
            style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 10px", fontSize: "0.8rem", cursor: "pointer" }}
          >
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

  const updateModulars = (newModulars: constant.ENModular[], nextId: number) => {
    onChange({ ...feed, modulars: newModulars, nextModularId: nextId } as any);
  };

  const modularKcal    = modulars.reduce((s, m) => s + helper.num(m.kcal), 0);
  const modularProtein = modulars.reduce((s, m) => s + helper.num(m.protein), 0);
  const totalCalWithMod  = nutrients.totalCal + Math.round(modularKcal);
  const totalProtWithMod = Math.round((nutrients.totalProt + modularProtein) * 10) / 10;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "1rem", overflow: "hidden" }}>
      <CollapseHeader
        label={feed.label || `Feed ${idx + 1}`}
        expanded={isExpanded}
        onToggle={() => update("expanded", !isExpanded)}
        accent="#27ae60"
        badge={feed.route ? feed.route.split(" ")[0] : null}
      />
      {isExpanded && (
        <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <Field label="Feed Label">
              <input
                type="text"
                value={feed.label}
                onChange={e => update("label", e.target.value)}
                placeholder={`Feed ${idx + 1}`}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }}
              />
            </Field>
            <Field label="Route & Access">
              <Sel value={feed.route} onChange={v => update("route", v)} options={constant.EN_ROUTES} placeholder="Select route..." />
            </Field>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#34495e", marginBottom: "6px" }}>Delivery Type</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["continuous", "bolus"].map(t => (
                <button key={t} onClick={() => update("type", t)} style={{
                  padding: "6px 18px", borderRadius: "20px", border: "1px solid",
                  borderColor: feed.type === t ? "#27ae60" : "#e2e8f0",
                  background: feed.type === t ? "#27ae60" : "transparent",
                  color: feed.type === t ? "#fff" : "#555",
                  fontWeight: 600, fontSize: "0.83rem", cursor: "pointer",
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <Field label="Formula">
              <FormulaManager
                savedFormulas={savedFormulas}
                value={feed.formula}
                onChange={v => update("formula", v)}
                onAddFormula={onAddFormula}
                onDeleteFormula={onDeleteFormula}
              />
            </Field>
          </div>

          {feed.type === "bolus" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              <Field label="mL per bolus"><NumInput value={feed.bolusMl} onChange={v => update("bolusMl", v)} /></Field>
              <Field label="Times per day"><NumInput value={feed.bolusTimesPerDay} onChange={v => update("bolusTimesPerDay", v)} /></Field>
              <Field label="Every (hrs)"><NumInput value={feed.bolusEveryHrs} onChange={v => update("bolusEveryHrs", v)} /></Field>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <Field label="Rate (mL/hr)"><NumInput value={feed.continuousRate} onChange={v => update("continuousRate", v)} /></Field>
              <Field label="Hours per day"><NumInput value={feed.continuousHrs} onChange={v => update("continuousHrs", v)} /></Field>
            </div>
          )}

          <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#718096", marginBottom: "0.5rem" }}>Flushes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
              <Field label="mL per flush"><NumInput value={feed.flushMl} onChange={v => update("flushMl", v)} /></Field>
              <Field label="Times per day"><NumInput value={feed.flushTimesPerDay} onChange={v => update("flushTimesPerDay", v)} /></Field>
              <Field label="Every (hrs)"><NumInput value={feed.flushEveryHrs} onChange={v => update("flushEveryHrs", v)} /></Field>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            <Field label="Cal/mL" hint="e.g. 1.0, 1.5, 2.0"><NumInput value={feed.calPerMl} onChange={v => update("calPerMl", v)} placeholder="1.0" /></Field>
            <Field label="Protein (g/L)" hint="from formula label"><NumInput value={feed.protGPerL} onChange={v => update("protGPerL", v)} placeholder="44" /></Field>
            <Field label="Free Water (%)" hint="0–100"><NumInput value={feed.fwPct} onChange={v => update("fwPct", v)} placeholder="85" /></Field>
          </div>

          <ENModularPanel
            modulars={modulars}
            nextModularId={nextModularId}
            onUpdate={updateModulars}
          />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "0.75rem", borderTop: "1px solid #f0f0f0", marginTop: "0.75rem" }}>
            <NutrientChip label="Volume" value={nutrients.totalMl} unit="mL/day" color="#3498db" />
            <NutrientChip
              label="Calories"
              value={totalCalWithMod > 0 ? (modularKcal > 0 ? `${totalCalWithMod} (+${Math.round(modularKcal)})` : totalCalWithMod) : nutrients.totalCal}
              unit="kcal/day"
              color="#e67e22"
            />
            <NutrientChip
              label="Protein"
              value={totalProtWithMod > 0 ? (modularProtein > 0 ? `${totalProtWithMod} (+${modularProtein})` : totalProtWithMod) : nutrients.totalProt}
              unit="g/day"
              color="#8e44ad"
            />
            <NutrientChip label="Free Water" value={nutrients.totalFw} unit="mL/day" color="#27ae60" />
            <NutrientChip label="Flush Water" value={nutrients.flushMl} unit="mL/day" color="#0891b2" />
          </div>

          <button onClick={onRemove} style={{ marginTop: "0.75rem", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}>
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
    return {
      vol:   acc.vol + n.totalMl,
      cal:   acc.cal + n.totalCal + modKcal,
      prot:  acc.prot + n.totalProt + modProt,
      fw:    acc.fw + n.totalFw,
      flush: acc.flush + n.flushMl,
    };
  }, { vol: 0, cal: 0, prot: 0, fw: 0, flush: 0 });

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <SectionHeader title="D12: Enteral Nutrition (EN)" subtitle="Add one entry per formula or delivery method" color="#27ae60" />
        <button onClick={addFeed} style={{ background: "#27ae60", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Add Feed
        </button>
      </div>

      {state.feeds.map((feed, idx) => (
        <ENFeedCard
          key={feed.id}
          feed={feed}
          idx={idx}
          onChange={updated => updateFeed(feed.id, updated)}
          onRemove={() => removeFeed(feed.id)}
          savedFormulas={savedFormulas}
          onAddFormula={onAddFormula}
          onDeleteFormula={onDeleteFormula}
        />
      ))}

      {state.feeds.length > 1 && (
        <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "8px", padding: "1rem", marginTop: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#276749", marginBottom: "0.75rem" }}>
            Total EN Delivery (All Feeds + Modulars Combined)
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <NutrientChip label="Total Volume"      value={Math.round(totals.vol)}                unit="mL/day"   color="#27ae60" />
            <NutrientChip label="Total Calories"    value={Math.round(totals.cal)}                unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Total Protein"     value={Math.round(totals.prot * 10) / 10}    unit="g/day"    color="#8e44ad" />
            <NutrientChip label="Total Free Water"  value={Math.round(totals.fw)}                unit="mL/day"   color="#3498db" />
            <NutrientChip label="Total Flush Water" value={Math.round(totals.flush)}             unit="mL/day"   color="#0891b2" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── D13: Parenteral Nutrition ────────────────────────────────────────────────

interface PNFeedCardProps { feed: PNFeed; idx: number; onChange: (updated: PNFeed) => void; onRemove: () => void; }

function PNFeedCard({ feed, idx, onChange, onRemove }: PNFeedCardProps) {
  const update = (field: keyof PNFeed, val: any) => onChange({ ...feed, [field]: val });
  const isExpanded = feed.expanded;
  const rateMode = helper.getRateMode(feed.delivery);

  const updateElectrolyte = (key: string, sf: string, val: string) =>
    onChange({ ...feed, electrolytes: { ...feed.electrolytes, [key]: { ...(feed.electrolytes[key] || {}), [sf]: val } } });
  const updateVitamin = (key: string, sf: string, val: string) =>
    onChange({ ...feed, vitamins: { ...feed.vitamins, [key]: { ...(feed.vitamins[key] || {}), [sf]: val } } });

  const effectiveDextRate  = (rateMode === "tna" || rateMode === "twoplusone") ? feed.combinedRate : feed.dextRate;
  const effectiveAARate    = (rateMode === "tna" || rateMode === "twoplusone") ? feed.combinedRate : feed.aaRate;
  const effectiveLipidRate = rateMode === "tna" ? feed.combinedRate : feed.lipidRate;

  const dextDerived  = helper.deriveDextrose(effectiveDextRate, feed.dextHrs, feed.dextConc);
  const aaDerived    = helper.deriveAA(effectiveAARate, feed.aaHrs, feed.aaConc);
  const lipidDerived = helper.deriveLipid(effectiveLipidRate, feed.lipidHrs, feed.lipidConc, feed.lipidFreq);

  const dextG  = dextDerived  ? dextDerived.g  : helper.num(feed.dextAmount);
  const aaG    = aaDerived    ? aaDerived.g    : helper.num(feed.aaAmount);
  const lipidG = lipidDerived ? lipidDerived.g : helper.num(feed.lipidAmount);

  const totalCal  = Math.round(dextG * 3.4 + aaG * 4 + lipidG * (constant.getLipidMeta(feed.lipidConc).kcalPerMl / constant.getLipidMeta(feed.lipidConc).gPerMl));
  const totalProt = Math.round(aaG * 10) / 10;

  // Weekly frequency multiplier for daily average
  const lipidMultiplier = (feed.lipidFreq && feed.lipidFreq.endsWith("x")) ? (parseInt(feed.lipidFreq) / 7) : 1;

  let totalVol = 0;
  if (rateMode === "tna") {
    totalVol = helper.num(effectiveDextRate) * (helper.num(feed.dextHrs) || 24);
  } else if (rateMode === "twoplusone") {
    const mainVol = helper.num(effectiveDextRate) * (helper.num(feed.dextHrs) || 24);
    const lipidVol = (helper.num(effectiveLipidRate) * (helper.num(feed.lipidHrs) || 24)) * lipidMultiplier;
    totalVol = mainVol + lipidVol;
  } else {
    const dVol = helper.num(effectiveDextRate) * (helper.num(feed.dextHrs) || 24);
    const aVol = helper.num(effectiveAARate)   * (helper.num(feed.aaHrs)   || 24);
    const lVol = (helper.num(effectiveLipidRate) * (helper.num(feed.lipidHrs) || 24)) * lipidMultiplier;
    totalVol = dVol + aVol + lVol;
  }

  const dextShowRate  = rateMode === "three";
  const aaShowRate    = rateMode === "three";
  const lipidShowRate = rateMode === "three";

  const handleDurationChange = (macro: "dext" | "aa" | "lipid", plan: string) => {
    const updates: any = { [`${macro}Duration`]: plan };
    if (plan === "Continuous") {
      updates[`${macro}Hrs`] = "24";
    } else if (plan === "Cyclic") {
      if (feed[`${macro}Hrs` as keyof PNFeed] === "24") {
        updates[`${macro}Hrs`] = "";
      }
    }
    onChange({ ...feed, ...updates });
  };

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "1rem", overflow: "hidden" }}>
      <CollapseHeader label={feed.label || `PN Bag ${idx + 1}`} expanded={isExpanded} onToggle={() => update("expanded", !isExpanded)} accent="#8e44ad" badge={feed.route || null} />
      {isExpanded && (
        <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", background: "#fff" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <Field label="Bag Label">
              <input type="text" value={feed.label} onChange={e => update("label", e.target.value)} placeholder={`PN Bag ${idx + 1}`} style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </Field>
            <Field label="Indication / Reason for PN">
              <input type="text" value={feed.indication} onChange={e => update("indication", e.target.value)} placeholder="e.g. GI failure, post-op ileus..." style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            <Field label="Route"><Sel value={feed.route} onChange={v => update("route", v)} options={constant.PN_ROUTES} /></Field>
            <Field label="Access Line"><Sel value={feed.access} onChange={v => update("access", v)} options={constant.PN_ACCESS} /></Field>
            <Field label="Delivery Method"><Sel value={feed.delivery} onChange={v => update("delivery", v)} options={constant.PN_DELIVERY} /></Field>
            <Field label="Goal"><Sel value={feed.goal} onChange={v => update("goal", v)} options={constant.PN_GOALS} /></Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <Field label="Start Date"><input type="date" value={feed.startDate} onChange={e => update("startDate", e.target.value)} style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} /></Field>
            <Field label="Start Time"><input type="time" value={feed.startTime} onChange={e => update("startTime", e.target.value)} style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} /></Field>
          </div>

          <div style={{ background: "#faf5ff", border: "1px solid #e9d8fd", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b46c1", marginBottom: "0.85rem", textTransform: "uppercase" }}>Macronutrients</div>

            {(rateMode === "tna" || rateMode === "twoplusone") && (
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "12px", background: "#ede9fe", borderRadius: "6px", padding: "0.6rem 1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6b46c1" }}>
                    {rateMode === "tna" ? "TNA Infusion Rate:" : "Dextrose + AA Combined Rate:"}
                  </span>
                  <NumInput value={feed.combinedRate} onChange={v => update("combinedRate", v)} placeholder="mL/hr" style={{ width: "90px" }} />
                  <span style={{ fontSize: "0.8rem", color: "#718096" }}>mL/hr</span>
                </div>
                {rateMode === "twoplusone" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid #d8b4fe", paddingLeft: "12px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6b46c1" }}>Lipid Rate (ILE):</span>
                    <NumInput value={feed.lipidRate} onChange={v => update("lipidRate", v)} placeholder="mL/hr" style={{ width: "90px" }} />
                    <span style={{ fontSize: "0.8rem", color: "#718096" }}>mL/hr</span>
                  </div>
                )}
              </div>
            )}

            <MacroSection
              label="Amino Acids" color="#3182ce"
              hrs={feed.aaHrs} onHrs={v => update("aaHrs", v)}
              hrsDisabled={feed.aaDuration === "Continuous"}
              duration={feed.aaDuration} onDuration={v => handleDurationChange("aa", v)}
              rate={feed.aaRate} onRate={v => update("aaRate", v)} showRate={aaShowRate}
              amount={feed.aaAmount}
              onAmount={v => update("aaAmount", v)}
              conc={feed.aaConc} onConc={v => update("aaConc", v)}
              concOptions={constant.AA_CONC_OPTIONS} showConc={true}
              derivedResult={aaDerived} derivedUnit="g protein"
            />
            <MacroSection
              label="Dextrose" color="#d69e2e"
              hrs={feed.dextHrs} onHrs={v => update("dextHrs", v)}
              hrsDisabled={feed.dextDuration === "Continuous"}
              duration={feed.dextDuration} onDuration={v => handleDurationChange("dext", v)}
              rate={feed.dextRate} onRate={v => update("dextRate", v)} showRate={dextShowRate}
              amount={feed.dextAmount}
              onAmount={v => update("dextAmount", v)}
              conc={feed.dextConc} onConc={v => update("dextConc", v)}
              concOptions={constant.DEXT_CONC_OPTIONS} showConc={true}
              derivedResult={dextDerived} derivedUnit="g dextrose"
            />
            <MacroSection
              label="Lipids (ILE)" color="#e67e22"
              hrs={feed.lipidHrs} onHrs={v => update("lipidHrs", v)}
              hrsDisabled={feed.lipidDuration === "Continuous"}
              duration={feed.lipidDuration} onDuration={v => handleDurationChange("lipid", v)}
              freq={rateMode !== "tna" ? (feed.lipidFreq || "7x") : undefined}
              onFreq={rateMode !== "tna" ? v => update("lipidFreq", v) : undefined}
              rate={feed.lipidRate} onRate={v => update("lipidRate", v)} showRate={lipidShowRate}
              rateLabel={rateMode === "twoplusone" ? "Lipid Rate (mL/hr)" : "Rate (mL/hr)"}
              amount={feed.lipidAmount}
              onAmount={v => update("lipidAmount", v)}
              conc={feed.lipidConc} onConc={() => {}} showConc={false}
              derivedResult={lipidDerived} derivedUnit="g lipid"
              extra={<LipidConcButtons value={feed.lipidConc} onChange={v => update("lipidConc", v)} color="#e67e22" />}
            />

            {feed.lipidOil !== undefined && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <Field label="Oil"><Sel value={feed.lipidOil} onChange={v => update("lipidOil", v)} options={constant.LIPID_OILS} /></Field>
                {feed.lipidOil === "Custom (specify)" && (
                  <Field label="Specify oil blend">
                    <input type="text" value={feed.lipidCustomOil} onChange={e => update("lipidCustomOil", e.target.value)} placeholder="e.g. SMOF + fish oil..." style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
                  </Field>
                )}
              </div>
            )}

            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4a5568" }}>Regular Insulin:</span>
              <NumInput value={feed.insulinUnits} onChange={v => update("insulinUnits", v)} placeholder="units" style={{ width: "90px" }} />
              <span style={{ fontSize: "0.8rem", color: "#718096" }}>units/bag</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", background: "#f8f4ff", borderRadius: "8px", border: "1px solid #e9d8fd" }}>
            <NutrientChip label="Est. Calories" value={totalCal  > 0 ? totalCal  : "—"} unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Est. Protein"  value={totalProt > 0 ? totalProt : "—"} unit="g/day"    color="#8e44ad" />
            <NutrientChip label="Est. Volume"   value={totalVol  > 0 ? totalVol  : "—"} unit="mL/day"   color="#3498db" />
          </div>

          <MicroPanel
            title="Electrolytes & Trace Elements"
            fields={constant.ELECTROLYTES}
            values={feed.electrolytes}
            onChange={updateElectrolyte}
            accent="#2980b9"
            expanded={feed.electroExpanded}
            onToggle={() => update("electroExpanded", !feed.electroExpanded)}
          />
          <MicroPanel
            title="Vitamins"
            fields={constant.VITAMINS}
            values={feed.vitamins}
            onChange={updateVitamin}
            accent="#d35400"
            expanded={feed.vitExpanded}
            onToggle={() => update("vitExpanded", !feed.vitExpanded)}
          />

          <button onClick={onRemove} style={{ marginTop: "1rem", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}>
            Remove Bag
          </button>
        </div>
      )}
    </div>
  );
}

interface D13ParenteralProps { state: PNState; setState: (s: PNState) => void; }

function D13Parenteral({ state, setState }: D13ParenteralProps) {
  const addBag    = () => setState({ bags: [...state.bags, helper.makePNFeed(state.nextId)], nextId: state.nextId + 1 });
  const updateBag = (id: number, updated: PNFeed) => setState({ ...state, bags: state.bags.map(b => b.id === id ? updated : b) });
  const removeBag = (id: number) => setState({ ...state, bags: state.bags.filter(b => b.id !== id) });

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <SectionHeader title="D13: Parenteral Nutrition (PN)" subtitle="Add one entry per PN bag order" color="#8e44ad" />
        <button onClick={addBag} style={{ background: "#8e44ad", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Add PN Bag
        </button>
      </div>
      {state.bags.map((bag, idx) => (
        <PNFeedCard key={bag.id} feed={bag} idx={idx} onChange={updated => updateBag(bag.id, updated)} onRemove={() => removeBag(bag.id)} />
      ))}
    </div>
  );
}

// ─── Tab Navigation & Root ────────────────────────────────────────────────────

const TABS = [
  { id: "D11", label: "D11 – Oral",       color: "#3498db" },
  { id: "D12", label: "D12 – Enteral",    color: "#27ae60" },
  { id: "D13", label: "D13 – Parenteral", color: "#8e44ad" },
];

interface D1NutritionRxProps {
  dietary?: Dietary;
  setDietary?: (d: Dietary | ((prev: Dietary) => Dietary)) => void;
}

export default function D1NutritionRx({ dietary = {}, setDietary = () => {} }: D1NutritionRxProps) {
  const [activeTab, setActiveTab] = useState<string>("D11");

  // Formula library persisted in dietary prop
  const savedFormulas: string[] = (dietary as any).savedFormulas || [];

  // ── PATCH: use functional setter to merge only the changed key,
  //    preventing stale-closure overwrites of sibling keys in `dietary`.
  const handleAddFormula = (name: string) => {
    if (savedFormulas.includes(name)) return;
    setDietary((prev: Dietary) => ({ ...prev, savedFormulas: [...((prev as any).savedFormulas || []), name] } as any));
  };

  const handleDeleteFormula = (name: string) => {
    setDietary((prev: Dietary) => ({ ...prev, savedFormulas: ((prev as any).savedFormulas || []).filter((f: string) => f !== name) } as any));
  };

  // EN / PN lifted state — fully synced with dietary for autosave
  const enState: ENState = (dietary as any).enState || {
    feeds: [helper.makeENFeed(1)],
    savedFormulas: [],
    nextId: 2,
  };

  const pnState: PNState = (dietary as any).pnState || {
    bags: [helper.makePNFeed(1)],
    nextId: 2,
  };

  // ── PATCH: functional setters so concurrent updates don't clobber each other.
  const setEnState = (s: ENState) =>
    setDietary((prev: Dietary) => ({ ...prev, enState: s } as any));

  const setPnState = (s: PNState) =>
    setDietary((prev: Dietary) => ({ ...prev, pnState: s } as any));

  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", background: "#f4f7f6", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "8px 22px", border: "none", borderRadius: "7px", cursor: "pointer",
            fontWeight: 600, fontSize: "0.88rem", transition: "all 0.2s",
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
        <D12Enteral
          state={enState}
          setState={setEnState}
          savedFormulas={savedFormulas}
          onAddFormula={handleAddFormula}
          onDeleteFormula={handleDeleteFormula}
        />
      </div>
      <div style={{ display: activeTab === "D13" ? "block" : "none" }}>
        <D13Parenteral state={pnState} setState={setPnState} />
      </div>
    </div>
  );
}