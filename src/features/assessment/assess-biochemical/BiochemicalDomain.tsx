// src/features/assessment/assess-biochemical/BiochemicalDomain.tsx
import React from "react";
import { useLabsStore, sortColumns } from "../../../stores/useLabsStore";
import { GLOBAL_LAB_CATALOG } from "../../../shared/data/biochemicalCatalog";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import LabPresetToolbar from "./LabPresetToolbar";

export default function BiochemicalDomain() {
  const {
    labs,
    columns,
    activeLabKeys,
    updateLabValue,
    addColumnLeft,
    addColumnRight,
    removeColumn,
    updateColumnDate,
    updateColumnTime,
    removeLabFromView,
  } = useLabsStore();

  const sortedColumns = sortColumns(columns);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} className="fade-in">
      <DomainHeader title="Biochemical Data" />
      <LabPresetToolbar />

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeLabKeys.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
            <table className="lab-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th style={firstThStyle}>Lab Test</th>
                  {sortedColumns.map((column, colIndex) => {
                    return (
                      <th key={column.id} style={thStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center", width: "100%" }}>
                          <input
                            type="date"
                            value={column.date}
                            onChange={(e) => updateColumnDate(column.id, e.target.value)}
                            style={headerInputStyle}
                            aria-label={`Column ${colIndex + 1} date`}
                          />
                          <input
                            type="time"
                            value={column.time}
                            onChange={(e) => updateColumnTime(column.id, e.target.value)}
                            style={headerInputStyle}
                            aria-label={`Column ${colIndex + 1} time`}
                          />
                        </div>

                        {columns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColumn(column.id)}
                            style={deleteColBtnStyle}
                            title="Delete column"
                            aria-label={`Delete column ${colIndex + 1}`}
                          >
                            ×
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => addColumnLeft(column.id)}
                          style={{ ...addBtnStyle, left: "-10px" }}
                          title="Add column left"
                          aria-label="Add column left"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => addColumnRight(column.id)}
                          style={{ ...addBtnStyle, right: "-10px" }}
                          title="Add column right"
                          aria-label="Add column right"
                        >
                          +
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeLabKeys.map((slug, rowIndex) => {
                  const entry = labs[slug];
                  const catalog = GLOBAL_LAB_CATALOG[slug];
                  const label = catalog?.name ?? entry?.loincName ?? slug;
                  const unit = entry?.unit || catalog?.defaultUnit || "";
                  const placeholder = unit ? `-- ${unit}` : "--";

                  return (
                    <tr key={slug} style={trStyle}>
                      <td style={firstTdStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={cellLabelStyle}>{label}</span>
                            {unit && <span style={cellUnitStyle}>{unit}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLabFromView(slug)}
                            style={removeBtnStyle}
                            title={`Remove ${label} from view`}
                            aria-label={`Remove ${label}`}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                      {sortedColumns.map((column) => {
                        const colIndex = sortedColumns.findIndex((c) => c.id === column.id);
                        const tabIndex = colIndex * activeLabKeys.length + rowIndex + 1;
                        const val = entry?.values?.[column.id] ?? "";

                        return (
                          <td key={column.id} style={tdStyle}>
                            <input
                              type="text"
                              tabIndex={tabIndex}
                              placeholder={placeholder}
                              value={val}
                              onChange={(e) => updateLabValue(slug, column.id, e.target.value)}
                              style={cellInputStyle}
                              aria-label={`${label} value for column ${colIndex + 1}`}
                            />
                          </td>
                        );
                      })}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  position: "relative",
  padding: "12px 14px",
  background: "var(--card-bg, #ffffff)",
  border: "1px solid var(--border-color, #e2e8f0)",
  minWidth: "140px",
  verticalAlign: "middle",
};

const firstThStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 4,
  background: "var(--card-bg, #ffffff)",
  border: "1px solid var(--border-color, #e2e8f0)",
  textAlign: "left",
  padding: "12px 8px",
  minWidth: "180px",
  boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
};

const headerInputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  fontSize: "0.75rem",
  textAlign: "center",
  outline: "none",
  padding: "2px 4px",
  color: "var(--text-main, #334155)",
  fontFamily: "inherit",
};

const deleteColBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "2px",
  right: "2px",
  background: "none",
  border: "none",
  color: "var(--text-muted, #94a3b8)",
  cursor: "pointer",
  fontSize: "12px",
  lineHeight: 1,
  padding: "2px",
  borderRadius: "4px",
  zIndex: 3,
};

const addBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "var(--bg-color, #f8fafc)",
  color: "var(--text-main, #334155)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold",
  lineHeight: 1,
  padding: 0,
  zIndex: 3,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--border-color, #e2e8f0)",
};

const firstTdStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 2,
  background: "var(--card-bg, #ffffff)",
  border: "1px solid var(--border-color, #e2e8f0)",
  padding: "8px 12px",
  boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
};

const tdStyle: React.CSSProperties = {
  padding: 0,
  border: "1px solid var(--border-color, #e2e8f0)",
  textAlign: "center",
};

const cellInputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "8px",
  boxSizing: "border-box",
  textAlign: "center",
  outline: "none",
  fontSize: "0.85rem",
  color: "var(--text-main)",
};

const cellLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.82rem",
  color: "var(--text-main)",
};

const cellUnitStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  color: "var(--text-muted)",
  marginTop: "1px",
};

const removeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted, #94a3b8)",
  fontSize: "1.1rem",
  cursor: "pointer",
  lineHeight: 1,
  padding: "0 4px",
  borderRadius: "4px",
};
