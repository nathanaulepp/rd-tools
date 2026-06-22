// src/features/assessment/assess-anthro/AnthroA8.tsx
// Phase 5: Reads useAnthroStore directly. No props.

import React from "react";
import { AlertBanner } from "../../../shared/ui/AlertBanner";
import { useAnthroStore } from "../../../stores/useAnthroStore";
import type { DexaScan } from "../../../types";

export default function AnthroA8() {
  const { dexaScans, setDexaScans } = useAnthroStore();

  const addDexaScan = () =>
    setDexaScans([
      ...dexaScans,
      { id: Date.now(), date: "", bmd: "", fatMass: "", leanMass: "", bodyFatPct: "" },
    ]);

  const updateDexa = (id: number, field: keyof DexaScan, val: string) =>
    setDexaScans(
      dexaScans.map((scan) => (scan.id === id ? { ...scan, [field]: val } : scan))
    );

  return (
    <div className="card">
      <h4 className="mb-1">Body Composition (DEXA)</h4>
      <div className="mt-1">
        {dexaScans.length >= 2 && (
          <AlertBanner
            type="warning"
            message={`Trend Alert: Lean Delta is ${
              Number(dexaScans[dexaScans.length - 1].leanMass) -
              Number(dexaScans[dexaScans.length - 2].leanMass)
            } kg`}
          />
        )}

        {dexaScans.map((scan, i) => (
          <div
            key={scan.id}
            style={{
              background: "white",
              padding: "1rem",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            <h5>Scan #{i + 1}</h5>
            <div className="grid-4-col">
              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  value={scan.date}
                  onChange={(e) => updateDexa(scan.id, "date", e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Total Fat Mass (kg)</label>
                <input
                  type="number"
                  value={scan.fatMass}
                  onChange={(e) => updateDexa(scan.id, "fatMass", e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Total Lean Mass (kg)</label>
                <input
                  type="number"
                  value={scan.leanMass}
                  onChange={(e) => updateDexa(scan.id, "leanMass", e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Whole-body BMD</label>
                <input
                  type="number"
                  value={scan.bmd}
                  onChange={(e) => updateDexa(scan.id, "bmd", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <button className="btn-outline" onClick={addDexaScan}>
          + Add DEXA Scan
        </button>
      </div>
    </div>
  );
}