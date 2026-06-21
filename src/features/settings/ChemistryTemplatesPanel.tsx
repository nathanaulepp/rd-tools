import { useState, useEffect, CSSProperties } from "react";
import { useLabsStore } from "../../stores/useLabsStore";
import {
  GLOBAL_LAB_CATALOG,
  DEFAULT_PANEL_KEYS,
  registerRuntimeEntry,
} from "../../shared/data/biochemicalCatalog";
import {
  searchLoinc,
  loincResultToSlug,
  loincResultToCatalogShape,
  type LoincResult,
} from "../assessment/assess-biochemical/loincService";

interface ChemistryTemplatesPanelProps {
  showToast: (msg: string) => void;
}

export default function ChemistryTemplatesPanel({ showToast }: ChemistryTemplatesPanelProps) {
  const {
    userPresets,
    deletePreset,
    saveKeysAsPreset,
    loadPreset,
  } = useLabsStore();

  // State
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [draftName, setDraftName] = useState<string>("");
  const [panelFilter, setPanelFilter] = useState<string>("Endocrine & Metabolic");
  const [loincQuery, setLoincQuery] = useState<string>("");
  const [loincResults, setLoincResults] = useState<LoincResult[]>([]);
  const [isLoincSearching, setIsLoincSearching] = useState<boolean>(false);
  const [loincError, setLoincError] = useState<boolean>(false);

  // Debounced LOINC search
  useEffect(() => {
    if (loincQuery.trim().length < 2) {
      setLoincResults([]);
      setIsLoincSearching(false);
      setLoincError(false);
      return;
    }

    setIsLoincSearching(true);
    setLoincError(false);

    const timer = setTimeout(async () => {
      try {
        const results = await searchLoinc(loincQuery);
        setLoincResults(results);
      } catch (e) {
        console.error("LOINC search failed:", e);
        setLoincError(true);
        setLoincResults([]);
      } finally {
        setIsLoincSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [loincQuery]);

  // Handlers
  const addToDraft = (slug: string) => {
    if (!draftKeys.includes(slug)) {
      setDraftKeys((prev) => [...prev, slug]);
    }
  };

  const removeFromDraft = (slug: string) => {
    setDraftKeys((prev) => prev.filter((k) => k !== slug));
  };

  const handleLoincSelect = (result: LoincResult) => {
    const slug = loincResultToSlug(result);
    registerRuntimeEntry(slug, loincResultToCatalogShape(result));
    addToDraft(slug);
    setLoincQuery("");
    setLoincResults([]);
  };

  const handleSave = () => {
    const name = draftName.trim();
    if (!name || draftKeys.length === 0) return;
    saveKeysAsPreset(name, draftKeys);
    setDraftName("");
    setDraftKeys([]);
    showToast("Template saved ✓");
  };

  const handleDelete = (id: string, name: string) => {
    deletePreset(id);
    showToast(`Template "${name}" deleted ✓`);
  };

  const handleLoad = (id: string) => {
    loadPreset(id);
    showToast("Template applied to Biochemical domain ✓");
  };

  return (
    <>
      {/* Section 1: Saved Templates */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Saved Templates</h3>
        
        {userPresets.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧪</span>
            <div style={styles.emptyText}>No templates yet — build one below.</div>
          </div>
        ) : (
          <div style={styles.presetsList}>
            {userPresets.map((preset) => (
              <div key={preset.id} style={styles.presetCard}>
                <div style={styles.presetInfo}>
                  <div style={styles.presetName}>{preset.name}</div>
                  <div style={styles.presetCount}>{preset.labKeys.length} labs</div>
                </div>
                <div style={styles.presetActions}>
                  <button
                    onClick={() => handleLoad(preset.id)}
                    style={styles.btnApply}
                  >
                    Apply to Domain
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id, preset.name)}
                    style={styles.btnDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Build New Template */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Build New Template</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Template Name</label>
          <input
            type="text"
            placeholder="e.g. Basic Metabolic Panel, Lipids View..."
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.grid}>
          <div style={styles.column}>
            <h4 style={styles.columnHeader}>Browse Common Labs</h4>
            <select
              value={panelFilter}
              onChange={(e) => setPanelFilter(e.target.value)}
              style={styles.select}
            >
              {Object.keys(DEFAULT_PANEL_KEYS).map((panelName) => (
                <option key={panelName} value={panelName}>
                  {panelName}
                </option>
              ))}
            </select>

            <div style={styles.labListScrollable}>
              {Object.entries(GLOBAL_LAB_CATALOG)
                .filter(([, entry]) => entry.panel === panelFilter)
                .map(([slug, entry]) => {
                  const isAdded = draftKeys.includes(slug);
                  return (
                    <div key={slug} style={styles.labRow}>
                      <div style={styles.labText}>
                        <span style={styles.labName}>{entry.name}</span>
                        {entry.defaultUnit && (
                          <span style={styles.badge}>{entry.defaultUnit}</span>
                        )}
                      </div>
                      <button
                        onClick={() => addToDraft(slug)}
                        disabled={isAdded}
                        style={{
                          ...styles.btnAdd,
                          ...(isAdded ? styles.btnAddDisabled : {}),
                        }}
                      >
                        ＋
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right column — LOINC Search + Draft Preview */}
          <div style={styles.column}>
            <h4 style={styles.columnHeader}>LOINC Search + Draft Preview</h4>
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <input
                type="text"
                placeholder="Search LOINC by name or code..."
                value={loincQuery}
                onChange={(e) => setLoincQuery(e.target.value)}
                style={styles.searchInput}
              />
              {isLoincSearching && <span style={styles.spinner}>⟳</span>}
            </div>

            {loincError && (
              <div style={styles.warningBox}>
                ⚠ LOINC search unavailable — check network connection.
              </div>
            )}

            {!isLoincSearching && !loincError && loincResults.length > 0 && (
              <div style={styles.searchResultsList}>
                {loincResults.map((result) => {
                  const slug = loincResultToSlug(result);
                  const isAdded = draftKeys.includes(slug);
                  return (
                    <div key={result.loincCode} style={styles.labRow}>
                      <div style={styles.labText}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "var(--text-main)" }}>
                            {result.shortName}
                          </span>
                          {result.subtitle && (
                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                        <span style={styles.monoBadge}>{result.loincCode}</span>
                        {result.defaultUnit && (
                          <span style={styles.badge}>{result.defaultUnit}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleLoincSelect(result)}
                        disabled={isAdded}
                        style={{
                          ...styles.btnAdd,
                          ...(isAdded ? styles.btnAddDisabled : {}),
                        }}
                      >
                        ＋
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.draftContainer}>
              <h5 style={styles.draftHeader}>
                Current Template Draft ({draftKeys.length} lab{draftKeys.length !== 1 ? "s" : ""})
              </h5>
              {draftKeys.length === 0 ? (
                <div style={styles.draftPlaceholder}>
                  No labs added yet. Click ＋ from the panels or search LOINC.
                </div>
              ) : (
                <div style={styles.draftList}>
                  {draftKeys.map((slug) => {
                    const name = GLOBAL_LAB_CATALOG[slug]?.name ?? slug;
                    return (
                      <div key={slug} style={styles.draftRow}>
                        <span style={styles.draftLabName}>{name}</span>
                        <button
                          onClick={() => removeFromDraft(slug)}
                          style={styles.btnRemove}
                          title="Remove from draft"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!draftName.trim() || draftKeys.length === 0}
          style={{
            ...styles.btnSave,
            ...(!draftName.trim() || draftKeys.length === 0 ? styles.btnSaveDisabled : {}),
          }}
        >
          Save Template
        </button>
      </section>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    margin: "0 0 1rem 0",
    fontSize: "1rem",
    fontWeight: 800,
    color: "#1e293b",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "0.5rem",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  presetsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  presetCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#f8fafc",
  },
  presetInfo: {},
  presetName: {
    fontWeight: 700,
    fontSize: "0.9rem",
    color: "#1e293b",
  },
  presetCount: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "2px",
  },
  presetActions: {
    display: "flex",
    gap: "0.5rem",
  },
  btnApply: {
    padding: "6px 12px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnDelete: {
    padding: "6px 12px",
    background: "#fff",
    color: "#e74c3c",
    border: "1px solid #f5c2c2",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "1.25rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.88rem",
    color: "#1e293b",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  columnHeader: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  select: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#334155",
    outline: "none",
    cursor: "pointer",
    marginBottom: "0.75rem",
  },
  labListScrollable: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    maxHeight: "300px",
    overflowY: "auto",
    background: "#fafafa",
  },
  labRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    borderBottom: "1px solid #f1f5f9",
  },
  labText: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  labName: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#334155",
  },
  badge: {
    fontSize: "0.68rem",
    background: "#e2e8f0",
    color: "#475569",
    borderRadius: "4px",
    padding: "1px 5px",
    fontWeight: 500,
  },
  monoBadge: {
    fontSize: "0.65rem",
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    padding: "1px 4px",
    fontFamily: "monospace",
  },
  btnAdd: {
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: "1.2",
  },
  btnAddDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    border: "1px solid #e2e8f0",
    cursor: "not-allowed",
  },
  searchInput: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.85rem",
    color: "#334155",
    outline: "none",
    boxSizing: "border-box",
  },
  spinner: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "0.85rem",
    color: "#3498db",
    animation: "spin 1s linear infinite",
  },
  warningBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#b45309",
    fontSize: "0.78rem",
    marginBottom: "0.75rem",
    lineHeight: 1.4,
  },
  searchResultsList: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    maxHeight: "150px",
    overflowY: "auto",
    background: "#fafafa",
    marginBottom: "0.75rem",
  },
  draftContainer: {
    marginTop: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.75rem",
    background: "#f8fafc",
    flex: 1,
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
  },
  draftHeader: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.78rem",
    fontWeight: 800,
    color: "#475569",
    textTransform: "uppercase",
  },
  draftPlaceholder: {
    fontSize: "0.78rem",
    color: "#94a3b8",
    textAlign: "center",
    margin: "auto",
    padding: "1rem",
  },
  draftList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxHeight: "150px",
    overflowY: "auto",
  },
  draftRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "2px 8px",
  },
  draftLabName: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#334155",
  },
  btnRemove: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
  },
  btnSave: {
    width: "100%",
    padding: "10px",
    background: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  btnSaveDisabled: {
    background: "#e2e8f0",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
};
