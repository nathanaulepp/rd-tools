// src/features/assessment/assess-clinical/ClinicalC2VitalSigns.tsx
import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import type { Clinical } from "../../../types";

export default function ClinicalC2VitalSigns() {
  const { clinical, setClinical } = useClinicalStore();
  const [expanded, setExpanded] = React.useState(true);

  const handleUpdate = (field: keyof Clinical, val: string) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  return (
    <div className="card">
      <CollapseHeader
        label="C2: Vital Signs & Screenings"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <>
          <div className="grid-5-col">
        <div className="input-group">
          <label>Temp (°F)</label>
          <input
            type="text"
            value={clinical.temp || ""}
            onChange={(e) => handleUpdate("temp", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>HR (bpm)</label>
          <input
            type="text"
            value={clinical.hr || ""}
            onChange={(e) => handleUpdate("hr", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>
            SpO<sub>2</sub> (%)
          </label>
          <input
            type="text"
            value={clinical.spo2 || ""}
            onChange={(e) => handleUpdate("spo2", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>BP (mmHg)</label>
          <input
            type="text"
            value={clinical.bp || ""}
            onChange={(e) => handleUpdate("bp", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>RR (bpm)</label>
          <input
            type="text"
            value={clinical.rr || ""}
            onChange={(e) => handleUpdate("rr", e.target.value)}
          />
        </div>
      </div>
      <div className="input-group mt-1">
        <label>Screenings</label>
        <textarea
          style={{ minHeight: "100px" }}
          value={clinical.screenings || ""}
          onChange={(e) => handleUpdate("screenings", e.target.value)}
          placeholder="e.g. MSS, malnutrition screening, etc."
        />
      </div>
        </>
      )}
    </div>
  );
}
