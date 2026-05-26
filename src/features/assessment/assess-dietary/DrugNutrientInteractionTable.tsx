// src/features/assessment/assess-dietary/DrugNutrientInteractionTable.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Skeleton component for Drug-Nutrient Interaction display.
//
// CURRENT STATE:  No interaction database exists yet.
//   • Renders the table structure with all four columns.
//   • Shows a prominent "Coming Soon" placeholder with design intent.
//   • Accepts `drugs` and `supplements` props so it is wired-ready the moment
//     a data source (local DB, API, or hand-curated JSON) becomes available.
//   • Export `DrugNutrientRow` interface so future data files can type-check.
//
// FUTURE WIRING (when data exists):
//   1. Populate INTERACTION_DB (or fetch/query it) with DrugNutrientRow entries.
//   2. Pass `drugs` (from clinical.medications) and
//      `supplements` (from dietary.supplements/herbalCAM) as string arrays.
//   3. The lookup function `findInteractions()` will filter and return matches.
//   4. Remove the `SKELETON_MODE` flag.
//
// USAGE (in DietaryDomain.tsx, case "D4", after D44):
//   <DrugNutrientInteractionTable
//     drugs={[]}
//     supplements={[]}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from "react";

// ── Public types ──────────────────────────────────────────────────────────────

export interface DrugNutrientRow {
  /** Generic or brand drug name — matched against patient's drug list */
  drug: string;
  /** Nutrient or supplement name — matched against patient's supplement list */
  nutrient: string;
  /**
   * Clinical problem / mechanism.
   * e.g. "Methotrexate inhibits dihydrofolate reductase, depleting folate stores."
   */
  problem: string;
  /**
   * Dietitian recommendation / monitoring note.
   * e.g. "Monitor serum folate; consider supplementation per MD guidance."
   */
  recommendation: string;
  /**
   * Optional severity tag for row highlight.
   * "high"   → red left-border
   * "medium" → amber left-border
   * "low"    → blue left-border (default)
   */
  severity?: "high" | "medium" | "low";
}

// ── Stub database — replace with real data when available ─────────────────────
// Keep this as a separate constant so it can later be imported from a
// dedicated data file (e.g. src/shared/data/drugNutrientInteractions.ts).

export const INTERACTION_DB: DrugNutrientRow[] = [
  // ── Example rows (commented out — uncomment when data is confirmed) ────────
  // {
  //   drug: "methotrexate",
  //   nutrient: "folate",
  //   problem: "Methotrexate competitively inhibits dihydrofolate reductase, reducing active folate and increasing homocysteine.",
  //   recommendation: "Monitor serum folate and homocysteine. Folic acid supplementation (1 mg/day) is common; consult prescriber before initiating.",
  //   severity: "high",
  // },
  // {
  //   drug: "warfarin",
  //   nutrient: "vitamin k",
  //   problem: "Vitamin K directly antagonises warfarin's anticoagulant mechanism. Inconsistent intake destabilises INR.",
  //   recommendation: "Encourage consistent (not zero) vitamin K intake. Counsel on high-K foods (leafy greens). Monitor INR with dietary changes.",
  //   severity: "high",
  // },
];

// ── Lookup function (ready for data) ─────────────────────────────────────────

function findInteractions(
  drugs: string[],
  supplements: string[]
): DrugNutrientRow[] {
  if (INTERACTION_DB.length === 0) return [];

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const tokens = [
    ...drugs.map(normalize),
    ...supplements.map(normalize),
  ].filter(Boolean);

  if (tokens.length === 0) return [];

  return INTERACTION_DB.filter(row => {
    const d = normalize(row.drug);
    const n = normalize(row.nutrient);
    return tokens.some(t => d.includes(t) || t.includes(d) || n.includes(t) || t.includes(n));
  });
}

// ── Severity styling ──────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  NonNullable<DrugNutrientRow["severity"]>,
  { borderColor: string; badgeBg: string; badgeColor: string; label: string }
> = {
  high:   { borderColor: "#e74c3c", badgeBg: "#fef2f2", badgeColor: "#b91c1c", label: "High" },
  medium: { borderColor: "#da7f2b", badgeBg: "#fffbeb", badgeColor: "#92400e", label: "Moderate" },
  low:    { borderColor: "#3498db", badgeBg: "#eff6ff", badgeColor: "#1d4ed8", label: "Low" },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface DrugNutrientInteractionTableProps {
  /**
   * List of drug name strings from the patient's medication record.
   * Pass parsed names from clinical.medications, or an empty array.
   */
  drugs?: string[];
  /**
   * List of supplement/nutrient name strings from D44.
   * Pass parsed names from dietary.supplements, or an empty array.
   */
  supplements?: string[];
}

export default function DrugNutrientInteractionTable({
  drugs = [],
  supplements = [],
}: DrugNutrientInteractionTableProps) {
  const SKELETON_MODE = INTERACTION_DB.length === 0;

  const interactions = useMemo(
    () => findInteractions(drugs, supplements),
    [drugs, supplements]
  );

  const hasInputs = drugs.length > 0 || supplements.length > 0;

  return (
    <div
      className="card"
      style={{ marginTop: "0.75rem" }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.65rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--primary)" }}>
            Drug–Nutrient Interactions
          </h4>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
            }}
          >
            Auto-populated from Medications (C3) and Supplements (D43, D44)
          </p>
        </div>

        {/* Status badge */}
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "3px 10px",
            borderRadius: "10px",
            background: SKELETON_MODE ? "#f1f5f9" : "#f0fdf4",
            color:      SKELETON_MODE ? "#94a3b8" : "#166534",
            border:     `1px solid ${SKELETON_MODE ? "#e2e8f0" : "#bbf7d0"}`,
          }}
        >
          {SKELETON_MODE ? "No data source connected" : `${INTERACTION_DB.length} interactions indexed`}
        </span>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.82rem",
            tableLayout: "auto",
          }}
        >
          {/* Column width hints — Drug and Nutrient flex, Problem and Recommendation wrap */}
          <colgroup>
            <col style={{ width: "18%", maxWidth: "180px" }} />
            <col style={{ width: "15%", maxWidth: "160px" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "auto" }} />
          </colgroup>

          <thead>
            <tr style={{ background: "#f7fafc" }}>
              {[
                { label: "Drug",            tip: "Medication or supplement name" },
                { label: "Nutrient",        tip: "Affected nutrient or food component" },
                { label: "Problem",         tip: "Clinical mechanism or concern" },
                { label: "Recommendation",  tip: "Dietitian monitoring or action note" },
              ].map(col => (
                <th
                  key={col.label}
                  title={col.tip}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    color: "#718096",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "2px solid #e2e8f0",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ── Active data rows (shown when DB is populated) ── */}
            {!SKELETON_MODE && interactions.length > 0
              ? interactions.map((row, i) => {
                  const sev = SEVERITY_STYLES[row.severity ?? "low"];
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        borderLeft: `3px solid ${sev.borderColor}`,
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      {/* Drug */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontWeight: 700,
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "180px",
                          verticalAlign: "top",
                        }}
                        title={row.drug}
                      >
                        {row.drug}
                      </td>

                      {/* Nutrient */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          color: "#475569",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "160px",
                          verticalAlign: "top",
                        }}
                        title={row.nutrient}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            background: sev.badgeBg,
                            color: sev.badgeColor,
                            borderRadius: "4px",
                            padding: "1px 6px",
                            fontSize: "0.75rem",
                          }}
                        >
                          {row.nutrient}
                        </span>
                      </td>

                      {/* Problem — wraps */}
                      <td
                        style={{
                          padding: "8px 12px",
                          color: "#374151",
                          lineHeight: 1.5,
                          verticalAlign: "top",
                        }}
                      >
                        {row.problem}
                      </td>

                      {/* Recommendation — wraps */}
                      <td
                        style={{
                          padding: "8px 12px",
                          color: "#374151",
                          lineHeight: 1.5,
                          verticalAlign: "top",
                        }}
                      >
                        {row.recommendation}
                      </td>
                    </tr>
                  );
                })
              : null}

            {/* ── No matches found (DB exists but nothing matched) ── */}
            {!SKELETON_MODE && interactions.length === 0 && hasInputs && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "1.25rem 1rem",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    fontStyle: "italic",
                    background: "#fafafa",
                  }}
                >
                  No known interactions found for the entered drugs and supplements.
                </td>
              </tr>
            )}

            {/* ── Skeleton placeholder rows ── */}
            {SKELETON_MODE && (
              <>
                {/* Ghost rows to communicate table structure */}
                {[1, 2, 3].map(n => (
                  <tr
                    key={`ghost-${n}`}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      borderLeft: "3px solid #e2e8f0",
                      opacity: 1 - n * 0.22,
                    }}
                  >
                    <td style={ghostCellStyle}>
                      <div style={{ ...ghostBar, width: `${55 + n * 10}%` }} />
                    </td>
                    <td style={ghostCellStyle}>
                      <div style={{ ...ghostBar, width: `${45 + n * 8}%`, background: "#e9f0fb" }} />
                    </td>
                    <td style={ghostCellStyle}>
                      <div style={{ ...ghostBar, width: "90%" }} />
                      <div style={{ ...ghostBar, width: "65%", marginTop: "5px" }} />
                    </td>
                    <td style={ghostCellStyle}>
                      <div style={{ ...ghostBar, width: "85%" }} />
                      <div style={{ ...ghostBar, width: "50%", marginTop: "5px" }} />
                    </td>
                  </tr>
                ))}

                {/* Overlay call-to-action */}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "1.25rem 1rem",
                      background: "linear-gradient(to bottom, rgba(247,250,252,0.6), #f7fafc)",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      {/* Icon */}
                      <span
                        style={{
                          fontSize: "1.4rem",
                          lineHeight: 1,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        🔬
                      </span>

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: "#334155",
                            marginBottom: "3px",
                          }}
                        >
                          Interaction database not yet connected
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            lineHeight: 1.6,
                            maxWidth: "560px",
                          }}
                        >
                          When a data source is available, this table will automatically
                          cross-reference the drugs and supplements entered in C3, D43, D44
                          above and surface relevant interactions here — drug name,
                          affected nutrient, clinical mechanism, and dietitian
                          recommendation. No manual lookup required.
                        </div>

                        {/* Future data-source callouts */}
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "8px",
                          }}
                        >
                          {[
                            "Hand-curated JSON",
                            "NIH ODS database",
                            "Natural Medicines",
                            "Custom SQLite table",
                          ].map(src => (
                            <span
                              key={src}
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                color: "#64748b",
                                background: "#f1f5f9",
                                border: "1px dashed #cbd5e1",
                                borderRadius: "8px",
                                padding: "2px 8px",
                              }}
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            )}

            {/* ── Empty state: no drugs/supplements entered yet ── */}
            {!SKELETON_MODE && !hasInputs && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "0.78rem",
                    fontStyle: "italic",
                  }}
                >
                  Enter medications and supplements in C3, D43, D44 to check for interactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Legend (shown only when DB is live and has results) ── */}
      {!SKELETON_MODE && interactions.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "14px",
            marginTop: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          {(["high", "medium", "low"] as const).map(sev => {
            const s = SEVERITY_STYLES[sev];
            return (
              <div
                key={sev}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.68rem",
                  color: "#4a5568",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: s.borderColor,
                  }}
                />
                {s.label} significance
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Ghost-row styles (skeleton) ───────────────────────────────────────────────

const ghostCellStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
};

const ghostBar: React.CSSProperties = {
  height: "10px",
  borderRadius: "4px",
  background: "#edf2f7",
};