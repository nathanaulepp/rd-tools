// src/features/assessment/assess-anthro/GrowthVelocityTable.tsx
// Drop-in replacement / addition for the A6 section.
// Auto-calculates growth velocity from A1-A6 inputs; no generate button needed.

import React, { useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GrowthVelocityTableProps {
  anthro: any;
  patientData: any;
  calculatedMetrics: any;
  units?: "metric" | "imperial";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const num = (v: any) => (typeof v === "string" ? parseFloat(v) : v) || 0;

function daysBetween(dateA: string, dateB: string): number | null {
  if (!dateA || !dateB) return null;
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  const diff = (b - a) / (1000 * 60 * 60 * 24);
  return isNaN(diff) || diff <= 0 ? null : diff;
}

function toKg(val: number, unit: string) {
  if (unit === "lbs") return val / 2.2046;
  if (unit === "g") return val / 1000;
  if (unit === "oz") return val / 35.274;
  return val; // kg
}

function toCm(val: number, unit: string) {
  if (unit === "in") return val * 2.54;
  return val; // cm
}

/** Format a velocity number nicely: show 2 sig figs, handle very small/large. */
function fmt(v: number | null, digits = 2): string {
  if (v === null || isNaN(v)) return "—";
  if (Math.abs(v) < 0.001) return "—";
  return v.toFixed(digits);
}
function convertVelocity(v: number | null, measureKey: "weightG" | "weightKg" | "length" | "head", imperial: boolean): number | null {
  if (v === null) return null;
  if (!imperial) return v;
  if (measureKey === "weightG")  return v / 28.3495;   // g → oz
  if (measureKey === "weightKg") return v * 2.2046;    // kg → lbs
  if (measureKey === "length")   return v / 2.54;      // cm → in
  if (measureKey === "head")     return v / 2.54;      // cm → in
  return v;
}

// ─── Clinical relevance map ───────────────────────────────────────────────────
// Returns "primary" | "secondary" | "rare" | "none" for each {measure, period, ageDays}
type Relevance = "primary" | "secondary" | "rare" | "none";

function relevance(measure: "weightG" | "weightKg" | "length" | "head", period: "day" | "week" | "month" | "year", ageDays: number | null): Relevance {
  const isInfant = ageDays !== null && ageDays <= 730;       // ≤ 2 yrs
  const isNICU   = ageDays !== null && ageDays <= 90;        // ≤ 3 mo
  const isPeds   = ageDays !== null && ageDays > 730;        // > 2 yrs

  switch (measure) {
    case "weightG":
      if (period === "day")   return isNICU ? "primary" : isInfant ? "secondary" : "none";
      if (period === "week")  return isNICU ? "secondary" : isInfant ? "secondary" : "none";
      return "none";

    case "weightKg":
      if (period === "day")   return "none";
      if (period === "week")  return isPeds ? "secondary" : "none";
      if (period === "month") return "primary"; // universal peds follow-up
      return "none";

    case "length":
      if (period === "month") return isInfant ? "primary" : "secondary";
      if (period === "year")  return "primary";
      return "none";

    case "head":
      if (period === "month") return isInfant ? "primary" : "none";
      if (period === "week")  return isNICU   ? "secondary" : "none";
      return "none";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrowthVelocityTable({ anthro, patientData, calculatedMetrics, units = "metric" }: GrowthVelocityTableProps) {
  const ageDays = calculatedMetrics?.ageDays ?? null;

  // ── Compute intervals and deltas ───────────────────────────────────────────
  const data = useMemo(() => {
    const noteDate = patientData?.noteDate;

    // Weight
    const wtDays  = daysBetween(anthro.past_wtDate, noteDate);
    const wtCurKg = toKg(num(anthro.wt), anthro.wtUnit || "kg");
    const wtPstKg = toKg(num(anthro.past_wt), anthro.past_wtUnit || "kg");
    const wtDeltaKg = (wtCurKg > 0 && wtPstKg > 0 && wtDays) ? wtCurKg - wtPstKg : null;

    // Length / Height
    const htDays  = daysBetween(anthro.past_htDate, noteDate);
    const htCurCm = toCm(num(anthro.ht), anthro.htUnit || "cm");
    const htPstCm = toCm(num(anthro.past_ht), anthro.past_htUnit || "cm");
    const htDeltaCm = (htCurCm > 0 && htPstCm > 0 && htDays) ? htCurCm - htPstCm : null;

    // Head circumference
    const hdDays  = daysBetween(anthro.past_headDate, noteDate);
    const hdCurCm = toCm(num(anthro.head), anthro.circUnit || "cm");
    const hdPstCm = toCm(num(anthro.past_head), anthro.past_headUnit || "cm");
    const hdDeltaCm = (hdCurCm > 0 && hdPstCm > 0 && hdDays) ? hdCurCm - hdPstCm : null;

    const velocity = (deltaKg: number | null, days: number | null, perDays: number, toG = false) => {
      if (deltaKg === null || days === null) return null;
      const v = (deltaKg / days) * perDays;
      return toG ? v * 1000 : v;
    };

    return {
      wtDays, htDays, hdDays,
      weightG: {
        day:   velocity(wtDeltaKg, wtDays, 1,   true),
        week:  velocity(wtDeltaKg, wtDays, 7,   true),
        month: velocity(wtDeltaKg, wtDays, 30.4375, true),
        year:  velocity(wtDeltaKg, wtDays, 365.25, true),
      },
      weightKg: {
        day:   velocity(wtDeltaKg, wtDays, 1),
        week:  velocity(wtDeltaKg, wtDays, 7),
        month: velocity(wtDeltaKg, wtDays, 30.4375),
        year:  velocity(wtDeltaKg, wtDays, 365.25),
      },
      length: {
        day:   velocity(htDeltaCm, htDays, 1),
        week:  velocity(htDeltaCm, htDays, 7),
        month: velocity(htDeltaCm, htDays, 30.4375),
        year:  velocity(htDeltaCm, htDays, 365.25),
      },
      head: {
        day:   velocity(hdDeltaCm, hdDays, 1),
        week:  velocity(hdDeltaCm, hdDays, 7),
        month: velocity(hdDeltaCm, hdDays, 30.4375),
        year:  velocity(hdDeltaCm, hdDays, 365.25),
      },
    };
  }, [
    anthro.wt, anthro.wtUnit, anthro.past_wt, anthro.past_wtUnit, anthro.past_wtDate,
    anthro.ht, anthro.htUnit, anthro.past_ht, anthro.past_htUnit, anthro.past_htDate,
    anthro.head, anthro.circUnit, anthro.past_head, anthro.past_headUnit, anthro.past_headDate,
    patientData?.noteDate,
  ]);

  // ── Rows definition ────────────────────────────────────────────────────────
  type MeasureKey = "weightG" | "weightKg" | "length" | "head";
  const imp = units === "imperial";
  const rows: { key: MeasureKey; label: string; unit: string; digits: number; hasData: boolean }[] = [
    { key: "weightG",  label: "Weight",          unit: imp ? "oz/period"  : "g/period",  digits: imp ? 2 : 1, hasData: data.wtDays !== null },
    { key: "weightKg", label: "Weight",          unit: imp ? "lbs/period" : "kg/period", digits: 3,           hasData: data.wtDays !== null },
    { key: "length",   label: "Length / Height", unit: imp ? "in/period"  : "cm/period", digits: 2,           hasData: data.htDays !== null },
    { key: "head",     label: "Head Circ.",       unit: imp ? "in/period"  : "cm/period", digits: 2,           hasData: data.hdDays !== null },
  ];

  const periods: { key: "day" | "week" | "month" | "year"; label: string }[] = [
    { key: "day",   label: "Per day"   },
    { key: "week",  label: "Per week"  },
    { key: "month", label: "Per month" },
    { key: "year",  label: "Per year"  },
  ];

  // ── Interval description display ──────────────────────────────────────────
  const intervalLabel = (days: number | null) => {
    if (!days) return null;
    if (days < 7) return `${Math.round(days)}d interval`;
    if (days < 60) return `${(days / 7).toFixed(1)}wk interval`;
    if (days < 720) return `${(days / 30.4375).toFixed(1)}mo interval`;
    return `${(days / 365.25).toFixed(1)}yr interval`;
  };

  // ── Missing data detection ─────────────────────────────────────────────────
  const anyData = data.wtDays !== null || data.htDays !== null || data.hdDays !== null;

  const missingParts: string[] = [];
  if (!patientData?.noteDate) missingParts.push("Note Date");
  if (!anthro.wt || !anthro.past_wt || !anthro.past_wtDate) missingParts.push("Weight (current + past + past date)");
  if (!anthro.ht || !anthro.past_ht || !anthro.past_htDate) missingParts.push("Length/Height (current + past + past date)");
  if (!anthro.head || !anthro.past_head || !anthro.past_headDate) missingParts.push("Head Circumference (current + past + past date)");

  // ── Cell style ─────────────────────────────────────────────────────────────
  const cellStyle = (rel: Relevance, hasValue: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: "6px 10px",
      fontSize: "0.78rem",
      textAlign: "center",
      borderBottom: "1px solid #e2e8f0",
      verticalAlign: "middle",
      whiteSpace: "nowrap",
    };

    if (!hasValue) return { ...base, color: "#a0aec0" };

    switch (rel) {
      case "primary":   return { ...base, fontWeight: 700 };
      case "secondary": return { ...base, fontWeight: 600, color: "#4a5568" };
      case "rare":      return { ...base, color: "#718096" };
      case "none":      return { ...base, color: "#cbd5e0", fontStyle: "italic" };
    }
  };

  const badgeStyle = (rel: Relevance): React.CSSProperties | undefined => {
    if (rel === "primary")   return { display: "inline-block", fontSize: "0.6rem", marginLeft: "4px", background: "#e2e8f0", color: "#4a5568", borderRadius: "8px", padding: "1px 5px", verticalAlign: "middle" };
    if (rel === "secondary") return { display: "inline-block", fontSize: "0.6rem", marginLeft: "4px", background: "#edf2f7", color: "#718096", borderRadius: "8px", padding: "1px 5px", verticalAlign: "middle" };
    return undefined;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="card mt-2" style={{ marginTop: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--primary)" }}>
            A6: Pediatric Growth Velocity Index
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Calculated automatically from A1–A6 inputs · Updates live as you edit
          </p>
        </div>

        {/* Interval chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { label: "Wt", days: data.wtDays },
            { label: "Ht", days: data.htDays },
            { label: "HC", days: data.hdDays },
          ].map(({ label, days }) =>
            days ? (
              <span key={label} style={{ fontSize: "0.68rem", background: "#edf2f7", color: "#4a5568", borderRadius: "8px", padding: "2px 8px", fontWeight: 600 }}>
                {label}: {intervalLabel(days)}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {[
          { weight: 700, label: "Standard / gold standard" },
          { weight: 600, label: "Common in practice" },
          { weight: 400, label: "Not clinically used", muted: true },
        ].map(({ weight, label, muted }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: muted ? "#a0aec0" : "#4a5568", fontWeight: weight }}>
            {label}
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: "0.72rem", color: "#718096", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>
                Measurement
              </th>
              <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "0.72rem", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #e2e8f0" }}>Unit</th>
              {periods.map(p => (
                <th key={p.key} style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, fontSize: "0.72rem", color: "#4a5568", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.key} style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                {/* Measurement label */}
                <td style={{ padding: "6px 12px", fontWeight: 600, fontSize: "0.8rem", color: "var(--primary)", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                  {row.label}
                </td>
                {/* Unit */}
                <td style={{ padding: "6px 10px", textAlign: "center", fontSize: "0.72rem", color: "#718096", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                  {row.unit}
                </td>
                {/* Value cells */}
                {periods.map(p => {
                  const rel = relevance(row.key, p.key, ageDays);
                  const rawVal = data[row.key][p.key];
                  const hasValue = rawVal !== null && row.hasData;
                  const converted = convertVelocity(rawVal, row.key, imp);
                  const displayVal = hasValue ? fmt(converted, row.digits) : rel === "none" ? "✕" : "—";

                  return (
                    <td key={p.key} style={cellStyle(rel, hasValue)}>
                      {displayVal}
                      {hasValue && (rel === "primary" || rel === "secondary") && (
                        <span style={badgeStyle(rel)}>
                          {rel === "primary" ? "★" : "●"}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Missing data notice */}
      {!anyData && (
        <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          Enter current measurements (A1–A3), past measurements and dates (A6 above), and Note Date in the Patient Header to populate this table.
        </p>
      )}
      {anyData && missingParts.length > 0 && (
        <p style={{ marginTop: "0.6rem", fontSize: "0.7rem", color: "#a0aec0" }}>
          ⚠ Partial data — rows showing "—" need: {missingParts.filter(m => {
            if (m.startsWith("Weight") && data.wtDays !== null) return false;
            if (m.startsWith("Length") && data.htDays !== null) return false;
            if (m.startsWith("Head") && data.hdDays !== null) return false;
            if (m === "Note Date") return false;
            return true;
          }).join("; ")}
        </p>
      )}

      {/* Footnote */}
      <p style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: "#a0aec0", marginBottom: 0 }}>
        Velocities extrapolated linearly from the interval between past measurement date and Note Date.
        Bold = standard clinical metric for this age. Medium weight = commonly used. Grey ✕ = not clinically applied.
        Age used for highlighting: {ageDays !== null ? `${(ageDays / 30.4375).toFixed(1)} months` : "unknown"}.
      </p>
    </div>
  );
}