// src/features/assessment/assess-biochemical/LabSearchBar.tsx
// Phase 3: Autosuggest search bar for adding labs to the active view.
//
// Search priority:
//   1. Local GLOBAL_LAB_CATALOG (instant, no network)
//   2. NLM LOINC API via loincService (debounced, 350ms)
//
// On selection: fires addLabToView(slug) + registerRuntimeEntry() for
// API-sourced results not already in the catalog.
//
// Bug fixes (v2):
//   - Duplicate entries: dedup now uses the full `labs` store map (all slugs
//     ever registered this session) rather than only `activeLabKeys`. This
//     prevents a previously-removed runtime entry from reappearing because it
//     was written into GLOBAL_LAB_CATALOG permanently during the first add.
//   - Missing unit placeholder: after selectResult, the skeleton LabEntry in
//     the store is updated with the resolved unit so the table shows "-- ng/dL"
//     instead of "--" for remote LOINC results.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLabsStore } from "../../../stores/useLabsStore";
import {
  GLOBAL_LAB_CATALOG,
  registerRuntimeEntry,
} from "../../../shared/data/biochemicalCatalog";
import {
  searchLoinc,
  loincResultToSlug,
  loincResultToCatalogShape,
  type LoincResult,
} from "./loincService";

// ── Result union type ─────────────────────────────────────────────────────────

interface LocalResult {
  source: "local";
  slug: string;
  label: string;
  unit: string;
  panel: string;
}

interface RemoteResult {
  source: "remote";
  slug: string;
  label: string;
  unit: string;
  loincResult: LoincResult;
}

type SearchResult = LocalResult | RemoteResult;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Search the local catalog.
 * Excludes slugs that are either currently active OR were ever registered
 * into the runtime catalog this session (i.e. present in `allKnownSlugs`).
 * This prevents previously-removed API results from showing as duplicates
 * because registerRuntimeEntry writes them into GLOBAL_LAB_CATALOG permanently.
 */
function searchLocalCatalog(
  query: string,
  activeKeys: string[],
  allKnownSlugs: Set<string>
): LocalResult[] {
  const q = query.toLowerCase();
  return Object.entries(GLOBAL_LAB_CATALOG)
    .filter(
      ([slug, entry]) =>
        !activeKeys.includes(slug) &&
        !allKnownSlugs.has(slug) &&
        (entry.name.toLowerCase().includes(q) ||
          entry.loinc.includes(q) ||
          entry.panel.toLowerCase().includes(q))
    )
    .slice(0, 10)
    .map(([slug, entry]) => ({
      source: "local" as const,
      slug,
      label: entry.name,
      unit:  entry.defaultUnit,
      panel: entry.panel,
    }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LabSearchBar() {
  const { activeLabKeys, labs, addLabToView, updateLabField } = useLabsStore();

  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchError, setFetchError]   = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [open, setOpen]               = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search orchestration ──────────────────────────────────────────────────
  const runSearch = useCallback(
    async (q: string) => {
      setFetchError(false);

      // Snapshot the known slug set at the time the search fires so the
      // closure captures a stable reference even if the store updates mid-flight.
      const knownAtSearchTime = new Set<string>([
        ...useLabsStore.getState().activeLabKeys,
        ...Object.keys(useLabsStore.getState().labs),
      ]);

      const local = searchLocalCatalog(q, Array.from(knownAtSearchTime), knownAtSearchTime);
      setResults(local);
      setOpen(true);

      if (q.length < 2) return;

      setIsSearching(true);
      try {
        const remote = await searchLoinc(q);

        // Recompute known slugs after the async gap — store may have changed
        const knownAfterFetch = new Set<string>([
          ...useLabsStore.getState().activeLabKeys,
          ...Object.keys(useLabsStore.getState().labs),
        ]);

        // Filter out anything already active, already in labs, or already in local results
        const localSlugs = new Set([
          ...Array.from(knownAfterFetch),
          ...local.map((r) => r.slug),
        ]);
        const remoteFiltered: RemoteResult[] = remote
          .map((r) => ({ ...r, slug: loincResultToSlug(r) }))
          .filter((r) => !localSlugs.has(r.slug))
          .slice(0, 8)
          .map((r) => ({
            source: "remote" as const,
            slug:   r.slug,
            label:  r.shortName,
            unit:   r.defaultUnit,
            loincResult: r,
          }));

        setResults([...local, ...remoteFiltered]);
      } catch (e) {
        console.error("LOINC search failed:", e);
        setFetchError(true);
      } finally {
        setIsSearching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally stable — reads store state directly inside
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // ── Selection handler ─────────────────────────────────────────────────────
  const selectResult = (result: SearchResult) => {
    console.log("LOINC select:", result.slug, "unit:", result.unit, "loincResult:", result.source === "remote" ? (result as RemoteResult).loincResult : null);
    if (result.source === "remote") {
      // Register the LOINC result into the runtime catalog so addLabToView
      // can build a skeleton entry with the correct unit.
      registerRuntimeEntry(
        result.slug,
        loincResultToCatalogShape(result.loincResult)
      );
    }

    addLabToView(result.slug);

    // Fix: ensure the unit field is explicitly set on the skeleton entry.
    // addLabToView builds the skeleton from the catalog, but for remote results
    // the catalog entry was just written — force-sync the unit so the
    // placeholder in the table reflects the correct unit string immediately.
    if (result.unit) {
      updateLabField(result.slug, "unit", result.unit);
    }

    setQuery("");
    setResults([]);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      selectResult(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      <div style={styles.inputRow}>
        <span style={styles.icon}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Add lab — search by name or LOINC code…"
          style={styles.input}
          aria-label="Search labs"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {isSearching && <span style={styles.spinner}>⟳</span>}
      </div>

      {open && results.length > 0 && (
        <ul style={styles.dropdown} role="listbox">
          {results.map((r, i) => (
            <li
              key={`${r.slug}-${i}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={() => selectResult(r)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                ...styles.item,
                ...(i === highlighted ? styles.itemHighlighted : {}),
              }}
            >
              <span style={styles.itemLabel}>{r.label}</span>
              <span style={styles.itemMeta}>
                {r.unit && <span style={styles.unitBadge}>{r.unit}</span>}
                {r.source === "remote" && (
                  <span style={styles.loincBadge}>
                    LOINC {(r as RemoteResult).loincResult.loincCode}
                  </span>
                )}
                {r.source === "local" && (
                  <span style={styles.panelBadge}>{(r as LocalResult).panel}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && results.length === 0 && !isSearching && (
        <div style={styles.empty}>
          {fetchError
            ? "⚠ LOINC search unavailable — check network connection."
            : "No matching labs found in local catalog or LOINC database."}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    width: "100%",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "var(--white)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "4px 10px",
  },
  icon: { fontSize: "0.85rem", color: "var(--text-muted)", flexShrink: 0 },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "0.85rem",
    background: "transparent",
    color: "var(--text-main)",
    padding: "2px 0",
    width: "100%",
  },
  spinner: {
    fontSize: "0.85rem",
    color: "var(--accent)",
    animation: "spin 1s linear infinite",
    flexShrink: 0,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "var(--white)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    listStyle: "none",
    margin: 0,
    padding: "4px 0",
    zIndex: 500,
    maxHeight: "420px",
    overflowY: "auto",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 12px",
    cursor: "pointer",
    gap: "8px",
  },
  itemHighlighted: {
    background: "var(--bg-color)",
  },
  itemLabel: {
    fontSize: "0.83rem",
    fontWeight: 600,
    color: "var(--text-main)",
    flex: 1,
    overflow: "visible",
    textOverflow: "clip",
    whiteSpace: "normal",
    lineHeight: "1.3",
  },
  itemMeta: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    flexShrink: 0,
  },
  unitBadge: {
    fontSize: "0.68rem",
    background: "var(--bg-color)",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "1px 5px",
  },
  loincBadge: {
    fontSize: "0.65rem",
    background: "#eff6ff",
    color: "#3b82f6",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    padding: "1px 5px",
    fontFamily: "monospace",
  },
  panelBadge: {
    fontSize: "0.65rem",
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    borderRadius: "4px",
    padding: "1px 5px",
  },
  empty: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "var(--white)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.82rem",
    color: "var(--text-muted)",
    zIndex: 500,
  },
};