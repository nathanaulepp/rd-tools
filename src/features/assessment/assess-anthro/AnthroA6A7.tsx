// src/features/assessment/assess-anthro/AnthroA6A7.tsx
// Extracted from AnthroDomain.tsx — handles A6 (Growth Velocity) and A7 (Growth Standards).

import React from "react";
import GrowthVelocityTable from "./GrowthVelocityTable";
import GrowthStandardsTable from "./GrowthStandardsTable";
import type { Anthro } from "../../../types";

interface AnthroA6A7Props {
  anthro: Anthro;
  setAnthro: (updates: Partial<Anthro>) => void;
  patientData: any;
  calculatedMetrics: any;
}

export default function AnthroA6A7({
  anthro,
  setAnthro,
  patientData,
  calculatedMetrics,
}: AnthroA6A7Props) {
  const handleUpdate = (field: keyof Anthro, val: any) =>
    setAnthro({ [field]: val });

  return (
    <>
      <div className="card">
        <h4 className="mb-1">A6: Growth Velocity (Pediatrics)</h4>
        <div className="grid-3-col">
          <div className="input-group">
            <label>Past Height/Length</label>
            <div className="input-group-row" style={{ marginBottom: "0.5rem" }}>
              <input
                type="number"
                value={anthro.past_ht}
                onChange={(e) => handleUpdate("past_ht", e.target.value)}
              />
              <select
                style={{ width: "70px" }}
                value={anthro.past_htUnit}
                onChange={(e) => handleUpdate("past_htUnit", e.target.value)}
              >
                <option>cm</option>
                <option>in</option>
              </select>
            </div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Date Measured
            </label>
            <input
              type="date"
              value={anthro.past_htDate}
              onChange={(e) => handleUpdate("past_htDate", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Past Weight</label>
            <div className="input-group-row" style={{ marginBottom: "0.5rem" }}>
              <input
                type="number"
                value={anthro.past_wt}
                onChange={(e) => handleUpdate("past_wt", e.target.value)}
              />
              <select
                style={{ width: "70px" }}
                value={anthro.past_wtUnit}
                onChange={(e) => handleUpdate("past_wtUnit", e.target.value)}
              >
                <option>g</option>
                <option>oz</option>
                <option>kg</option>
                <option>lbs</option>
              </select>
            </div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Date Measured
            </label>
            <input
              type="date"
              value={anthro.past_wtDate}
              onChange={(e) => handleUpdate("past_wtDate", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Past Head Circ.</label>
            <div className="input-group-row" style={{ marginBottom: "0.5rem" }}>
              <input
                type="number"
                value={anthro.past_head}
                onChange={(e) => handleUpdate("past_head", e.target.value)}
              />
              <select
                style={{ width: "70px" }}
                value={anthro.past_headUnit}
                onChange={(e) => handleUpdate("past_headUnit", e.target.value)}
              >
                <option>cm</option>
                <option>in</option>
              </select>
            </div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Date Measured
            </label>
            <input
              type="date"
              value={anthro.past_headDate}
              onChange={(e) => handleUpdate("past_headDate", e.target.value)}
            />
          </div>
        </div>

        <GrowthVelocityTable
          anthro={anthro}
          patientData={patientData}
          calculatedMetrics={calculatedMetrics}
        />
      </div>

      <GrowthStandardsTable
        anthro={anthro}
        patientData={patientData}
        calculatedMetrics={calculatedMetrics}
      />
    </>
  );
}