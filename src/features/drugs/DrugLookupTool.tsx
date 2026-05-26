// src/features/drugs/DrugLookupTool.tsx
// ─────────────────────────────────────────────────────────────────────────────
// RxNorm-powered drug lookup with local SQLite caching via @tauri-apps/plugin-sql
//
// DATA FLOW:
//   App launch → checkDrugCache() → if stale/empty → fetchRxNormNames()
//               → writes to SQLite drugs.db → SearchableCombobox reads from DB
//
// INTEGRATION (D4 Medication & CAM Use, or any domain):
//   <DrugLookupTool
//     value={dietary.otcMeds}
//     onChange={(entry) => handleUpdate("otcMeds", entry)}
//     label="D42: OTC Medication Usage"
//     placeholder="Search drug name..."
//   />
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import Database from "@tauri-apps/plugin-sql";

// ── Type declarations ─────────────────────────────────────────────────────────

interface DrugEntry {
  id: number;
  display_name: string;  // The exact string from RxNorm displaynames
}

interface SelectedDrug {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  notes: string;
}

interface DrugLookupToolProps {
  /** Current value — a JSON string of SelectedDrug[] or a plain string */
  value?: string;
  /** Called with updated serialised value on every change */
  onChange?: (value: string) => void;
  /** Label rendered above the component */
  label?: string;
  /** Placeholder for the drug search input */
  placeholder?: string;
  /** Allow adding multiple drug entries (default: true) */
  multiEntry?: boolean;
  /** Whether to show the dose / route / frequency fields (default: true) */
  showDoseFields?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RXNORM_URL = "https://rxnav.nlm.nih.gov/REST/displaynames.json";
const CACHE_KEY  = "rxnorm_drug_cache_date";
const DB_NAME    = "sqlite:drugs.db";
/** Re-fetch from RxNorm every 30 days */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DOSE_UNITS   = ["mg", "mcg", "g", "mEq", "mmol", "IU", "units", "mL", "%"];
const ROUTES       = ["Oral", "IV", "IM", "SQ", "SL", "Topical", "Inhaled", "Rectal", "Transdermal", "Other"];
const FREQUENCIES  = [
  "Once daily", "Twice daily (BID)", "Three times daily (TID)",
  "Four times daily (QID)", "Every 6h", "Every 8h", "Every 12h",
  "Weekly", "Twice weekly", "Monthly", "As needed (PRN)", "Other",
];

// ── Database helpers ──────────────────────────────────────────────────────────

async function getDb(): Promise<Database> {
  // Dynamic import so it only loads inside Tauri
  const { default: DatabaseImpl } = await import("@tauri-apps/plugin-sql");
  return DatabaseImpl.load(DB_NAME);
}

async function ensureSchema(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS drug_names (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      display_name TEXT NOT NULL UNIQUE
    )
  `);
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_display_name ON drug_names(display_name)`
  );
}

async function getDrugCount(db: Database): Promise<number> {
  const rows = await db.select<Array<{ cnt: number }>>(
    `SELECT COUNT(*) as cnt FROM drug_names`
  );
  return rows[0]?.cnt ?? 0;
}

async function searchDrugs(db: Database, query: string): Promise<DrugEntry[]> {
  if (!query.trim()) return [];
  const searchPattern = `%${query}%`;
  const startsWithPattern = `${query}%`;

  return db.select<DrugEntry[]>(
    `SELECT id, display_name FROM drug_names
     WHERE display_name LIKE ?
     ORDER BY
       CASE WHEN display_name LIKE ? THEN 0 ELSE 1 END,
       display_name
     LIMIT 40`,
    [searchPattern, startsWithPattern]
  );
}

async function populateFromRxNorm(db: Database, terms: string[]): Promise<void> {
  // Batch inserts — SQLite does ~500 inserts/s comfortably
  const BATCH = 500;
  for (let i = 0; i < terms.length; i += BATCH) {
    const slice = terms.slice(i, i + BATCH);
    // Build a single multi-value INSERT for speed
    const placeholders = slice.map(() => "(?)").join(",");
    await db.execute(
      `INSERT OR IGNORE INTO drug_names (display_name) VALUES ${placeholders}`,
      slice
    );
  }
}

// ── Sync / cache logic ────────────────────────────────────────────────────────

export async function syncDrugDatabase(force = false): Promise<{
  status: "skipped" | "synced" | "error";
  count?: number;
  error?: string;
}> {
  try {
    const lastSync = localStorage.getItem(CACHE_KEY);
    const isStale  =
      !lastSync || Date.now() - Date.parse(lastSync) > CACHE_TTL_MS;

    if (!isStale && !force) return { status: "skipped" };

    const db = await getDb();
    await ensureSchema(db);

    // Check if DB already has data and skip network fetch if not stale
    const existing = await getDrugCount(db);
    if (existing > 0 && !isStale && !force) return { status: "skipped" };

    // Fetch from RxNorm
    const res = await fetch(RXNORM_URL, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`RxNorm HTTP ${res.status}`);

    const json = await res.json();
    // RxNorm returns: { displayTermsList: { term: string[] } }
    const terms: string[] = json?.displayTermsList?.term ?? [];
    if (terms.length === 0) throw new Error("RxNorm returned empty term list");

    await populateFromRxNorm(db, terms);
    const count = await getDrugCount(db);
    localStorage.setItem(CACHE_KEY, new Date().toISOString());

    return { status: "synced", count };
  } catch (err: any) {
    return { status: "error", error: err?.message ?? String(err) };
  }
}

// ── Fallback: in-memory mode (browser / dev) ──────────────────────────────────
// When running outside Tauri (e.g. Vite dev server), the plugin-sql import
// fails. We fall back to fetching once and filtering in memory.

let _memTerms: string[] | null = null;

async function getMemTerms(): Promise<string[]> {
  if (_memTerms) return _memTerms;
  try {
    const res  = await fetch(RXNORM_URL, { headers: { Accept: "application/json" } });
    const json = await res.json();
    _memTerms  = json?.displayTermsList?.term ?? [];
  } catch {
    _memTerms = [];
  }
  return _memTerms!;
}

function searchMem(terms: string[], query: string): string[] {
  const q = query.toLowerCase();
  return terms
    .filter(t => t.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b);
    })
    .slice(0, 40);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useDrugSearch(query: string) {
  const [results, setResults]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [isTauri, setIsTauri]     = useState<boolean | null>(null);
  const [synced, setSynced]       = useState(false);
  const [syncMsg, setSyncMsg]     = useState<string | null>(null);
  const dbRef = useRef<any>(null);

  // On mount: detect Tauri, setup DB
  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        await ensureSchema(db);
        dbRef.current = db;
        setIsTauri(true);

        // Check cache freshness
        const lastSync = localStorage.getItem(CACHE_KEY);
        const isStale  = !lastSync || Date.now() - Date.parse(lastSync) > CACHE_TTL_MS;

        if (isStale) {
          setSyncMsg("Updating drug index from RxNorm…");
          const result = await syncDrugDatabase(false);
          if (result.status === "synced") {
            setSyncMsg(`✓ ${result.count?.toLocaleString()} drugs loaded`);
          } else if (result.status === "error") {
            setSyncMsg(`⚠ Sync failed: ${result.error}`);
          } else {
            setSyncMsg(null);
          }
          setTimeout(() => setSyncMsg(null), 3000);
        }
        setSynced(true);
      } catch {
        // Not in Tauri — use in-memory fallback
        setIsTauri(false);
        setSyncMsg("Loading drug index…");
        await getMemTerms();
        setSyncMsg(null);
        setSynced(true);
      }
    })();
  }, []);

  // Search whenever query changes
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
          const rows = await searchDrugs(dbRef.current, query);
          if (!cancelled) setResults(rows.map(r => r.display_name));
        } else {
          const terms = await getMemTerms();
          if (!cancelled) setResults(searchMem(terms, query));
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, synced, isTauri]);

  return { results, loading, syncMsg };
}

// ── Drug entry parsing ────────────────────────────────────────────────────────

function parseEntries(value?: string): SelectedDrug[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy plain-string support
  return value.trim()
    ? [{ name: value, dose: "", route: "", frequency: "", notes: "" }]
    : [];
}

function emptyEntry(): SelectedDrug {
  return { name: "", dose: "", route: "", frequency: "", notes: "" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ComboProps {
  query: string;
  setQuery: (v: string) => void;
  results: string[];
  loading: boolean;
  onSelect: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function DrugCombobox({
  query,
  setQuery,
  results,
  loading,
  onSelect,
  placeholder = "Search drug name…",
  disabled = false,
}: ComboProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (name: string) => {
    onSelect(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          style={{
            width: "100%",
            padding: "6px 32px 6px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "0.88rem",
            fontFamily: "inherit",
            boxSizing: "border-box",
            background: disabled ? "#f8fafc" : "#fff",
          }}
        />
        {loading && (
          <span style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            fontSize: "0.65rem", color: "#94a3b8",
          }}>
            ⟳
          </span>
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setOpen(false); onSelect(""); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#94a3b8",
              cursor: "pointer", fontSize: "1rem", padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 400,
          maxHeight: "260px",
          overflowY: "auto",
        }}>
          {results.map((name, i) => {
            // Highlight matching substring
            const q = query.toLowerCase();
            const idx = name.toLowerCase().indexOf(q);
            const before = idx >= 0 ? name.slice(0, idx) : name;
            const match  = idx >= 0 ? name.slice(idx, idx + q.length) : "";
            const after  = idx >= 0 ? name.slice(idx + q.length) : "";
            return (
              <button
                key={i}
                onClick={() => handleSelect(name)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "7px 12px", background: "none", border: "none",
                  fontSize: "0.84rem", cursor: "pointer", color: "#1e293b",
                  borderBottom: "1px solid #f8fafc",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {before}
                <strong style={{ color: "#3498db" }}>{match}</strong>
                {after}
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
          padding: "0.65rem 1rem", fontSize: "0.82rem", color: "#94a3b8",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 400,
        }}>
          No matches for "{query}" — you can type it in manually.
        </div>
      )}
    </div>
  );
}

// Single drug entry row
interface EntryRowProps {
  entry: SelectedDrug;
  index: number;
  showDoseFields: boolean;
  results: string[];
  loading: boolean;
  query: string;
  setQuery: (v: string) => void;
  onNameSelect: (name: string) => void;
  onField: (field: keyof SelectedDrug, val: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function EntryRow({
  entry, index, showDoseFields,
  results, loading, query, setQuery, onNameSelect,
  onField, onRemove, canRemove,
}: EntryRowProps) {
  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderLeft: "3px solid #3498db",
      borderRadius: "6px",
      padding: "0.75rem",
      marginBottom: "0.6rem",
      background: "#fff",
    }}>
      {/* Row header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "0.55rem",
      }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#3498db", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Medication {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            style={{
              fontSize: "0.65rem", padding: "2px 8px",
              borderRadius: "10px", border: "1px solid #fca5a5",
              background: "transparent", color: "#dc2626", cursor: "pointer", fontWeight: 600,
            }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Drug name combobox */}
      <div style={{ display: "flex", gap: "8px", marginBottom: showDoseFields ? "0.6rem" : 0, alignItems: "center" }}>
        <DrugCombobox
          query={query}
          setQuery={setQuery}
          results={results}
          loading={loading}
          onSelect={onNameSelect}
          placeholder="Search RxNorm drug name…"
        />
      </div>

      {showDoseFields && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr 1fr", gap: "0.5rem" }}>
          {/* Dose */}
          <div>
            <label style={labelStyle}>Dose / Strength</label>
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="text"
                value={entry.dose}
                onChange={e => onField("dose", e.target.value)}
                placeholder="e.g. 10"
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={entry.dose.match(/[a-zA-Z%]+$/)?.[0] ?? ""}
                onChange={e => {
                  // Append/replace unit suffix
                  const num = entry.dose.replace(/[a-zA-Z%]+$/, "").trim();
                  onField("dose", `${num} ${e.target.value}`.trim());
                }}
                style={{ ...inputStyle, width: "68px", padding: "5px 4px" }}
              >
                <option value="">unit</option>
                {DOSE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Route */}
          <div>
            <label style={labelStyle}>Route</label>
            <select
              value={entry.route}
              onChange={e => onField("route", e.target.value)}
              style={inputStyle}
            >
              <option value="">—</option>
              {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label style={labelStyle}>Frequency</label>
            <select
              value={entry.frequency}
              onChange={e => onField("frequency", e.target.value)}
              style={inputStyle}
            >
              <option value="">—</option>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Clinical Notes */}
          <div>
            <label style={labelStyle}>Clinical Notes</label>
            <input
              type="text"
              value={entry.notes}
              onChange={e => onField("notes", e.target.value)}
              placeholder="Indication, interactions…"
              style={inputStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: "0.68rem", fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.04em",
  display: "block", marginBottom: "3px",
};

const inputStyle: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: "4px",
  fontSize: "0.85rem",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function DrugLookupTool({
  value,
  onChange,
  label = "Medications",
  placeholder = "Search drug name…",
  multiEntry = true,
  showDoseFields = true,
}: DrugLookupToolProps) {
  const [entries, setEntries] = useState<SelectedDrug[]>(() => {
    const parsed = parseEntries(value);
    return parsed.length ? parsed : [emptyEntry()];
  });

  // Per-entry search state (one query string per entry row)
  const [queries, setQueries] = useState<string[]>(() =>
    entries.map(e => e.name)
  );
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const { results, loading, syncMsg } = useDrugSearch(queries[activeIdx] ?? "");

  // Sync outward whenever entries change
  const pushChange = useCallback(
    (updated: SelectedDrug[]) => {
      onChange?.(JSON.stringify(updated));
    },
    [onChange]
  );

  const setEntry = (idx: number, updated: SelectedDrug) => {
    const next = entries.map((e, i) => (i === idx ? updated : e));
    setEntries(next);
    pushChange(next);
  };

  const addEntry = () => {
    const next = [...entries, emptyEntry()];
    setEntries(next);
    setQueries(q => [...q, ""]);
    setActiveIdx(next.length - 1);
    pushChange(next);
  };

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) {
      setEntries([emptyEntry()]);
      setQueries([""]);
      pushChange([]);
      return;
    }
    const next = entries.filter((_, i) => i !== idx);
    const nextQ = queries.filter((_, i) => i !== idx);
    setEntries(next);
    setQueries(nextQ);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
    pushChange(next);
  };

  // Count filled entries for summary badge
  const filledCount = useMemo(
    () => entries.filter(e => e.name.trim()).length,
    [entries]
  );

  return (
    <div>
      {/* Section header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "0.65rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{
            fontSize: "0.75rem", fontWeight: 700,
            color: "var(--secondary, #34495e)",
          }}>
            {label}
          </label>
          {filledCount > 0 && (
            <span style={{
              fontSize: "0.62rem", fontWeight: 800,
              background: "#3498db", color: "#fff",
              borderRadius: "10px", padding: "1px 8px",
            }}>
              {filledCount} {filledCount === 1 ? "entry" : "entries"}
            </span>
          )}
          {syncMsg && (
            <span style={{
              fontSize: "0.62rem", fontWeight: 600,
              color: syncMsg.startsWith("✓") ? "#27ae60" :
                     syncMsg.startsWith("⚠") ? "#e74c3c" : "#94a3b8",
              fontStyle: "italic",
            }}>
              {syncMsg}
            </span>
          )}
        </div>
        {multiEntry && (
          <button
            onClick={addEntry}
            style={{
              background: "#3498db", color: "#fff", border: "none",
              borderRadius: "5px", padding: "4px 10px",
              fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            + Add Medication
          </button>
        )}
      </div>

      {/* Entry rows */}
      {entries.map((entry, idx) => (
        <EntryRow
          key={idx}
          entry={entry}
          index={idx}
          showDoseFields={showDoseFields}
          results={activeIdx === idx ? results : []}
          loading={activeIdx === idx && loading}
          query={queries[idx] ?? entry.name}
          setQuery={q => {
            setActiveIdx(idx);
            setQueries(prev => {
              const next = [...prev];
              next[idx] = q;
              return next;
            });
          }}
          onNameSelect={name => {
            setEntry(idx, { ...entry, name });
            setQueries(prev => {
              const next = [...prev];
              next[idx] = name;
              return next;
            });
          }}
          onField={(field, val) => setEntry(idx, { ...entry, [field]: val })}
          onRemove={() => removeEntry(idx)}
          canRemove={entries.length > 1 || !!entry.name}
        />
      ))}

      {/* Summary chips (when showDoseFields) */}
      {showDoseFields && filledCount > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "5px",
          marginTop: "0.5rem", paddingTop: "0.5rem",
          borderTop: "1px solid #f1f5f9",
        }}>
          {entries
            .filter(e => e.name.trim())
            .map((e, i) => (
              <span key={i} style={{
                fontSize: "0.7rem", fontWeight: 600,
                background: "#eff6ff", color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                borderRadius: "12px", padding: "2px 10px",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                {e.name}
                {e.dose && <span style={{ color: "#3b82f6" }}>· {e.dose}</span>}
                {e.route && <span style={{ color: "#60a5fa", fontSize: "0.62rem" }}>{e.route}</span>}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Convenience re-export for the sync utility ────────────────────────────────
// Call this from App.tsx useEffect on boot:
//   import { syncDrugDatabase } from "../features/drugs/DrugLookupTool";
//   useEffect(() => { syncDrugDatabase(); }, []);
export { syncDrugDatabase as initDrugSync };