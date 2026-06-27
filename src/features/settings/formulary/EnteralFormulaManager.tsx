// src/features/settings/formulary/EnteralFormulaManager.tsx
// Full CRUD UI for the hospital enteral formulary.
// Mounted as a tab inside SettingsPage.

import React, { useEffect, useState } from "react";
import { useEnteralFormulaStore } from "../../../stores/useEnteralFormulaStore";
import type { EnteralFormula, EnteralFormulaInput, EnteralPopulation } from "../../../types/enteralFormula";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUTE_OPTIONS: { value: EnteralPopulation; label: string }[] = [
  { value: "",              label: "Not specified" },
  { value: "infant",       label: "Infant" },
  { value: "children",     label: "Children" },
  { value: "adult",        label: "Adult" },
];

const ROUTE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  "infant":       { bg: "#e6f4ff", color: "#1a6fa8", label: "Infant" },
  "children":{ bg: "#f0fdf4", color: "#166534", label: "Children" },
  "adult":          { bg: "#fef9c3", color: "#854d0e", label: "Adult" },
  "":            { bg: "#f1f5f9", color: "#64748b", label: "—" },
};

const EMPTY_INPUT: EnteralFormulaInput = {
  name: "", manufacturer: "",
  kcal_per_ml: null, protein_g_per_l: null, fat_g_per_l: null, cho_g_per_l: null,
  fiber_total_g_per_l: null, fiber_soluble_g_per_l: null, fiber_insoluble_g_per_l: null,
  free_water_pct: null, osmolality: null,
  na_mg_per_l: null, k_mg_per_l: null, phos_mg_per_l: null, mg_mg_per_l: null,
  route: "", notes: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numStr(v: number | null): string {
  return v === null || v === undefined ? "" : String(v);
}

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function fmtNum(v: number | null, decimals = 1): string {
  if (v === null) return "—";
  return v % 1 === 0 ? String(v) : v.toFixed(decimals);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RouteBadge({ route }: { route: EnteralPopulation }) {
  const { bg, color, label } = ROUTE_BADGE[route] ?? ROUTE_BADGE[""];
  return (
    <span style={{
      background: bg, color, borderRadius: 10, padding: "1px 8px",
      fontSize: "0.68rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

interface NutriFieldProps {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  width?: string;
}

function NutriField({ label, unit, value, onChange, width = "100%" }: NutriFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width }}>
      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({unit})</span>
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step="0.1"
        style={{
          padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 4,
          fontSize: "0.83rem", width: "100%", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ─── Formula form (create + edit) ─────────────────────────────────────────────

interface FormulaFormProps {
  initial: EnteralFormulaInput;
  onSave: (input: EnteralFormulaInput) => void;
  onCancel: () => void;
  isSaving: boolean;
  mode: "create" | "edit";
}

function FormulaForm({ initial, onSave, onCancel, isSaving, mode }: FormulaFormProps) {
  const [form, setForm] = useState<EnteralFormulaInput>(initial);

  function field(key: keyof EnteralFormulaInput) {
    return {
      value: numStr(form[key] as number | null),
      onChange: (v: string) => setForm(prev => ({ ...prev, [key]: parseNum(v) })),
    };
  }

  const isValid = form.name.trim().length > 0;

  return (
    <div style={{
      border: "1px solid #e2e8f0", borderRadius: 10, padding: "1.25rem",
      background: mode === "create" ? "#f8faff" : "#fffdf5",
      marginBottom: "1rem",
    }}>
      <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1e293b",
        marginBottom: "1rem", borderLeft: "3px solid #3498db", paddingLeft: 8 }}>
        {mode === "create" ? "➕ Add New Formula" : "✏️ Edit Formula"}
      </div>

      {/* Name + Manufacturer */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={labelStyle}>Formula Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Osmolite 1.5"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={labelStyle}>Manufacturer</label>
          <input
            type="text"
            value={form.manufacturer}
            onChange={e => setForm(prev => ({ ...prev, manufacturer: e.target.value }))}
            placeholder="e.g. Abbott"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Core macros */}
      <div style={sectionLabel}>Core Macronutrients</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <NutriField label="kcal" unit="kcal/mL" {...field("kcal_per_ml")} />
        <NutriField label="Protein" unit="g/L" {...field("protein_g_per_l")} />
        <NutriField label="Fat" unit="g/L" {...field("fat_g_per_l")} />
        <NutriField label="CHO" unit="g/L" {...field("cho_g_per_l")} />
      </div>

      {/* Fiber */}
      <div style={sectionLabel}>Fiber</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <NutriField label="Total Fiber" unit="g/L" {...field("fiber_total_g_per_l")} />
        <NutriField label="Soluble" unit="g/L" {...field("fiber_soluble_g_per_l")} />
        <NutriField label="Insoluble" unit="g/L" {...field("fiber_insoluble_g_per_l")} />
      </div>

      {/* Fluid & osmolality */}
      <div style={sectionLabel}>Fluid & Osmolality</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <NutriField label="Free Water" unit="%" {...field("free_water_pct")} />
        <NutriField label="Osmolality" unit="mOsm/kg" {...field("osmolality")} />
      </div>

      {/* Electrolytes */}
      <div style={sectionLabel}>Electrolytes per 1000 mL</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <NutriField label="Sodium" unit="mg" {...field("na_mg_per_l")} />
        <NutriField label="Potassium" unit="mg" {...field("k_mg_per_l")} />
        <NutriField label="Phosphorus" unit="mg" {...field("phos_mg_per_l")} />
        <NutriField label="Magnesium" unit="mg" {...field("mg_mg_per_l")} />
      </div>

      {/* Route & notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.6rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={labelStyle}>Route (optional)</label>
          <select
            value={form.route}
            onChange={e => setForm(prev => ({ ...prev, route: e.target.value as EnteralPopulation }))}
            style={inputStyle}
          >
            {ROUTE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={labelStyle}>Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g. Use for malabsorption, peptide-based"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnOutline} disabled={isSaving}>
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!isValid || isSaving}
          style={{ ...btnPrimary, opacity: !isValid || isSaving ? 0.6 : 1 }}
        >
          {isSaving ? "Saving…" : mode === "create" ? "Save Formula" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Formula row (read mode) ──────────────────────────────────────────────────

interface FormulaRowProps {
  formula: EnteralFormula;
  onEdit: () => void;
  onDelete: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function FormulaRow({ formula: f, onEdit, onDelete, isExpanded, onToggle }: FormulaRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden",
      marginBottom: "0.5rem",
      background: f.is_seeded ? "#fafcff" : "#fff",
    }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.65rem 1rem", cursor: "pointer",
          background: isExpanded ? "#f0f7ff" : "transparent",
          borderBottom: isExpanded ? "1px solid #dbeafe" : "none",
        }}
      >
        {/* Name + seeded badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>
              {f.name}
            </span>
            {f.is_seeded && (
              <span style={{
                fontSize: "0.6rem", fontWeight: 700, color: "#64748b",
                background: "#f1f5f9", border: "1px solid #cbd5e1",
                borderRadius: 6, padding: "1px 5px",
              }}>
                SEEDED
              </span>
            )}
          </div>
          {f.manufacturer && (
            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{f.manufacturer}</div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <QuickStat label="kcal/mL" value={fmtNum(f.kcal_per_ml)} />
          <QuickStat label="Prot g/L" value={fmtNum(f.protein_g_per_l, 0)} />
          <QuickStat label="Free H₂O" value={f.free_water_pct !== null ? `${f.free_water_pct}%` : "—"} />
        </div>

        <RouteBadge route={f.route} />

        {/* Chevron */}
        <span style={{ fontSize: "0.7rem", color: "#94a3b8", flexShrink: 0 }}>
          {isExpanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ padding: "0.85rem 1rem" }}>
          {/* Nutrient grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem 1.5rem", marginBottom: "0.75rem" }}>
            <DetailCell label="kcal/mL" value={fmtNum(f.kcal_per_ml)} />
            <DetailCell label="Protein (g/L)" value={fmtNum(f.protein_g_per_l)} />
            <DetailCell label="Fat (g/L)" value={fmtNum(f.fat_g_per_l)} />
            <DetailCell label="CHO (g/L)" value={fmtNum(f.cho_g_per_l)} />
            <DetailCell label="Total Fiber (g/L)" value={fmtNum(f.fiber_total_g_per_l)} />
            <DetailCell label="Soluble Fiber (g/L)" value={fmtNum(f.fiber_soluble_g_per_l)} />
            <DetailCell label="Insoluble Fiber (g/L)" value={fmtNum(f.fiber_insoluble_g_per_l)} />
            <DetailCell label="Free Water (%)" value={fmtNum(f.free_water_pct)} />
            <DetailCell label="Osmolality (mOsm/kg)" value={fmtNum(f.osmolality, 0)} />
            <DetailCell label="Sodium (mg/L)" value={fmtNum(f.na_mg_per_l, 0)} />
            <DetailCell label="Potassium (mg/L)" value={fmtNum(f.k_mg_per_l, 0)} />
            <DetailCell label="Phosphorus (mg/L)" value={fmtNum(f.phos_mg_per_l, 0)} />
            <DetailCell label="Magnesium (mg/L)" value={fmtNum(f.mg_mg_per_l, 0)} />
          </div>

          {f.notes && (
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.75rem",
              background: "#f8fafc", borderRadius: 4, padding: "5px 8px" }}>
              📝 {f.notes}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            {!confirmDelete ? (
              <>
                <button onClick={onEdit} style={btnOutline}>Edit</button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ ...btnOutline, color: "#e74c3c", borderColor: "#e74c3c" }}
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: "0.78rem", color: "#e74c3c", alignSelf: "center", marginRight: 4 }}>
                  Permanently delete "{f.name}"?
                </span>
                <button onClick={() => setConfirmDelete(false)} style={btnOutline}>Cancel</button>
                <button onClick={() => { setConfirmDelete(false); onDelete(); }}
                  style={{ ...btnPrimary, background: "#e74c3c" }}>
                  Yes, Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2c3e50" }}>{value}</div>
      <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{label}</div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.62rem", color: "#94a3b8", textTransform: "uppercase",
        letterSpacing: "0.04em", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: value === "—" ? "#cbd5e1" : "#1e293b" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EnteralFormulaManager() {
  const { formulas, isLoading, error, loadFormulas, addFormula, updateFormula, deleteFormula } =
    useEnteralFormulaStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState<EnteralPopulation | "all">("all");
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFormulas();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleCreate(input: EnteralFormulaInput) {
    setIsSaving(true);
    const result = await addFormula(input);
    setIsSaving(false);
    if (result) {
      setShowCreate(false);
      setExpandedId(result.id);
      showToast(`"${result.name}" added to formulary ✓`);
    }
  }

  async function handleUpdate(id: string, input: EnteralFormulaInput) {
    setIsSaving(true);
    const ok = await updateFormula(id, input);
    setIsSaving(false);
    if (ok) {
      setEditingId(null);
      showToast("Formula updated ✓");
    }
  }

  async function handleDelete(id: string, name: string) {
    await deleteFormula(id);
    if (expandedId === id) setExpandedId(null);
    showToast(`"${name}" removed`);
  }

  // Filtered list
  const filtered = formulas.filter(f => {
    const matchSearch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.manufacturer.toLowerCase().includes(search.toLowerCase());
    const matchRoute = routeFilter === "all" || f.route === routeFilter;
    return matchSearch && matchRoute;
  });

  const seededCount  = formulas.filter(f => f.is_seeded).length;
  const customCount  = formulas.filter(f => !f.is_seeded).length;

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: 2 }}>
            {seededCount} seeded defaults · {customCount} custom formulas
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search formulas…"
              style={{
                padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 20,
                fontSize: "0.82rem", width: 200,
              }}
            />
            <select
              value={routeFilter}
              onChange={e => setRouteFilter(e.target.value as EnteralPopulation | "all")}
              style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.82rem" }}
            >
              <option value="all">All populations</option>
              {ROUTE_OPTIONS.filter(o => o.value !== "").map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); }}
            style={btnPrimary}
          >
            ＋ Add Formula
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fdf2f8", border: "1px solid #e74c3c", color: "#9d174d",
          padding: "0.5rem 0.75rem", borderRadius: 6, fontSize: "0.82rem", marginBottom: "0.75rem" }}>
          ⚠ {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <FormulaForm
          initial={EMPTY_INPUT}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          isSaving={isSaving}
          mode="create"
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem", fontSize: "0.85rem" }}>
          Loading formulary…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && formulas.length === 0 && (
        <div style={{
          textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 10,
          padding: "2.5rem 1rem", color: "#94a3b8",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🥤</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No formulas in your formulary yet.</div>
          <div style={{ fontSize: "0.82rem" }}>
            Add your hospital's EN formulas above. The database will persist across all notes.
          </div>
        </div>
      )}

      {/* No results */}
      {!isLoading && formulas.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem", fontSize: "0.85rem" }}>
          No formulas match your search.
        </div>
      )}

      {/* Formula list */}
      {filtered.map(f => (
        editingId === f.id ? (
          <FormulaForm
            key={f.id}
            initial={f}
            onSave={input => handleUpdate(f.id, input)}
            onCancel={() => setEditingId(null)}
            isSaving={isSaving}
            mode="edit"
          />
        ) : (
          <FormulaRow
            key={f.id}
            formula={f}
            isExpanded={expandedId === f.id}
            onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)}
            onEdit={() => { setEditingId(f.id); setExpandedId(null); setShowCreate(false); }}
            onDelete={() => handleDelete(f.id, f.name)}
          />
        )
      ))}

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: "1.5rem", left: "50%",
        transform: `translateX(-50%) translateY(${toast ? "0" : "80px"})`,
        background: "#1e293b", color: "#fff", padding: "0.5rem 1.25rem",
        borderRadius: 30, fontSize: "0.85rem", fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)", transition: "all 0.3s ease",
        zIndex: 2000, opacity: toast ? 1 : 0, pointerEvents: "none",
      }}>
        {toast}
      </div>
    </div>
  );
}

// ─── Shared style tokens ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 4,
  fontSize: "0.85rem", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.06em",
  marginBottom: "0.35rem", marginTop: "0.1rem",
};

const btnPrimary: React.CSSProperties = {
  background: "#3498db", color: "#fff", border: "none", padding: "6px 16px",
  borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  background: "transparent", color: "#3498db", border: "1px solid #3498db",
  padding: "5px 14px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
};