// src/features/assessment/assess-anthro/AnthroA1A5.tsx
// Extracted from AnthroDomain.tsx (Phase 3).
// Phase 4: uses MeasurementInput to eliminate repeated label+input+select boilerplate.
// Handles: A1-A3 Height/Weight/BMI/UBW, A4 Circumferences, A5 Skinfolds,
//          Fluid shift / EDW, Amputation toggles.

import React, { useMemo } from "react";
import { formatAge } from "../../../shared/utils/date";
import { MeasurementInput } from "../../../shared/ui/MeasurementInput";
import type { Anthro } from "../../../types";

const AMPUTATION_DATA = [
  { label: "Hand",             pct: 0.7  },
  { label: "Forearm",          pct: 2.3  },
  { label: "Entire Arm",       pct: 5.0  },
  { label: "Foot",             pct: 1.5  },
  { label: "BKA (Below Knee)", pct: 5.9  },
  { label: "AKA (Above Knee)", pct: 11.0 },
  { label: "Entire Leg",       pct: 16.0 },
] as const;

interface AnthroA1A5Props {
  anthro: Anthro;
  setAnthro: (updates: Partial<Anthro>) => void;
  calculatedMetrics: any;
}

export default function AnthroA1A5({ anthro, setAnthro, calculatedMetrics }: AnthroA1A5Props) {
  const handleUpdate = (field: keyof Anthro, val: any) =>
    setAnthro({ [field]: val });

  const adjIbw = calculatedMetrics?.adjIbw;

  const wtChangeDetails = useMemo(() => {
    if (!anthro.wt || !anthro.ubw) return null;
    const current = Number(anthro.wt);
    const usual   = Number(anthro.ubw);
    if (usual <= 0) return null;

    const diff   = current - usual;
    const pct    = (diff / usual) * 100;
    const isLoss = diff < 0;
    const isSevere = isLoss && Math.abs(pct) >= 5.0;

    const timeStr =
      calculatedMetrics?.ubwTimeframeDays != null
        ? formatAge(calculatedMetrics.ubwTimeframeDays)
        : null;

    return { pctString: pct.toFixed(1), absPctString: Math.abs(pct).toFixed(1), isLoss, isSevere, timeStr };
  }, [anthro.wt, anthro.ubw, calculatedMetrics?.ubwTimeframeDays]);

  const toggleAmputation = (label: string) => {
    const current = anthro.amputations ?? [];
    handleUpdate(
      "amputations",
      current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label]
    );
  };

  return (
    <>
      {/* A1-A3: Height / Weight / BMI / UBW */}
      <div className="card">
        <h4 className="mb-1 flex-between">
          A1-A3: Height/Length, Weight, BMI, UBW
          <div style={{ display: "flex", gap: "8px" }}>
            <span
              className={`chip ${
                calculatedMetrics?.bmi !== "--" &&
                Number(calculatedMetrics?.bmi) < 18.5
                  ? "active-danger"
                  : "active"
              }`}
            >
              BMI: {calculatedMetrics?.bmi || "--"}
            </span>
            {wtChangeDetails && (
              <span
                className={`chip ${
                  wtChangeDetails.isLoss
                    ? wtChangeDetails.isSevere
                      ? "active-danger"
                      : "active-warning"
                    : "active"
                }`}
              >
                Δ Wt: {wtChangeDetails.pctString}%
                {wtChangeDetails.timeStr ? ` (${wtChangeDetails.timeStr})` : ""}
              </span>
            )}
          </div>
        </h4>

        <div className="grid-4-col">
          <MeasurementInput
            label="Height/Length"
            value={anthro.ht}
            onChange={(v) => handleUpdate("ht", v)}
            unit={anthro.htUnit}
            onUnitChange={(u) => handleUpdate("htUnit", u)}
            unitOptions={["cm", "in"]}
            unitWidth="80px"
          />
          <MeasurementInput
            label="Weight"
            value={anthro.wt}
            onChange={(v) => handleUpdate("wt", v)}
            unit={anthro.wtUnit}
            onUnitChange={(u) => handleUpdate("wtUnit", u)}
            unitOptions={["kg", "lbs"]}
          />
          <MeasurementInput
            label="UBW"
            value={anthro.ubw}
            onChange={(v) => handleUpdate("ubw", v)}
            placeholder="Adult Patients Only"
          />
          <div className="input-group">
            <label>UBW Date (for timeframe)</label>
            <input
              type="date"
              value={anthro.ubwDate}
              onChange={(e) => handleUpdate("ubwDate", e.target.value)}
            />
          </div>
        </div>

        {/* Fluid Shift & Amputation */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {/* Fluid shift */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div
                className="input-group"
                style={{ flexDirection: "row", alignItems: "center", gap: "8px", marginBottom: "12px" }}
              >
                <input
                  type="checkbox"
                  id="fluidShift"
                  checked={anthro.isFluidShift}
                  onChange={(e) => handleUpdate("isFluidShift", e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="fluidShift" style={{ margin: 0, fontWeight: 700, cursor: "pointer" }}>
                  [x] Fluid Shift / Renal Patient
                </label>
              </div>

              {anthro.isFluidShift && (
                <div
                  className="fade-in"
                  style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                >
                  <MeasurementInput
                    label="Estimated Dry Weight (EDW) / Target Weight"
                    value={anthro.edw}
                    onChange={(v) => handleUpdate("edw", v)}
                    placeholder="Target weight"
                    unit={anthro.edwUnit}
                    onUnitChange={(u) => handleUpdate("edwUnit", u)}
                    unitOptions={["kg", "lbs"]}
                  />
                  <p style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "4px" }}>
                    Overrides "Current Weight" for nutrition calculations (kcal/kg).
                  </p>
                </div>
              )}
            </div>

            {/* Amputations */}
            <div style={{ flex: 2, minWidth: "400px" }}>
              <label
                style={{
                  fontSize: "0.75rem", fontWeight: 800, color: "#64748b",
                  textTransform: "uppercase", marginBottom: "8px", display: "block",
                }}
              >
                Amputation / Body Segment Loss
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {AMPUTATION_DATA.map((amp) => (
                  <button
                    key={amp.label}
                    onClick={() => toggleAmputation(amp.label)}
                    className={`chip ${anthro.amputations?.includes(amp.label) ? "active" : ""}`}
                    style={{
                      cursor: "pointer", border: "1px solid #e2e8f0",
                      background: anthro.amputations?.includes(amp.label) ? "var(--primary)" : "white",
                    }}
                  >
                    {amp.label} ({amp.pct}%)
                  </button>
                ))}
              </div>
              {adjIbw && (
                <div className="mt-1" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
                  Estimated/Adjusted IBW:{" "}
                  <span style={{ color: "#2ab3a3" }}>{adjIbw}kg</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* A4: Circumferences */}
      <div className="card">
        <h4 className="mb-1 flex-between">
          A4: Circumferences
          <select
            style={{ width: "80px", padding: "4px" }}
            value={anthro.circUnit}
            onChange={(e) => handleUpdate("circUnit", e.target.value)}
          >
            <option>cm</option>
            <option>in</option>
          </select>
        </h4>
        <div className="grid-4-col">
          <MeasurementInput label="Waist"        value={anthro.waist} onChange={(v) => handleUpdate("waist", v)} />
          <MeasurementInput label="Mid-Arm (MAC)" value={anthro.mac}   onChange={(v) => handleUpdate("mac", v)} />
          <MeasurementInput label="Calf"          value={anthro.calf}  onChange={(v) => handleUpdate("calf", v)} />
          <MeasurementInput label="Head"          value={anthro.head}  onChange={(v) => handleUpdate("head", v)} />
        </div>
      </div>

      {/* A5: Skinfolds */}
      <div className="card">
        <h4 className="mb-1 flex-between">
          A5: Skinfold Thickness
          <select
            style={{ width: "80px", padding: "4px" }}
            value={anthro.skinfoldUnit}
            onChange={(e) => handleUpdate("skinfoldUnit", e.target.value)}
          >
            <option>mm</option>
            <option>cm</option>
          </select>
        </h4>
        <div className="grid-4-col">
          <MeasurementInput label="Triceps"      value={anthro.triceps}     onChange={(v) => handleUpdate("triceps", v)} />
          <MeasurementInput label="Subscapular"  value={anthro.subscapular} onChange={(v) => handleUpdate("subscapular", v)} />
          <MeasurementInput label="Suprailiac"   value={anthro.suprailiac}  onChange={(v) => handleUpdate("suprailiac", v)} />
          <MeasurementInput label="Thigh"        value={anthro.thigh}       onChange={(v) => handleUpdate("thigh", v)} />
        </div>
      </div>
    </>
  );
}