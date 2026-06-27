// src/features/assessment/assess-dietary/D1NutritionRx.tsx
// Phase 5: Reads useDietaryStore and useAnthroStore directly. No props for domain state.

import React, { useState } from "react";
import * as helper from "./helper";
import * as constant from "./constant";
import { ENFeed, ENState, PNState } from "../../../shared/types/index";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { SelectInput as Sel } from "../../../shared/ui/SelectInput";
import { StatChip as NutrientChip } from "../../../shared/ui/StatChip";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import { useEnteralFormulaStore } from "../../../stores/useEnteralFormulaStore";
import type { EnteralFormula } from "../../../types/enteralFormula";
import type { Dietary, HospitalDiet } from "../../../types";
import { getAllDiets } from "../../../shared/api/db";
import DietaryD14IVOrders from "./DietaryD14IVOrders";
import PNPrescriptionMatrix from "./PNPrescriptionMatrix";

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
interface DietOrderPickerProps {
  value: string[];
  onChange: (val: string[]) => void;
}

function DietOrderPicker({ value, onChange }: DietOrderPickerProps) {
  const [diets, setDiets] = useState<HospitalDiet[]>([]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const dList = await getAllDiets();
        if (active) {
          setDiets(dList);
        }
      } catch (err) {
        console.error("Failed to load diet orders", err);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const selected = Array.isArray(value) ? value : (value ? [value as unknown as string] : []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = Array.from(e.target.selectedOptions).map(o => o.value);
    onChange(chosen);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <select
        multiple
        value={selected}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "4px 6px",
          border: "1px solid #cbd5e0",
          borderRadius: "4px",
          fontSize: "0.8rem",
          background: "#edf2f7",
          minHeight: "90px",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      >
        {diets.map((d) => (
          <option key={d.id} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div style={{ fontSize: "0.68rem", color: "#64748b", fontStyle: "italic" }}>
          {selected.length} diet{selected.length !== 1 ? "s" : ""} selected — Ctrl/Cmd+click to deselect
        </div>
      )}
    </div>
  );
}

interface D11OralProps { dietary: Dietary; setDietary: (d: Dietary) => void; }

function D11Oral({ dietary, setDietary }: D11OralProps) {
  const handleUpdate = (field: string, val: any) => setDietary({ ...dietary, [field]: val });
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div className="card" style={{ padding: "0.35rem 0.6rem" }}>
        <SectionHeader title="D11: Oral Diet & Intake" color="#3498db" />
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 0.85fr 0.85fr 0.85fr 0.85fr 0.85fr", gap: "0.35rem" }}>
          <div className="input-group">
            <label style={{ fontSize: "0.7rem", fontWeight: 700 }}>Current Rx Diet Order</label>
            <DietOrderPicker
              value={Array.isArray(dietary.dietOrder) ? dietary.dietOrder : (dietary.dietOrder ? [dietary.dietOrder as unknown as string] : [])}
              onChange={val => handleUpdate("dietOrder", val)}
            />
          </div>
          <Field label="Calories (kcal/day)" style={{ gap: "2px" }}><NumInput value={dietary.oralCalories || ""} onChange={v => handleUpdate("oralCalories", v)} placeholder="e.g. 1800" style={{ padding: "4px 6px", fontSize: "0.8rem" }} /></Field>
          <Field label="Protein (g/day)" style={{ gap: "2px" }}><NumInput value={dietary.oralProtein || ""} onChange={v => handleUpdate("oralProtein", v)} placeholder="e.g. 75" style={{ padding: "4px 6px", fontSize: "0.8rem" }} /></Field>
          <Field label="CHO (g/day)" style={{ gap: "2px" }} hint="optional">
            <NumInput value={dietary.oralCho || ""} onChange={v => handleUpdate("oralCho", v)} placeholder="e.g. 220" style={{ padding: "4px 6px", fontSize: "0.8rem" }} />
          </Field>
          <Field label="Fat (g/day)" style={{ gap: "2px" }} hint="optional">
            <NumInput value={dietary.oralFat || ""} onChange={v => handleUpdate("oralFat", v)} placeholder="e.g. 65" style={{ padding: "4px 6px", fontSize: "0.8rem" }} />
          </Field>
          <Field label="Water / Fluid (mL/day)" style={{ gap: "2px" }}><NumInput value={dietary.oralWater || ""} onChange={v => handleUpdate("oralWater", v)} placeholder="e.g. 1500" style={{ padding: "4px 6px", fontSize: "0.8rem" }} /></Field>
        </div>
      </div>
    </div>
  );
}

// ─── D12: Enteral Nutrition ───────────────────────────────────────────────────

// ─── ENFormulaSearch — wired to useEnteralFormulaStore ───────────────────────
// Provides live search over the formulary, shows macro chips on selection,
// and calls onSelect to push values into feed.
interface ENFormulaSearchProps {
  value: string;
  onSelect: (patch: {
    formula: string;
    calPerMl: string;
    protGPerL: string;
    fwPct: string;
    choGPerL: string;
    fatGPerL: string;
  }) => void;
}

function ENFormulaSearch({ value, onSelect }: ENFormulaSearchProps) {
  const { formulas, isLoading, loadFormulas } = useEnteralFormulaStore();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<EnteralFormula | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // Load formulary once
  React.useEffect(() => {
    if (formulas.length === 0 && !isLoading) loadFormulas();
  }, []);

  // Sync external value
  React.useEffect(() => {
    if (value !== query) setQuery(value);
  }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return formulas.slice(0, 8);
    return formulas
      .filter(f => f.name.toLowerCase().includes(q) || (f.manufacturer && f.manufacturer.toLowerCase().includes(q)))
      .slice(0, 10);
  }, [formulas, query]);

  const handleSelect = (f: EnteralFormula) => {
    setSelected(f);
    setQuery(f.name);
    setOpen(false);
    onSelect({
      formula:   f.name,
      calPerMl:  f.kcal_per_ml    !== null ? String(f.kcal_per_ml)    : "",
      protGPerL: f.protein_g_per_l !== null ? String(f.protein_g_per_l) : "",
      fwPct:     f.free_water_pct  !== null ? String(f.free_water_pct)  : "",
      choGPerL:  f.cho_g_per_l     !== null ? String(f.cho_g_per_l)     : "",
      fatGPerL:  f.fat_g_per_l     !== null ? String(f.fat_g_per_l)     : "",
    });
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    onSelect({ formula: "", calPerMl: "", protGPerL: "", fwPct: "", choGPerL: "", fatGPerL: "" });
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => setOpen(true)}
          placeholder="Search formulary or type name…"
          autoComplete="off"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "5px 28px 5px 8px",
            border: `1px solid ${selected ? "#27ae60" : "#e2e8f0"}`,
            borderRadius: "4px", fontSize: "0.85rem",
          }}
        />
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "#94a3b8", pointerEvents: "none" }}>
          {isLoading ? "⏳" : "🔍"}
        </span>
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 500,
          margin: 0, padding: "4px 0", listStyle: "none",
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.10)", maxHeight: 240, overflowY: "auto",
        }}>
          {filtered.map(f => (
            <li
              key={f.id}
              onMouseDown={e => { e.preventDefault(); handleSelect(f); }}
              style={{ padding: "6px 12px", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>{f.name}</div>
              <div style={{ display: "flex", gap: "5px", marginTop: "2px", flexWrap: "wrap" }}>
                {f.kcal_per_ml    !== null && <span style={nanoChipStyle}>{f.kcal_per_ml} kcal/mL</span>}
                {f.protein_g_per_l !== null && <span style={nanoChipStyle}>{f.protein_g_per_l} g prot/L</span>}
                {f.free_water_pct  !== null && <span style={nanoChipStyle}>{f.free_water_pct}% FW</span>}
                {f.manufacturer && <span style={{ ...nanoChipStyle, background: "#f8fafc", color: "#94a3b8" }}>{f.manufacturer}</span>}
              </div>
            </li>
          ))}
          {query.trim() && !filtered.some(f => f.name.toLowerCase() === query.toLowerCase()) && (
            <li
              onMouseDown={e => { e.preventDefault(); onSelect({ formula: query, calPerMl: "", protGPerL: "", fwPct: "", choGPerL: "", fatGPerL: "" }); setOpen(false); }}
              style={{ padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", borderTop: "1px solid #f1f5f9" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Use "{query}" as custom formula name
            </li>
          )}
        </ul>
      )}

      {/* Selected macro chips */}
      {selected && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#27ae60" }}>✓ {selected.name}</span>
          {selected.kcal_per_ml    !== null && <span style={macroChipStyle("#e67e22")}>{selected.kcal_per_ml} kcal/mL</span>}
          {selected.protein_g_per_l !== null && <span style={macroChipStyle("#8e44ad")}>{selected.protein_g_per_l}g prot/L</span>}
          {selected.free_water_pct  !== null && <span style={macroChipStyle("#27ae60")}>{selected.free_water_pct}% FW</span>}
          <button onClick={handleClear} style={{ marginLeft: "auto", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.75rem" }}>×</button>
        </div>
      )}
    </div>
  );
}

const nanoChipStyle: React.CSSProperties = {
  fontSize: "0.62rem", background: "#f1f5f9", color: "#64748b",
  borderRadius: "4px", padding: "1px 5px", border: "1px solid #e2e8f0",
};

const macroChipStyle = (color: string): React.CSSProperties => ({
  fontSize: "0.65rem", background: `${color}12`, color,
  borderRadius: "4px", padding: "1px 6px", border: `1px solid ${color}30`, fontWeight: 600,
});

interface ENFeedCardProps {
  feed: ENFeed;
  idx: number;
  onChange: (updated: ENFeed) => void;
  onRemove: () => void;
}

function ENFeedCard({ feed, idx, onChange, onRemove }: ENFeedCardProps) {
  const update = (field: keyof ENFeed, val: any) => onChange({ ...feed, [field]: val });
  const nutrients = helper.calcENNutrients(feed);
  const isExpanded = feed.expanded;
  const modulars: constant.ENModular[] = (feed as any).modulars || [];
  const nextModularId: number = (feed as any).nextModularId || 1;

  const updateModulars = (newModulars: constant.ENModular[], nextId: number) =>
    onChange({ ...feed, modulars: newModulars, nextModularId: nextId } as any);

  // ── Handle formula selection from search ─────────────────────────────────
  const handleFormulaSelect = (patch: { formula: string; calPerMl: string; protGPerL: string; fwPct: string; choGPerL: string; fatGPerL: string }) => {
    onChange({
      ...feed,
      formula:   patch.formula,
      calPerMl:  patch.calPerMl  !== "" ? patch.calPerMl  : feed.calPerMl,
      protGPerL: patch.protGPerL !== "" ? patch.protGPerL : feed.protGPerL,
      fwPct:     patch.fwPct     !== "" ? patch.fwPct     : feed.fwPct,
      choGPerL:  patch.choGPerL  !== "" ? patch.choGPerL  : (feed as any).choGPerL,
      fatGPerL:  patch.fatGPerL  !== "" ? patch.fatGPerL  : (feed as any).fatGPerL,
    } as ENFeed);
  };

  // ── Live auto-calculations ────────────────────────────────────────────────
  // Derive volume from rate inputs so chips update in real time.
  const calPerMlNum  = helper.num(feed.calPerMl);
  const protGPerLNum = helper.num(feed.protGPerL);
  const fwPctNum     = helper.num(feed.fwPct);
  const choGPerLNum  = helper.num((feed as any).choGPerL);
  const fatGPerLNum  = helper.num((feed as any).fatGPerL);

  const derivedVolMl: number = (() => {
    if (feed.type === "bolus") {
      const ml   = helper.num(feed.bolusMl);
      const times = helper.num(feed.bolusTimesPerDay);
      return ml > 0 && times > 0 ? ml * times : 0;
    }
    // continuous
    const rate = helper.num(feed.continuousRate);
    const hrs  = helper.num(feed.continuousHrs) || 24;
    return rate > 0 ? rate * hrs : 0;
  })();

  const derivedKcal    = derivedVolMl > 0 && calPerMlNum  > 0 ? Math.round(derivedVolMl * calPerMlNum)                      : 0;
  const derivedProtG   = derivedVolMl > 0 && protGPerLNum > 0 ? Math.round((derivedVolMl / 1000) * protGPerLNum * 10) / 10  : 0;
  const derivedChoG    = derivedVolMl > 0 && choGPerLNum  > 0 ? Math.round((derivedVolMl / 1000) * choGPerLNum  * 10) / 10  : 0;
  const derivedFatG    = derivedVolMl > 0 && fatGPerLNum  > 0 ? Math.round((derivedVolMl / 1000) * fatGPerLNum  * 10) / 10  : 0;
  const derivedFwMl    = derivedVolMl > 0 && fwPctNum     > 0 ? Math.round(derivedVolMl * (fwPctNum / 100))                 : 0;
  const flushTotalMl   = helper.num(feed.flushMl) * (helper.num(feed.flushTimesPerDay) || 1);

  // Use derived values when available, fall back to helper.calcENNutrients for edge cases
  const displayVol   = derivedVolMl  > 0 ? derivedVolMl  : nutrients.totalMl;
  const displayKcal  = derivedKcal   > 0 ? derivedKcal   : nutrients.totalCal;
  const displayProt  = derivedProtG  > 0 ? derivedProtG  : nutrients.totalProt;
  const displayCho   = derivedChoG;
  const displayFat   = derivedFatG;
  const displayFw    = derivedFwMl   > 0 ? derivedFwMl   : nutrients.totalFw;
  const displayFlush = flushTotalMl  > 0 ? flushTotalMl  : nutrients.flushMl;

  const modularKcal    = modulars.reduce((sum, m) => sum + helper.num(m.kcal), 0);
  const modularProtein = modulars.reduce((sum, m) => sum + helper.num(m.protein), 0);
  const totalCalWithMod  = displayKcal + Math.round(modularKcal);
  const totalProtWithMod = Math.round((displayProt + modularProtein) * 10) / 10;

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
          {/* Row 1: Route, Type, Formula, Delivery params — all on one row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr auto 1.6fr 1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.65rem", alignItems: "end" }}>
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
                    fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Formula">
              <ENFormulaSearch value={feed.formula} onSelect={handleFormulaSelect} />
            </Field>

            {feed.type === "bolus" ? (
              <>
                <Field label="mL/bolus"><NumInput value={feed.bolusMl} onChange={v => update("bolusMl", v)} /></Field>
                <Field label="Times/day"><NumInput value={feed.bolusTimesPerDay} onChange={v => update("bolusTimesPerDay", v)} /></Field>
                <Field label="Every (hrs)"><NumInput value={feed.bolusEveryHrs} onChange={v => update("bolusEveryHrs", v)} /></Field>
              </>
            ) : (
              <>
                <Field label="Rate (mL/hr)"><NumInput value={feed.continuousRate} onChange={v => update("continuousRate", v)} /></Field>
                <Field label="Hrs/day"><NumInput value={feed.continuousHrs} onChange={v => update("continuousHrs", v)} /></Field>
                <div />
              </>
            )}
          </div>

          {/* Row 3: Nutrition params + flushes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <Field label="Cal/mL" hint="e.g. 1.5"><NumInput value={feed.calPerMl} onChange={v => update("calPerMl", v)} placeholder="1.0" /></Field>
            <Field label="Prot g/L"><NumInput value={feed.protGPerL} onChange={v => update("protGPerL", v)} placeholder="44" /></Field>
            <Field label="CHO g/L"><NumInput value={(feed as any).choGPerL ?? ""} onChange={v => update("choGPerL" as any, v)} placeholder="140" /></Field>
            <Field label="Fat g/L"><NumInput value={(feed as any).fatGPerL ?? ""} onChange={v => update("fatGPerL" as any, v)} placeholder="35" /></Field>
            <Field label="Free H₂O %"><NumInput value={feed.fwPct} onChange={v => update("fwPct", v)} placeholder="85" /></Field>
            <Field label="Flush mL"><NumInput value={feed.flushMl} onChange={v => update("flushMl", v)} /></Field>
            <Field label="Flush ×/day"><NumInput value={feed.flushTimesPerDay} onChange={v => update("flushTimesPerDay", v)} /></Field>
            <Field label="Flush every (h)"><NumInput value={feed.flushEveryHrs} onChange={v => update("flushEveryHrs", v)} /></Field>
          </div>

          {/* Live auto-calc hint — only shown when volume can be derived */}
          {derivedVolMl > 0 && (
            <div style={{ fontSize: "0.68rem", color: "#64748b", fontStyle: "italic", marginBottom: "0.4rem", background: "#f8fafc", borderRadius: "4px", padding: "3px 8px", border: "1px solid #e2e8f0" }}>
              Auto-calculated from {feed.type === "bolus" ? `${helper.num(feed.bolusMl)} mL × ${helper.num(feed.bolusTimesPerDay)} boluses` : `${helper.num(feed.continuousRate)} mL/hr × ${helper.num(feed.continuousHrs) || 24} hrs`}
            </div>
          )}

          {/* Modulars */}
          <ENModularPanel modulars={modulars} nextModularId={nextModularId} onUpdate={updateModulars} />

          {/* Totals strip */}
          {(() => {
            const labelStyle: React.CSSProperties = {
              fontSize: "0.62rem",
              color: "#718096",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "2px",
            };
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px dashed #e2e8f0",
                  marginTop: "0.5rem",
                  fontSize: "0.72rem",
                  width: "100%",
                }}
              >
                <div style={{ fontWeight: 700, color: "#27ae60", marginRight: "0.25rem" }}>Feed Totals:</div>
                
                <div style={{ flex: 1, minWidth: "75px" }}>
                  <div style={labelStyle}>Volume</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3498db" }}>
                    {Math.round(displayVol)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "90px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Calories</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e67e22" }}>
                    {totalCalWithMod > 0 ? (modularKcal > 0 ? `${totalCalWithMod} (+${Math.round(modularKcal)})` : totalCalWithMod) : displayKcal}{" "}
                    <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>kcal/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "80px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Protein</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8e44ad" }}>
                    {totalProtWithMod > 0 ? (modularProtein > 0 ? `${totalProtWithMod} (+${modularProtein})` : totalProtWithMod) : displayProt}{" "}
                    <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "70px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>CHO</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#d69e2e" }}>
                    {Math.round(displayCho * 10) / 10} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "70px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Fat</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c05621" }}>
                    {Math.round(displayFat * 10) / 10} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "85px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Free H₂O</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#27ae60" }}>
                    {Math.round(displayFw)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "85px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Flush H₂O</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0891b2" }}>
                    {Math.round(displayFlush)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
                  </div>
                </div>
              </div>
            );
          })()}

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
}

function D12Enteral({ state, setState }: D12EnteralProps) {
  const addFeed    = () => setState({ ...state, feeds: [...state.feeds, helper.makeENFeed(state.nextId)], nextId: state.nextId + 1 });
  const updateFeed = (id: number, updated: ENFeed) => setState({ ...state, feeds: state.feeds.map(f => f.id === id ? updated : f) });
  const removeFeed = (id: number) => setState({ ...state, feeds: state.feeds.filter(f => f.id !== id) });

  const totals = state.feeds.reduce((acc, f) => {
    const n = helper.calcENNutrients(f);
    const calPerMlNum = helper.num(f.calPerMl);
    const choGPerLNum = helper.num((f as any).choGPerL);
    const fatGPerLNum = helper.num((f as any).fatGPerL);
    const fwPctNum    = helper.num(f.fwPct);
    const vol = f.type === "bolus"
      ? helper.num(f.bolusMl) * helper.num(f.bolusTimesPerDay)
      : helper.num(f.continuousRate) * (helper.num(f.continuousHrs) || 24);
    const cho = vol > 0 && choGPerLNum > 0 ? (vol / 1000) * choGPerLNum : 0;
    const fat = vol > 0 && fatGPerLNum > 0 ? (vol / 1000) * fatGPerLNum : 0;
    const fw  = vol > 0 && fwPctNum > 0 ? vol * (fwPctNum / 100) : n.totalFw;
    const mods: constant.ENModular[] = (f as any).modulars || [];
    const modKcal = mods.reduce((s, m) => s + helper.num(m.kcal), 0);
    const modProt = mods.reduce((s, m) => s + helper.num(m.protein), 0);
    return {
      vol: acc.vol + (vol > 0 ? vol : n.totalMl),
      cal: acc.cal + (vol > 0 && calPerMlNum > 0 ? vol * calPerMlNum : n.totalCal) + modKcal,
      prot: acc.prot + n.totalProt + modProt,
      cho: acc.cho + cho,
      fat: acc.fat + fat,
      fw: acc.fw + fw,
      flush: acc.flush + (helper.num(f.flushMl) * (helper.num(f.flushTimesPerDay) || 1)),
    };
  }, { vol: 0, cal: 0, prot: 0, cho: 0, fat: 0, fw: 0, flush: 0 });

  return (
    <div className="card" style={{ marginBottom: "0.5rem", padding: "0.4rem 0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <SectionHeader title="D12: Enteral Nutrition (EN)" subtitle="Add one entry per formula or delivery method" color="#27ae60" />
        <button onClick={addFeed} style={{ background: "#27ae60", color: "#fff", border: "none", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Add Feed
        </button>
      </div>

      {state.feeds.map((feed, idx) => (
        <ENFeedCard key={feed.id} feed={feed} idx={idx} onChange={updated => updateFeed(feed.id, updated)} onRemove={() => removeFeed(feed.id)} />
      ))}

      {state.feeds.length > 1 && (
        <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "6px", padding: "0.5rem 0.75rem", marginTop: "0.5rem" }}>
          {(() => {
            const labelStyle: React.CSSProperties = {
              fontSize: "0.62rem",
              color: "#718096",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "2px",
            };
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  fontSize: "0.72rem",
                  width: "100%",
                }}
              >
                <div style={{ fontWeight: 700, color: "#276749", minWidth: "120px" }}>Total EN (All Feeds + Modulars)</div>
                
                <div style={{ flex: 1, minWidth: "75px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Volume</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#27ae60" }}>
                    {Math.round(totals.vol)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "90px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Calories</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e67e22" }}>
                    {Math.round(totals.cal)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>kcal/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "80px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Protein</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8e44ad" }}>
                    {Math.round(totals.prot * 10) / 10} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "70px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>CHO</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#d69e2e" }}>
                    {Math.round(totals.cho * 10) / 10} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "70px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Fat</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c05621" }}>
                    {Math.round(totals.fat * 10) / 10} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "85px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Free Water</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3498db" }}>
                    {Math.round(totals.fw)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "85px", borderLeft: "1px solid #9ae6b4", paddingLeft: "0.5rem" }}>
                  <div style={labelStyle}>Flush</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0891b2" }}>
                    {Math.round(totals.flush)} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Tab Navigation & Root ────────────────────────────────────────────────────

const SECTIONS = [
  { id: "D11", label: "D11 – Oral",       color: "#3498db" },
  { id: "D12", label: "D12 – Enteral",    color: "#27ae60" },
  { id: "D13", label: "D13 – Parenteral", color: "#8e44ad" },
  { id: "D14", label: "D14 – IV Orders",  color: "#0891b2" },
];

// ─── D15: Read-Only Totals Summary (compact) ─────────────────────────────────
// Drop-in replacement for the D15TotalsSummary function inside D1NutritionRx.tsx
// Replaces the two-row layout with a single dense strip.

interface D15Props {
  dietary: import("../../../types").Dietary;
  enState: ENState;
  pnState: PNState;
}

function D15TotalsSummary({ dietary, enState, pnState }: D15Props) {
  const {
    totalKcal,
    totalProt,
    totalFat,
    totalCho,
    totalFluid,
    enFreeWater,
    enFlush,
    pnFreeWater,
    ivKcal,
    ivFat,
  } = helper.calculateDietaryTotals({
    ...dietary,
    enState,
    pnState,
  } as any);

  const oralFluidMl = helper.num(dietary.oralWater);

  const cell = (label: string, value: string | number, unit: string, color: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: "3px", whiteSpace: "nowrap" }}>
      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.9rem", fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{unit}</span>
    </div>
  );

  const dot = <span style={{ color: "#cbd5e1", fontSize: "0.7rem", flexShrink: 0 }}>•</span>;

  const fluidParts = [
    oralFluidMl > 0   && `Oral ${Math.round(oralFluidMl)} mL`,
    enFreeWater > 0   && `EN free ${Math.round(enFreeWater)} mL`,
    enFlush > 0       && `flush ${Math.round(enFlush)} mL`,
    pnFreeWater > 0   && `PN free ${Math.round(pnFreeWater)} mL`,
  ].filter(Boolean).join("  ·  ");

  return (
    <div
      className="card"
      style={{
        marginTop: "0.75rem",
        padding: "6px 12px",
        borderTop: "2px solid #2c3e50",
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0", flexWrap: "wrap" }}>

        {/* Label */}
        <span style={{
          fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "#475569", marginRight: "14px", whiteSpace: "nowrap",
        }}>
          D15
        </span>

        {/* Macros + fluids inline */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 }}>

          {cell(
            "Energy",
            Math.round(totalKcal),
            ivKcal > 0 ? `kcal  (+${Math.round(ivKcal)} IV)` : "kcal",
            "#e67e22"
          )}
          {dot}
          {cell("Protein", Math.round(totalProt * 10) / 10, "g", "#8e44ad")}
          {dot}
          {cell("CHO", Math.round(totalCho * 10) / 10, "g", "#d69e2e")}
          {dot}
          {cell(
            "Fat",
            Math.round(totalFat * 10) / 10,
            ivFat > 0 ? `g  (+${Math.round(ivFat * 10) / 10}g IV)` : "g",
            "#c05621"
          )}
          {dot}
          {cell("Fluids", Math.round(totalFluid), "mL", "#1e40af")}

          {/* Fluid breakdown — only shown when there's something to break down */}
          {fluidParts && (
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", marginLeft: "4px" }}>
              ({fluidParts})
            </span>
          )}
        </div>

        {/* READ ONLY badge — pushed right */}
        <span style={{
          fontSize: "0.55rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.06em", padding: "2px 7px", borderRadius: "4px",
          background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0",
          marginLeft: "10px", flexShrink: 0,
        }}>
          Read only
        </span>

      </div>
    </div>
  );
}

export default function D1NutritionRx() {
  const { dietary, setDietary } = useDietaryStore();
  const { ageDays, wtKg: patientWtKg, dryWtKg } = useCalculatedMetrics();

  // Multi-select: track which sections are active
  const [activeSections, setActiveSections] = useState<string[]>(["D11"]);

  const enState: ENState = (dietary as any).enState || { feeds: [helper.makeENFeed(1)], savedFormulas: [], nextId: 2 };
  const pnState: PNState = (dietary as any).pnState || { bags: [helper.makePNFeed(1)], nextId: 2 };

  const setEnState = (s: ENState) => setDietary({ enState: s } as any);
  const setPnState = (s: PNState) => setDietary({ pnState: s } as any);

  const toggleSection = (id: string) => {
    setActiveSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1rem" }}>
        {SECTIONS.map(sec => {
          const isActive = activeSections.includes(sec.id);
          return (
            <div
              key={sec.id}
              onClick={() => toggleSection(sec.id)}
              style={{
                padding: "5px 16px",
                borderRadius: "20px",
                border: `2px solid ${sec.color}`,
                background: isActive ? sec.color : "transparent",
                color: isActive ? "#fff" : sec.color,
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.2s",
                userSelect: "none",
              }}
            >
              {isActive ? "✓ " : ""}{sec.label}
            </div>
          );
        })}
        {activeSections.length === 0 && (
          <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic", alignSelf: "center" }}>
            Select one or more sections above to document nutrition delivery.
          </span>
        )}
      </div>

      {activeSections.includes("D11") && (
        <D11Oral dietary={dietary} setDietary={setDietary as (d: Dietary) => void} />
      )}
      {activeSections.includes("D12") && (
        <D12Enteral state={enState} setState={setEnState} />
      )}
      {activeSections.includes("D13") && (
        <PNPrescriptionMatrix state={pnState} setState={setPnState} patientWtKg={patientWtKg} girWtKg={dryWtKg} ageDays={ageDays} />
      )}
      {activeSections.includes("D14") && (
        <DietaryD14IVOrders />
      )}

      {/* ── D15: Total Daily Intake — Read-Only Summation ── */}
      <D15TotalsSummary
        dietary={dietary}
        enState={enState}
        pnState={pnState}
      />
    </div>
  );
}
