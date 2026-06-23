// src/features/assessment/assess-clinical/ClinicalC5Radiology.tsx
import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import type { Clinical } from "../../../types";

export default function ClinicalC5Radiology() {
  const { clinical, setClinical } = useClinicalStore();
  const [expanded, setExpanded] = React.useState(false);

  const handleUpdate = (field: keyof Clinical, val: string) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  return (
    <div className="card">
      <CollapseHeader
        label="C5: Radiology & Imaging"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <>
          <div className="grid-2-col">
        <div className="input-group">
          <label>Skeletal Muscle Index (SMI)</label>
          <input
            type="text"
            value={clinical.imaging_smi || ""}
            onChange={(e) => handleUpdate("imaging_smi", e.target.value)}
            placeholder="cm²/m²"
          />
        </div>
        <div className="input-group">
          <label>L3 Muscle Area</label>
          <input
            type="text"
            value={clinical.imaging_muscleArea || ""}
            onChange={(e) => handleUpdate("imaging_muscleArea", e.target.value)}
            placeholder="cm²"
          />
        </div>
        <div className="input-group">
          <label>Muscle Attenuation</label>
          <input
            type="text"
            value={clinical.imaging_muscleAttenuation || ""}
            onChange={(e) =>
              handleUpdate("imaging_muscleAttenuation", e.target.value)
            }
            placeholder="Hounsfield Units (HU)"
          />
        </div>
        <div className="input-group">
          <label>IMAT (Intermuscular Fat)</label>
          <input
            type="text"
            value={clinical.imaging_imat || ""}
            onChange={(e) => handleUpdate("imaging_imat", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>VAT (Visceral Fat Area)</label>
          <input
            type="text"
            value={clinical.imaging_vat || ""}
            onChange={(e) => handleUpdate("imaging_vat", e.target.value)}
            placeholder="cm²"
          />
        </div>
      </div>
      <div className="input-group mt-1">
        <label>Imaging / Radiology Notes</label>
        <textarea
          style={{ minHeight: "100px" }}
          value={clinical.imaging_notes || ""}
          onChange={(e) => handleUpdate("imaging_notes", e.target.value)}
          placeholder="Details on myosteatosis, sarcopenia severity, or other imaging findings..."
        />
      </div>
        </>
      )}
    </div>
  );
}
