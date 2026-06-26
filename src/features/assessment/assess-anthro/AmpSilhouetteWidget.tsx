// src/features/assessment/assess-anthro/AmpSilhouetteWidget.tsx
//
// Interactive body silhouette for amputation segment selection.
// Each segment has a clickable circle overlaid on an SVG body diagram.
// When selected, a micro-slider appears letting the clinician specify
// what fraction of that segment was actually removed (defaults to 100%).
//
// Calculation engine:
//   P_total_lost = Σ (segmentBasePct × segmentRemovedFraction)
//   intactWeight = bedScaleWeight / (1 - P_total_lost)
//
// Props / integration:
//   - Reads/writes anthro.amputations (string[]) for coarse compatibility
//   - Maintains its own local state for per-segment removal fractions
//     which get serialized into a rich format and stored via setAnthro
//   - The parent AnthroA1A7 passes setAnthro and anthro

import React, { useState, useCallback, useEffect } from "react";

// ─── Segment Definitions ──────────────────────────────────────────────────────
// cx/cy are percentages of the SVG viewBox (0–100)
// basePct is the Osterkamp segment body-mass percentage

interface SegmentDef {
  id: string;
  label: string;
  basePct: number;   // % of total body mass (Osterkamp table)
  cx: number;        // circle center X (% of viewBox width)
  cy: number;        // circle center Y (% of viewBox height)
  side: "left" | "right" | "center";
}

const SEGMENTS: SegmentDef[] = [
  // Upper limbs — right side (anatomical right = screen left for frontal view)
  { id: "r_hand",       label: "Right Hand",        basePct: 0.7,  cx: 20,   cy: 46,  side: "right" },
  { id: "r_forearm",    label: "Right Forearm",      basePct: 2.3,  cx: 24,   cy: 39,  side: "right" },
  { id: "r_upper_arm",  label: "Right Upper Arm",    basePct: 2.8,  cx: 30,   cy: 29,  side: "right" },
  // Upper limbs — left side
  { id: "l_hand",       label: "Left Hand",          basePct: 0.7,  cx: 80,   cy: 46,  side: "left"  },
  { id: "l_forearm",    label: "Left Forearm",        basePct: 2.3,  cx: 76,   cy: 39,  side: "left"  },
  { id: "l_upper_arm",  label: "Left Upper Arm",      basePct: 2.8,  cx: 69,   cy: 29,  side: "left"  },
  // Lower limbs — right
  { id: "r_foot",       label: "Right Foot",          basePct: 1.5,  cx: 34,   cy: 90,  side: "right" },
  { id: "r_lower_leg",  label: "Right Lower Leg",     basePct: 4.4,  cx: 37,   cy: 81,  side: "right" },
  { id: "r_upper_leg",  label: "Right Upper Leg",     basePct: 10.0, cx: 39,   cy: 65,  side: "right" },
  // Lower limbs — left
  { id: "l_foot",       label: "Left Foot",           basePct: 1.5,  cx: 66,   cy: 90,  side: "left"  },
  { id: "l_lower_leg",  label: "Left Lower Leg",      basePct: 4.4,  cx: 63,   cy: 81,  side: "left"  },
  { id: "l_upper_leg",  label: "Left Upper Leg",      basePct: 10.0, cx: 61,   cy: 65,  side: "left"  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SegmentSelection {
  id: string;
  removedFraction: number; // 0.0–1.0 (1.0 = entire segment removed)
}

// Serialized into anthro store as JSON string in a dedicated field
export interface AmpData {
  segments: SegmentSelection[];
  bedScaleWeight: string;
  bedScaleUnit: "kg" | "lbs";
}

interface Props {
  // Raw bed-scale weight from anthro
  wtKg: number;
  wtUnit: string;
  // Callback: receives total lost fraction [0,1] for display in parent
  onAmpDataChange?: (data: AmpData, intactWeightKg: number | null) => void;
  // Persisted amp data (parsed from store)
  initialData?: AmpData | null;
  initialSelections?: { id: string; removedFraction: number }[]; // NEW
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toKgLocal(val: number, unit: string): number {
  if (unit === "lbs") return val / 2.2046;
  if (unit === "g")   return val / 1000;
  if (unit === "oz")  return val / 35.274;
  return val;
}

function calcIntactWeight(
  bedScaleKg: number,
  selections: SegmentSelection[]
): number | null {
  if (bedScaleKg <= 0) return null;
  let totalLost = 0;
  for (const sel of selections) {
    const seg = SEGMENTS.find((s) => s.id === sel.id);
    if (seg) totalLost += (seg.basePct / 100) * sel.removedFraction;
  }
  const remainder = 1 - totalLost;
  if (remainder <= 0) return null;
  return bedScaleKg / remainder;
}

// ─── Sub-component: Segment Slider ────────────────────────────────────────────

interface SliderProps {
  seg: SegmentDef;
  fraction: number;
  onChange: (fraction: number) => void;
  onRemove: () => void;
}

const SegmentSlider: React.FC<SliderProps> = ({ seg, fraction, onChange, onRemove }) => {
  const pct = Math.round(fraction * 100);
  const massLost = ((seg.basePct * fraction)).toFixed(2);

  return (
    <div style={{
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "8px",
      padding: "10px 12px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      minWidth: "200px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e40af" }}>
          {seg.label}
        </span>
        <button
          onClick={onRemove}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", fontSize: "0.75rem", padding: "0 2px",
            lineHeight: 1,
          }}
          title="Remove segment"
        >
          ✕
        </button>
      </div>

      {/* Slider row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", width: "20px" }}>0%</span>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="range"
            min={1}
            max={100}
            value={pct}
            onChange={(e) => onChange(parseInt(e.target.value) / 100)}
            style={{
              width: "100%",
              accentColor: "#3b82f6",
              cursor: "pointer",
              height: "4px",
            }}
          />
        </div>
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", width: "24px", textAlign: "right" }}>100%</span>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: "0.8rem", fontWeight: 800, color: "#2563eb",
          fontVariantNumeric: "tabular-nums",
        }}>
          {pct}% removed
        </span>
        <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
          −{massLost}% body mass
        </span>
      </div>

      {/* Visual bar */}
      <div style={{
        height: "4px", background: "#dbeafe", borderRadius: "2px", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
          borderRadius: "2px",
          transition: "width 0.1s ease",
        }} />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const AmpSilhouetteWidget: React.FC<Props> = ({
  wtKg,
  wtUnit,
  onAmpDataChange,
  initialData,
  initialSelections,
}) => {
  const [selections, setSelections] = useState<SegmentSelection[]>(
    initialSelections && initialSelections.length > 0
      ? initialSelections
      : (initialData?.segments ?? [])
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync to parent on every change
  useEffect(() => {
    const bedScaleKg = toKgLocal(wtKg, wtUnit);
    const intact = calcIntactWeight(bedScaleKg, selections);
    const data: AmpData = {
      segments: selections,
      bedScaleWeight: String(wtKg),
      bedScaleUnit: wtUnit as "kg" | "lbs",
    };
    onAmpDataChange?.(data, intact);
  }, [selections, wtKg, wtUnit]);

  const toggleSegment = useCallback((id: string) => {
    const exists = selections.find((s) => s.id === id);
    if (exists) {
      // If clicking already-selected → toggle slider panel
      setActiveId((prev) => (prev === id ? null : id));
    } else {
      // New selection — add with full removal default
      setSelections((prev) => [...prev, { id, removedFraction: 1.0 }]);
      setActiveId(id);
    }
  }, [selections]);

  const removeSegment = useCallback((id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const updateFraction = useCallback((id: string, fraction: number) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, removedFraction: fraction } : s))
    );
  }, []);

  // Derived stats
  const bedScaleKg = toKgLocal(wtKg, wtUnit);
  let totalLostPct = 0;
  for (const sel of selections) {
    const seg = SEGMENTS.find((s) => s.id === sel.id);
    if (seg) totalLostPct += seg.basePct * sel.removedFraction;
  }
  const intactKg = calcIntactWeight(bedScaleKg, selections);
  const intactLbs = intactKg !== null ? intactKg * 2.2046 : null;

  const activeSelection = activeId ? selections.find((s) => s.id === activeId) : null;
  const activeSeg = activeId ? SEGMENTS.find((s) => s.id === activeId) : null;

  // Sort selected segments for display table
  const selectedSegs = SEGMENTS.filter((s) => selections.find((sel) => sel.id === s.id));

  return (
    <div style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "14px",
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
      alignItems: "flex-start",
    }}>

      {/* ── Left: SVG Silhouette ──────────────────────────────────────────── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg
          viewBox="0 0 100 105"
          width="180"
          height="340"
          style={{ display: "block", overflow: "visible" }}
        >
          <g stroke="#94a3b8" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <circle cx="50" cy="10" r="6.5" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2" />
            {/* Neck */}
            <line x1="50" y1="16.5" x2="50" y2="21" />
            {/* Shoulders */}
            <line x1="50" y1="21" x2="32" y2="26" />
            <line x1="50" y1="21" x2="68" y2="26" />
            {/* Torso */}
            <line x1="50" y1="21" x2="50" y2="52" />
            {/* Right arm: shoulder → elbow → wrist */}
            <line x1="32" y1="26" x2="24" y2="40" />
            <line x1="24" y1="40" x2="19" y2="52" />
            {/* Left arm: shoulder → elbow → wrist */}
            <line x1="68" y1="26" x2="76" y2="40" />
            <line x1="76" y1="40" x2="81" y2="52" />
            {/* Hips */}
            <line x1="50" y1="52" x2="40" y2="55" />
            <line x1="50" y1="52" x2="60" y2="55" />
            {/* Right leg: hip → knee → ankle */}
            <line x1="40" y1="55" x2="38" y2="74" />
            <line x1="38" y1="74" x2="37" y2="90" />
            {/* Right foot */}
            <line x1="37" y1="90" x2="32" y2="93" />
            {/* Left leg: hip → knee → ankle */}
            <line x1="60" y1="55" x2="62" y2="74" />
            <line x1="62" y1="74" x2="63" y2="90" />
            {/* Left foot */}
            <line x1="63" y1="90" x2="68" y2="93" />
          </g>

          {/* Joint dots for orientation */}
          {[
            [32,26],[68,26],[24,40],[76,40],[40,55],[60,55],[38,74],[62,74]
          ].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="1.4" fill="#cbd5e1" stroke="none" />
          ))}

          {/* Interactive segment circles */}
          {SEGMENTS.map((seg) => {
            const isSelected = !!selections.find((s) => s.id === seg.id);
            const isActive = activeId === seg.id;
            const sel = selections.find((s) => s.id === seg.id);
            const frac = sel?.removedFraction ?? 1;

            return (
              <g
                key={seg.id}
                onClick={() => toggleSegment(seg.id)}
                style={{ cursor: "pointer" }}
              >
                {/* Hit area (invisible, larger than visual) */}
                <circle cx={seg.cx} cy={seg.cy} r="6" fill="transparent" />
                {/* Glow ring when active */}
                {isActive && (
                  <circle
                    cx={seg.cx} cy={seg.cy} r="5.8"
                    fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity="0.4"
                  />
                )}
                {/* Main circle */}
                <circle
                  cx={seg.cx} cy={seg.cy} r="4.2"
                  fill={isSelected ? "#3b82f6" : "#fff"}
                  stroke={isSelected ? "#1d4ed8" : "#94a3b8"}
                  strokeWidth={isSelected ? "1.4" : "1"}
                  style={{ transition: "all 0.12s ease" }}
                />
                {/* Fraction arc overlay — shows partial removal */}
                {isSelected && frac < 1 && (
                  <circle
                    cx={seg.cx} cy={seg.cy} r="4.2"
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="2"
                    strokeDasharray={`${frac * 26.39} 26.39`}
                    strokeDashoffset="6.6"
                    strokeLinecap="round"
                    transform={`rotate(-90 ${seg.cx} ${seg.cy})`}
                  />
                )}
                {/* Center dot */}
                <circle
                  cx={seg.cx} cy={seg.cy} r="1.3"
                  fill={isSelected ? "#fff" : "#cbd5e1"}
                  stroke="none"
                />
              </g>
            );
          })}
        </svg>

        <div style={{
          textAlign: "center", fontSize: "0.62rem", color: "#94a3b8", marginTop: "2px",
        }}>
          Tap a circle to mark a segment
        </div>
      </div>

      {/* ── Right: Sliders + Summary ──────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: "240px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Header */}
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e40af", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Osterkamp Weight Adjuster
          </div>
          <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "2px" }}>
            Select segments on the diagram. Slide to set resection level.
          </div>
        </div>

        {/* Segment sliders (only selected, ordered top → bottom) */}
        {selectedSegs.length === 0 ? (
          <div style={{
            padding: "20px 12px",
            border: "1px dashed #cbd5e1",
            borderRadius: "8px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "0.72rem",
          }}>
            No segments selected.<br />
            Tap a circle on the body diagram.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {selectedSegs.map((seg) => {
              const sel = selections.find((s) => s.id === seg.id)!;
              return (
                <SegmentSlider
                  key={seg.id}
                  seg={seg}
                  fraction={sel.removedFraction}
                  onChange={(f) => updateFraction(seg.id, f)}
                  onRemove={() => removeSegment(seg.id)}
                />
              );
            })}
          </div>
        )}

        {selections.length > 0 && (
          <div style={{
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Calculation Summary
            </div>

            {/* Table: segment | base% | removed% | lost% */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
              <thead>
                <tr>
                  {["Segment", "Base %", "Resected", "Mass Lost"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "3px 4px",
                      color: "#94a3b8", fontWeight: 600,
                      borderBottom: "1px solid #e2e8f0",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedSegs.map((seg) => {
                  const sel = selections.find((s) => s.id === seg.id)!;
                  const massLost = seg.basePct * sel.removedFraction;
                  return (
                    <tr key={seg.id}>
                      <td style={{ padding: "3px 4px", color: "#374151" }}>{seg.label}</td>
                      <td style={{ padding: "3px 4px", color: "#64748b" }}>{seg.basePct}%</td>
                      <td style={{ padding: "3px 4px", color: "#2563eb", fontVariantNumeric: "tabular-nums" }}>
                        {Math.round(sel.removedFraction * 100)}%
                      </td>
                      <td style={{ padding: "3px 4px", color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                        −{massLost.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Equation display */}
            <div style={{
              borderTop: "1px solid #e2e8f0", paddingTop: "8px",
              display: "flex", flexDirection: "column", gap: "4px",
            }}>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                P<sub>lost</sub> = {totalLostPct.toFixed(2)}% of body mass
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                Intact Wt = {bedScaleKg > 0 ? bedScaleKg.toFixed(1) : "?"} kg ÷ (1 − {(totalLostPct / 100).toFixed(4)})
              </div>

              {intactKg !== null ? (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#dbeafe", borderRadius: "6px", padding: "6px 10px",
                  marginTop: "2px",
                }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Est. Intact Weight
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e3a8a", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
                      {intactKg.toFixed(2)} kg
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>lbs</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1d4ed8" }}>
                      {(intactKg * 2.2046).toFixed(1)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "0.72rem", color: "#ef4444", fontStyle: "italic" }}>
                  Enter bed-scale weight (A1-A3) to calculate intact weight.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset */}
        {selections.length > 0 && (
          <button
            onClick={() => { setSelections([]); setActiveId(null); }}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              color: "#94a3b8",
              fontSize: "0.68rem",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            ↺ Clear all segments
          </button>
        )}
      </div>
    </div>
  );
};

export default AmpSilhouetteWidget;