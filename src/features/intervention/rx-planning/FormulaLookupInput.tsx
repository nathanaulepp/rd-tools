// src/features/intervention/rx-planning/FormulaLookupInput.tsx
// Drop this file into src/features/intervention/rx-planning/
// Combobox for NP-1.2.3.1 — searches the hospital formulary and populates
// related EN fields when a formula is selected.
// Falls back gracefully to free-text if the formulary is empty.

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEnteralFormulaStore } from "../../../stores/useEnteralFormulaStore";
import type { EnteralFormula } from "../../../types/enteralFormula";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormulaPatch {
  formulaName: string;
  /** kcal/mL — caller converts to daily targets */
  kcalPerMl?: number;
  proteinGPerL?: number;
  freeWaterPct?: number;
}

interface FormulaLookupInputProps {
  value: string;
  onChange: (patch: FormulaPatch) => void;
  disabled?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function score(formula: EnteralFormula, query: string): number {
  const q = query.toLowerCase();
  const name = formula.name.toLowerCase();
  const mfr  = formula.manufacturer.toLowerCase();
  if (name.startsWith(q))             return 3;
  if (name.includes(q))               return 2;
  if (mfr.includes(q))                return 1;
  return 0;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#fff0a0", borderRadius: 2, padding: 0 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function fmtNum(v: number | null, dec = 1): string {
  if (v === null) return "—";
  return v % 1 === 0 ? String(v) : v.toFixed(dec);
}

// ── Inline detail chip row ────────────────────────────────────────────────────

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 6,
      padding: "2px 8px", minWidth: 52,
    }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e40af" }}>{value}</span>
      <span style={{ fontSize: "0.58rem", color: "#64748b", textTransform: "uppercase",
        letterSpacing: "0.04em" }}>{label}</span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FormulaLookupInput({
  value,
  onChange,
  disabled = false,
}: FormulaLookupInputProps) {
  const { formulas, isLoading, loadFormulas } = useEnteralFormulaStore();

  const [query, setQuery]         = useState(value);
  const [open, setOpen]           = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [selected, setSelected]   = useState<EnteralFormula | null>(null);

  const inputRef    = useRef<HTMLInputElement>(null);
  const listRef     = useRef<HTMLUListElement>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  // Load formulary once on mount
  useEffect(() => {
    if (formulas.length === 0 && !isLoading) loadFormulas();
  }, []);

  // Sync external value → local query when it changes from outside
  useEffect(() => {
    if (value !== query) setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Filter + rank
  const filtered = query.trim()
    ? formulas
        .map(f => ({ f, s: score(f, query.trim()) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s)
        .map(({ f }) => f)
        .slice(0, 8)
    : formulas.slice(0, 8);

  const handleSelect = useCallback((formula: EnteralFormula) => {
    setSelected(formula);
    setQuery(formula.name);
    setOpen(false);
    setActiveIdx(-1);
    onChange({
      formulaName:   formula.name,
      kcalPerMl:     formula.kcal_per_ml    ?? undefined,
      proteinGPerL:  formula.protein_g_per_l ?? undefined,
      freeWaterPct:  formula.free_water_pct  ?? undefined,
    });
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    setActiveIdx(-1);
    setSelected(null);
    // Propagate free-text immediately so parent state stays in sync
    onChange({ formulaName: v });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown") { setOpen(true); return; }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        handleSelect(filtered[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  const showDropdown = open && !disabled && filtered.length > 0;

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      {/* Input */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search formulary or type custom…"
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "5px 30px 5px 8px",
            border: `1px solid ${selected ? "#3498db" : "#e2e8f0"}`,
            borderRadius: 4,
            fontSize: "0.85rem",
            background: disabled ? "#f8fafc" : "#fff",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => {
            if (!disabled) (e.currentTarget as HTMLInputElement).style.borderColor = "#3498db";
          }}
          onMouseLeave={e => {
            if (!disabled && !selected)
              (e.currentTarget as HTMLInputElement).style.borderColor = "#e2e8f0";
          }}
        />
        {/* Icon */}
        <span style={{
          position: "absolute", right: 8, color: "#94a3b8",
          fontSize: "0.75rem", pointerEvents: "none", userSelect: "none",
        }}>
          {isLoading ? "⏳" : "🔍"}
        </span>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 3px)",
            left: 0,
            right: 0,
            zIndex: 500,
            margin: 0,
            padding: "4px 0",
            listStyle: "none",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {filtered.map((f, idx) => {
            const isActive = idx === activeIdx;
            return (
              <li
                key={f.id}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(f); }}
                style={{
                  padding: "7px 12px",
                  cursor: "pointer",
                  background: isActive ? "#f0f7ff" : "transparent",
                  borderLeft: isActive ? "3px solid #3498db" : "3px solid transparent",
                  transition: "background 0.08s",
                }}
              >
                {/* Formula name row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#1e293b" }}>
                    {highlight(f.name, query)}
                  </span>
                  {f.manufacturer && (
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      {highlight(f.manufacturer, query)}
                    </span>
                  )}
                  {f.is_seeded && (
                    <span style={{
                      marginLeft: "auto", fontSize: "0.58rem", fontWeight: 700,
                      color: "#94a3b8", background: "#f1f5f9", borderRadius: 4,
                      padding: "1px 4px", border: "1px solid #e2e8f0",
                    }}>
                      SEEDED
                    </span>
                  )}
                </div>
                {/* Macro chips */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {f.kcal_per_ml    !== null && <NanoChip label="kcal/mL" value={fmtNum(f.kcal_per_ml)} />}
                  {f.protein_g_per_l !== null && <NanoChip label="Prot g/L" value={fmtNum(f.protein_g_per_l, 0)} />}
                  {f.free_water_pct  !== null && <NanoChip label="FW%" value={`${f.free_water_pct}%`} />}
                  {f.osmolality      !== null && <NanoChip label="mOsm" value={fmtNum(f.osmolality, 0)} />}
                  {f.route && <NanoChip label="route" value={f.route} accent />}
                </div>
              </li>
            );
          })}

          {/* Free-text option when typed value doesn't match any formula */}
          {query.trim() && !filtered.some(f => f.name.toLowerCase() === query.toLowerCase()) && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                setSelected(null);
                setOpen(false);
                onChange({ formulaName: query });
              }}
              style={{
                padding: "7px 12px",
                cursor: "pointer",
                borderTop: "1px solid #f1f5f9",
                color: "#64748b",
                fontSize: "0.78rem",
                fontStyle: "italic",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Use "{query}" as custom formula name
            </li>
          )}
        </ul>
      )}

      {/* Selected formula detail card */}
      {selected && (
        <div style={{
          marginTop: 6,
          padding: "8px 10px",
          background: "#f0f7ff",
          border: "1px solid #bfdbfe",
          borderRadius: 6,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e40af",
            marginRight: 4, whiteSpace: "nowrap" }}>
            ✓ {selected.name}
          </span>
          {selected.kcal_per_ml    !== null && <DetailChip label="kcal/mL" value={fmtNum(selected.kcal_per_ml)} />}
          {selected.protein_g_per_l !== null && <DetailChip label="Prot g/L" value={fmtNum(selected.protein_g_per_l, 0)} />}
          {selected.fat_g_per_l     !== null && <DetailChip label="Fat g/L" value={fmtNum(selected.fat_g_per_l, 0)} />}
          {selected.cho_g_per_l     !== null && <DetailChip label="CHO g/L" value={fmtNum(selected.cho_g_per_l, 0)} />}
          {selected.fiber_total_g_per_l !== null && <DetailChip label="Fiber g/L" value={fmtNum(selected.fiber_total_g_per_l, 0)} />}
          {selected.free_water_pct  !== null && <DetailChip label="FW%" value={`${selected.free_water_pct}%`} />}
          {selected.osmolality      !== null && <DetailChip label="mOsm" value={fmtNum(selected.osmolality, 0)} />}
          <button
            onClick={() => {
              setSelected(null);
              setQuery("");
              onChange({ formulaName: "" });
              inputRef.current?.focus();
            }}
            title="Clear selection"
            style={{
              marginLeft: "auto", background: "transparent", border: "none",
              color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem", lineHeight: 1,
              padding: "2px 4px",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tiny inline chip for dropdown rows ───────────────────────────────────────

function NanoChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span style={{
      fontSize: "0.62rem", borderRadius: 4,
      padding: "1px 5px",
      background: accent ? "#fff0f0" : "#f1f5f9",
      color: accent ? "#b91c1c" : "#64748b",
      border: `1px solid ${accent ? "#fecaca" : "#e2e8f0"}`,
    }}>
      {value} <span style={{ opacity: 0.6 }}>{label}</span>
    </span>
  );
}