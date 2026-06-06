// src/features/assessment/assess-biochemical/BiochemicalDomain.tsx
// Phase 3 overhaul: pure layout shell — dynamic canvas replacing static panels.
//
// Responsibilities:
//   - Render LabPresetToolbar (search + preset controls)
//   - Render the dynamic lab table from activeLabKeys
//   - Keyboard tabIndex ergonomics: Historical → Current per row
//   - Remove row button per entry
//
// All state comes from useLabsStore — zero props.

import React, { useEffect } from "react";
import { useLabsStore } from "../../../stores/useLabsStore";
import { useUIStore } from "../../../stores/useUIStore";
import { GLOBAL_LAB_CATALOG } from "../../../shared/data/biochemicalCatalog";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import LabPresetToolbar from "./LabPresetToolbar";

export default function BiochemicalDomain() {
  const { labs, activeLabKeys, updateLabField, removeLabFromView, loadDefaultPanel } =
    useLabsStore();
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  // ── Optional: wire sidebar B1–B9 clicks to panel auto-load ────────────────
  useEffect(() => {
    const panelMap: Record<string, string> = {
      B1: "Endocrine & Metabolic",
      B2: "Renal & Urinary",
      B3: "Chemistry & Electrolytes",
      B4: "Hematology & Iron",
      B5: "Hepatobiliary & Proteins",
      B6: "Micronutrient Status",
      B7: "Digestive & Pancreatic",
      B8: "Blood Gas & Acute Care",
      B9: "Physiological & Fluid",
    };
    const panel = panelMap[activeSubDomain];
    if (panel) loadDefaultPanel(panel);
  }, [activeSubDomain, loadDefaultPanel]);

  return (
    <div className="fade-in">
      <DomainHeader title="Biochemical Data" />

      <div className="card">
        <LabPresetToolbar />

        {activeLabKeys.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="table-container">
            <table className="lab-table" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "36%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Lab Test</th>
                  <th>Historical</th>
                  <th>Current</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {activeLabKeys.map((slug, rowIndex) => {
                  const entry   = labs[slug];
                  const catalog = GLOBAL_LAB_CATALOG[slug];
                  const label   = catalog?.name        ?? entry?.loincName ?? slug;
                  const unit    = entry?.unit           ?? catalog?.defaultUnit ?? "";
                  const placeholder = unit ? `-- ${unit}` : "--";

                  // tabIndex: historical = even, current = odd, flowing top-to-bottom
                  // then left-to-right within a row.
                  const tabHist = rowIndex * 2 + 1;
                  const tabCurr = rowIndex * 2 + 2;

                  return (
                    <tr key={slug}>
                      <td>
                        <span style={cellLabel}>{label}</span>
                        {unit && (
                          <span style={cellUnit}>{unit}</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          tabIndex={tabHist}
                          placeholder={placeholder}
                          value={entry?.historical ?? ""}
                          onChange={(e) =>
                            updateLabField(slug, "historical", e.target.value)
                          }
                          aria-label={`${label} historical value`}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          tabIndex={tabCurr}
                          placeholder={placeholder}
                          value={entry?.current ?? ""}
                          onChange={(e) =>
                            updateLabField(slug, "current", e.target.value)
                          }
                          aria-label={`${label} current value`}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => removeLabFromView(slug)}
                          style={removeBtn}
                          title={`Remove ${label} from view`}
                          aria-label={`Remove ${label}`}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "2.5rem 1rem",
        color: "var(--text-muted)",
        fontSize: "0.88rem",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧪</div>
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
        No labs active
      </div>
      <div>
        Use <strong>Load standard panel</strong> to add a clinical panel,
        or search above to add individual tests.
      </div>
    </div>
  );
}

// ── Inline styles (small, not worth a CSS class) ──────────────────────────────

const cellLabel: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.82rem",
  color: "var(--text-main)",
};

const cellUnit: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  color: "var(--text-muted)",
  marginTop: "1px",
};

const removeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  fontSize: "1rem",
  cursor: "pointer",
  lineHeight: 1,
  padding: "0 4px",
  borderRadius: "4px",
};
