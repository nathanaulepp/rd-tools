// src/features/drugs/DrugLookupTool.tsx
// ─────────────────────────────────────────────────────────────────────────────
// RxNorm Semantic Clinical Drug (SCD) structured medication selector.
//
// ARCHITECTURE:
//   - Autocomplete searches local SQLite (rxnorm_products) for speed.
//   - Selection auto-populates: displayName, ingredient, strength, doseForm.
//   - User only edits: doseAmount, doseUnit, route, frequency, notes.
//
// STORED JSON (MedicationOrder[]):
//   [{ product: { rxcui, displayName, ingredient, strengthValue, strengthUnit, doseForm },
//      doseAmount, doseUnit, route, frequency, notes }]
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type Database from "@tauri-apps/plugin-sql";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Represents an RxNorm Semantic Clinical Drug product (TTY = SCD). */
export interface MedicationProduct {
  rxcui: string;
  displayName: string;
  ingredient: string;
  strengthValue: number | null;
  strengthUnit: string;
  doseForm: string;
  tty: "SCD";
}

/** Represents a clinician's prescription for a product. */
export interface MedicationOrder {
  product: MedicationProduct;
  doseAmount: string;
  doseUnit: string;
  route: string;
  frequency: string;
  notes: string;
}

interface DrugLookupToolProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  multiEntry?: boolean;
  showDoseFields?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DB_NAME = "sqlite:drugs.db";

const ROUTES = [
  "PO", "IV", "SQ", "IM", "SL", "Inhaled",
  "Topical", "Transdermal", "Rectal", "Nasogastric", "Other",
];

const FREQUENCIES = [
  "Once daily (QD)",
  "Twice daily (BID)",
  "Three times daily (TID)",
  "Four times daily (QID)",
  "Every 4h",
  "Every 6h (Q6H)",
  "Every 8h (Q8H)",
  "Every 12h (Q12H)",
  "Weekly",
  "Twice weekly",
  "Monthly",
  "As needed (PRN)",
  "Other",
];

const DOSE_UNITS = [
  "tablet(s)", "capsule(s)", "mL", "mg", "mcg",
  "g", "unit(s)", "IU", "patch(es)", "puff(s)", "drop(s)",
];

// ── Local Database Helper ─────────────────────────────────────────────────────

async function searchProductsLocal(
  db: Database,
  query: string,
  limit = 50
): Promise<MedicationProduct[]> {
  if (query.trim().length < 2) return [];
  const pattern      = `%${query}%`;
  const startPattern = `${query}%`;
  const rows = await db.select<any[]>(
    `SELECT rxcui, display_name, ingredient, strength_value,
            strength_unit, dose_form, tty
     FROM rxnorm_products
     WHERE display_name LIKE ?
     ORDER BY
       CASE WHEN display_name LIKE ? THEN 0 ELSE 1 END,
       LENGTH(display_name),
       display_name
     LIMIT ?`,
    [pattern, startPattern, limit]
  );

  return rows.map(r => ({
    rxcui:         r.rxcui,
    displayName:   r.display_name,
    ingredient:    r.ingredient ?? "",
    strengthValue: r.strength_value ?? null,
    strengthUnit:  r.strength_unit ?? "",
    doseForm:      r.dose_form ?? "",
    tty:           "SCD" as const,
  }));
}

// ── In-memory Fallback (browser / dev) ────────────────────────────────────────

const DEV_INGREDIENTS = [
  "acetaminophen", "ibuprofen", "aspirin", "amoxicillin", "metformin",
  "lisinopril", "atorvastatin", "metoprolol", "omeprazole", "amlodipine",
  "losartan", "hydrochlorothiazide", "furosemide", "gabapentin", "sertraline",
  "escitalopram", "fluoxetine", "tramadol", "hydrocodone", "oxycodone"
];

let _devProductsCache: MedicationProduct[] | null = null;

async function getDevProducts(): Promise<MedicationProduct[]> {
  if (_devProductsCache) return _devProductsCache;
  try {
    const promises = DEV_INGREDIENTS.map(async (ing) => {
      const res = await fetch(
        `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(ing)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) return [];
      const json = await res.json();
      const groups = json?.drugGroup?.conceptGroup ?? [];
      const products: MedicationProduct[] = [];
      for (const g of groups) {
        if (g.tty !== "SCD") continue;
        for (const c of (g.conceptProperties ?? [])) {
          if (!c.rxcui || !c.name) continue;
          
          // Simple parsing for dev fallback
          const name = c.name;
          const strengthMatch = name.match(/(\d+(?:\.\d+)?)\s*(MG|MCG|MEQ|MMOL|IU|ML|%)/i);
          const strengthValue = strengthMatch ? parseFloat(strengthMatch[1]) : null;
          const strengthUnit  = strengthMatch ? strengthMatch[2].toUpperCase() : "";
          const ingredient = strengthMatch ? name.slice(0, name.indexOf(strengthMatch[0])).trim() : name;
          const doseFormMatch = name.match(/\b(Tablet|Capsule|Solution|Suspension|Injection|Patch|Cream|Ointment|Powder|Suppository|Inhaler|Spray|Drops?|Gel|Lotion|Syrup)\b/i);
          const doseForm = doseFormMatch ? doseFormMatch[1] : "";

          products.push({
            rxcui: c.rxcui,
            displayName: name,
            ingredient,
            strengthValue,
            strengthUnit,
            doseForm,
            tty: "SCD",
          });
        }
      }
      return products;
    });
    const results = await Promise.allSettled(promises);
    _devProductsCache = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  } catch {
    _devProductsCache = [];
  }
  return _devProductsCache!;
}

// ── Search Hook ───────────────────────────────────────────────────────────────

function useProductSearch(query: string) {
  const [results, setResults] = useState<MedicationProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  const [synced, setSynced] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const dbRef = useRef<Database | null>(null);

  // Detect environment on mount and check DB
  useEffect(() => {
    let active = true;
    const init = async () => {
      let isTauriEnv = false;
      try {
        const { default: DatabaseImpl } = await import("@tauri-apps/plugin-sql");
        isTauriEnv = true;
        if (!active) return;
        setIsTauri(true);

        const db = await DatabaseImpl.load(DB_NAME);
        if (!active) return;
        dbRef.current = db;

        // Ensure schema is setup
        await db.execute(`
          CREATE TABLE IF NOT EXISTS rxnorm_products (
            rxcui          TEXT PRIMARY KEY,
            display_name   TEXT NOT NULL,
            ingredient     TEXT,
            strength_value REAL,
            strength_unit  TEXT,
            dose_form      TEXT,
            tty            TEXT NOT NULL DEFAULT 'SCD'
          )
        `);

        const rows = await db.select<Array<{ cnt: number }>>(
          "SELECT COUNT(*) as cnt FROM rxnorm_products"
        );
        const count = rows[0]?.cnt ?? 0;
        if (!active) return;

        if (count === 0) {
          setSyncMsg("Medication search is unavailable; manual entry is still available");
        } else {
          setSyncMsg(null);
        }
        setSynced(true);
      } catch (e) {
        if (!isTauriEnv) {
          if (!active) return;
          setIsTauri(false);
          setSyncMsg("Dev mode: using RxNorm API fallback");
          getDevProducts().then(() => {
            if (active) setSynced(true);
          });
        }
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // Handle query changes
  useEffect(() => {
    if (!synced || query.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (isTauri && dbRef.current) {
          const rows = await searchProductsLocal(dbRef.current, query);
          if (!cancelled) setResults(rows);
        } else if (isTauri === false) {
          const all = await getDevProducts();
          const q = query.toLowerCase();
          const filtered = all
            .filter(p => p.displayName.toLowerCase().includes(q))
            .sort((a, b) => {
              const aS = a.displayName.toLowerCase().startsWith(q) ? 0 : 1;
              const bS = b.displayName.toLowerCase().startsWith(q) ? 0 : 1;
              return aS - bS || a.displayName.localeCompare(b.displayName);
            })
            .slice(0, 50);
          if (!cancelled) setResults(filtered);
        }
      } catch (err) {
        console.error("Search failed:", err);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, synced, isTauri]);

  return { results, loading, syncMsg };
}

// ── Order Parsing & Migrations ───────────────────────────────────────────────

function parseOrders(value?: string): MedicationOrder[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(migrateEntry);
    }
  } catch {}
  return [];
}

/** Migrate legacy { name, dose, route, frequency, notes } → MedicationOrder */
function migrateEntry(entry: any): MedicationOrder {
  if (entry.product) return entry as MedicationOrder; // Already new format
  return {
    product: {
      rxcui:         "",
      displayName:   entry.name ?? "",
      ingredient:    entry.name ?? "",
      strengthValue: null,
      strengthUnit:  "",
      doseForm:      "",
      tty:           "SCD",
    },
    doseAmount: entry.dose ?? "",
    doseUnit:   "",
    route:      entry.route ?? "",
    frequency:  entry.frequency ?? "",
    notes:      entry.notes ?? "",
  };
}

function emptyOrder(): MedicationOrder {
  return {
    product: {
      rxcui: "", displayName: "", ingredient: "",
      strengthValue: null, strengthUnit: "", doseForm: "", tty: "SCD",
    },
    doseAmount: "", doseUnit: "tablet(s)", route: "", frequency: "", notes: "",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ProductComboboxProps {
  query: string;
  setQuery: (v: string) => void;
  results: MedicationProduct[];
  loading: boolean;
  onSelect: (p: MedicationProduct) => void;
  disabled?: boolean;
}

function ProductCombobox({
  query, setQuery, results, loading, onSelect, disabled = false,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder="Search drug name or ingredient…"
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          style={{
            width: "100%",
            padding: "7px 32px 7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "0.88rem",
            fontFamily: "inherit",
            boxSizing: "border-box",
            background: disabled ? "#f8fafc" : "#fff",
          }}
        />
        {loading && (
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.65rem", color: "#94a3b8" }}>⟳</span>
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem", padding: 0 }}
          >×</button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 400, maxHeight: "300px", overflowY: "auto" }}>
          {results.map((p) => {
            const q   = query.toLowerCase();
            const idx = p.displayName.toLowerCase().indexOf(q);
            const before = idx >= 0 ? p.displayName.slice(0, idx) : p.displayName;
            const match  = idx >= 0 ? p.displayName.slice(idx, idx + q.length) : "";
            const after  = idx >= 0 ? p.displayName.slice(idx + q.length) : "";
            return (
              <button
                key={p.rxcui || p.displayName}
                onClick={() => { onSelect(p); setOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: "0.84rem", cursor: "pointer", color: "#1e293b", borderBottom: "1px solid #f8fafc" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <div style={{ fontWeight: 600 }}>
                  {before}<strong style={{ color: "#3498db" }}>{match}</strong>{after}
                </div>
                {(p.ingredient || p.doseForm) && (
                  <div style={{ fontSize: "0.73rem", color: "#64748b", marginTop: "1px" }}>
                    {p.ingredient}{p.doseForm ? ` · ${p.doseForm}` : ""}
                    {p.rxcui ? <span style={{ color: "#94a3b8", marginLeft: 6 }}>RxCUI {p.rxcui}</span> : null}
                  </div>
                )}
              </button>
            );
          })}
          <button
            onClick={() => {
              onSelect({
                rxcui: "",
                displayName: query,
                ingredient: query,
                strengthValue: null,
                strengthUnit: "",
                doseForm: "",
                tty: "SCD",
              });
              setOpen(false);
            }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "#f8fafc", border: "none", fontSize: "0.84rem", cursor: "pointer", color: "#2563eb", fontWeight: 700, borderTop: results.length > 0 ? "1px solid #e2e8f0" : "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}
          >
            + Use "{query}" (manual entry)
          </button>
        </div>
      )}
    </div>
  );
}

// ── Product Badge shown after selection ───────────────────────────────────────

interface ProductBadgeProps {
  product: MedicationProduct;
  onClear: () => void;
  showDoseFields: boolean;
  order: MedicationOrder;
  onField: (field: keyof Omit<MedicationOrder, "product">, val: string) => void;
}

function ProductBadge({ product, onClear, showDoseFields, order, onField }: ProductBadgeProps) {
  if (!product.displayName) return null;
  return (
    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "8px 12px", marginTop: "6px" }}>
      {/* Top row: drug name + meta + Change button */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1d4ed8" }}>{product.displayName}</div>
          <div style={{ display: "flex", gap: "12px", marginTop: "2px", flexWrap: "wrap" }}>
            {product.ingredient && (
              <span style={metaStyle}>
                <span style={metaLabelStyle}>Ingredient</span> {product.ingredient}
              </span>
            )}
            {product.strengthValue != null && (
              <span style={metaStyle}>
                <span style={metaLabelStyle}>Strength</span> {product.strengthValue} {product.strengthUnit}
              </span>
            )}
            {product.doseForm && (
              <span style={metaStyle}>
                <span style={metaLabelStyle}>Form</span> {product.doseForm}
              </span>
            )}
            {product.rxcui && (
              <span style={metaStyle}>
                <span style={metaLabelStyle}>RxCUI</span>
                <a
                  href={`https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${product.rxcui}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "none" }}
                >
                  {product.rxcui}
                </a>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClear}
          title="Change product"
          style={{ background: "none", border: "1px solid #93c5fd", borderRadius: "4px", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Change
        </button>
      </div>

      {/* Inline dose fields — only when showDoseFields is true */}
      {showDoseFields && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr 1fr 1fr", gap: "6px", marginTop: "8px", alignItems: "end" }}>
          {/* Dose amount */}
          <div>
            <label style={metaLabelStyle}>Dose Amount</label>
            <input
              type="text"
              value={order.doseAmount}
              onChange={e => onField("doseAmount", e.target.value)}
              placeholder="e.g. 2"
              style={inlineBadgeInputStyle}
            />
          </div>
          {/* Dose unit */}
          <div>
            <label style={metaLabelStyle}>Unit</label>
            <select
              value={order.doseUnit}
              onChange={e => onField("doseUnit", e.target.value)}
              style={inlineBadgeInputStyle}
            >
              {DOSE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {/* Route */}
          <div>
            <label style={metaLabelStyle}>Route</label>
            <select value={order.route} onChange={e => onField("route", e.target.value)} style={inlineBadgeInputStyle}>
              <option value="">—</option>
              {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {/* Frequency */}
          <div>
            <label style={metaLabelStyle}>Frequency</label>
            <select value={order.frequency} onChange={e => onField("frequency", e.target.value)} style={inlineBadgeInputStyle}>
              <option value="">—</option>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {/* Clinical notes */}
          <div>
            <label style={metaLabelStyle}>Clinical Notes</label>
            <input
              type="text"
              value={order.notes}
              onChange={e => onField("notes", e.target.value)}
              placeholder="Indication, interactions…"
              style={inlineBadgeInputStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order Row ─────────────────────────────────────────────────────────────────

interface OrderRowProps {
  order: MedicationOrder;
  index: number;
  showDoseFields: boolean;
  results: MedicationProduct[];
  loading: boolean;
  query: string;
  setQuery: (v: string) => void;
  onProductSelect: (p: MedicationProduct) => void;
  onField: (field: keyof Omit<MedicationOrder, "product">, val: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  isActive: boolean;
  onFocus: () => void;
}

function OrderRow({
  order, index, showDoseFields,
  results, loading, query, setQuery, onProductSelect,
  onField, onRemove, canRemove, isActive, onFocus,
}: OrderRowProps) {
  const hasProduct = !!order.product.displayName;

  return (
    <div
      style={{ border: "1px solid #e2e8f0", borderLeft: "3px solid #3498db", borderRadius: "6px", padding: "0.75rem", marginBottom: "0.65rem", background: "#fff" }}
      onFocus={onFocus}
      onClick={onFocus}
    >
      {/* Row header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#3498db", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Medication {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", border: "1px solid #fca5a5", background: "transparent", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Product search */}
      {!hasProduct && (
        <ProductCombobox
          query={query}
          setQuery={setQuery}
          results={isActive ? results : []}
          loading={isActive && loading}
          onSelect={onProductSelect}
        />
      )}

      {/* Product badge — dose fields now live inside it */}
      {hasProduct && (
        <ProductBadge
          product={order.product}
          onClear={() => onProductSelect({ rxcui: "", displayName: "", ingredient: "", strengthValue: null, strengthUnit: "", doseForm: "", tty: "SCD" })}
          showDoseFields={showDoseFields}
          order={order}
          onField={onField}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────



const metaStyle: React.CSSProperties = {
  fontSize: "0.78rem", color: "#334155",
};

const metaLabelStyle: React.CSSProperties = {
  fontWeight: 700, color: "#64748b", fontSize: "0.68rem",
  textTransform: "uppercase", letterSpacing: "0.03em",
  marginRight: "4px",
};

const inlineBadgeInputStyle: React.CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #bfdbfe",
  borderRadius: "4px",
  fontSize: "0.82rem",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#fff",
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function DrugLookupTool({
  value,
  onChange,
  label = "Medications",
  multiEntry = true,
  showDoseFields = true,
}: DrugLookupToolProps) {
  const [orders, setOrders] = useState<MedicationOrder[]>(() => {
    const parsed = parseOrders(value);
    return parsed.length ? parsed : [emptyOrder()];
  });

  const [queries, setQueries]     = useState<string[]>(() => orders.map(o => o.product.displayName));
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const { results, loading, syncMsg } = useProductSearch(queries[activeIdx] ?? "");

  const pushChange = useCallback(
    (updated: MedicationOrder[]) => { onChange?.(JSON.stringify(updated)); },
    [onChange]
  );

  const setOrder = (idx: number, updated: MedicationOrder) => {
    const next = orders.map((o, i) => (i === idx ? updated : o));
    setOrders(next);
    pushChange(next);
  };

  const addOrder = () => {
    const next = [...orders, emptyOrder()];
    setOrders(next);
    setQueries(q => [...q, ""]);
    setActiveIdx(next.length - 1);
    pushChange(next);
  };

  const removeOrder = (idx: number) => {
    if (orders.length <= 1) {
      setOrders([emptyOrder()]);
      setQueries([""]);
      pushChange([]);
      return;
    }
    const next  = orders.filter((_, i) => i !== idx);
    const nextQ = queries.filter((_, i) => i !== idx);
    setOrders(next);
    setQueries(nextQ);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
    pushChange(next);
  };

  const filledCount = useMemo(
    () => orders.filter(o => o.product.displayName.trim()).length,
    [orders]
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--secondary, #34495e)" }}>
            {label}
          </label>
          {filledCount > 0 && (
            <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "#3498db", color: "#fff", borderRadius: "10px", padding: "1px 8px" }}>
              {filledCount} {filledCount === 1 ? "entry" : "entries"}
            </span>
          )}
          {syncMsg && (
            <span style={{ fontSize: "0.62rem", fontWeight: 600, color: syncMsg.includes("unavailable") ? "#e74c3c" : "#94a3b8", fontStyle: "italic" }}>
              {syncMsg}
            </span>
          )}
        </div>
        {multiEntry && (
          <button
            onClick={addOrder}
            style={{ background: "#3498db", color: "#fff", border: "none", borderRadius: "5px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
          >
            + Add Medication
          </button>
        )}
      </div>

      {/* Order rows */}
      {orders.map((order, idx) => (
        <OrderRow
          key={idx}
          order={order}
          index={idx}
          showDoseFields={showDoseFields}
          results={activeIdx === idx ? results : []}
          loading={activeIdx === idx && loading}
          query={queries[idx] ?? order.product.displayName}
          setQuery={q => {
            setActiveIdx(idx);
            setQueries(prev => { const next = [...prev]; next[idx] = q; return next; });
          }}
          onProductSelect={product => {
            setOrder(idx, { ...order, product });
            setQueries(prev => { const next = [...prev]; next[idx] = product.displayName; return next; });
          }}
          onField={(field, val) => setOrder(idx, { ...order, [field]: val })}
          onRemove={() => removeOrder(idx)}
          canRemove={orders.length > 1 || !!order.product.displayName}
          isActive={activeIdx === idx}
          onFocus={() => setActiveIdx(idx)}
        />
      ))}

      {/* Footer add button */}
      {multiEntry && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <button
            onClick={addOrder}
            style={{ background: "#3498db", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 4px rgba(52,152,219,0.2)" }}
          >
            + Add Medication
          </button>
        </div>
      )}

      {/* Summary chips */}
      {showDoseFields && filledCount > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
          {orders
            .filter(o => o.product.displayName.trim())
            .map((o, i) => (
              <span key={i} style={{ fontSize: "0.7rem", fontWeight: 600, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "2px 10px", display: "flex", alignItems: "center", gap: "4px" }}>
                {o.product.ingredient || o.product.displayName}
                {o.product.strengthValue != null && (
                  <span style={{ color: "#3b82f6" }}>· {o.product.strengthValue}{o.product.strengthUnit}</span>
                )}
                {o.doseAmount && (
                  <span style={{ color: "#60a5fa", fontSize: "0.62rem" }}>× {o.doseAmount} {o.doseUnit}</span>
                )}
                {o.route && (
                  <span style={{ color: "#60a5fa", fontSize: "0.62rem" }}>{o.route}</span>
                )}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}