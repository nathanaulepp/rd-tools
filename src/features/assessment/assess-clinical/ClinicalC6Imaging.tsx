// src/features/assessment/assess-clinical/ClinicalC6Imaging.tsx
// Extracted from ClinicalDomain.tsx — C6 (Radiology & Imaging).

import React from "react";
import type { Clinical } from "../../../types";

interface ClinicalC6ImagingProps {
  clinical: Clinical;
  handleUpdate: (field: string, val: string) => void;
}

export default function ClinicalC6Imaging({
  clinical,
  handleUpdate,
}: ClinicalC6ImagingProps) {
  return (
    <div className="card">
      <h4 className="mb-1">C6: Radiology & Imaging</h4>
      <div className="grid-2-col">
        <div className="input-group">
          <label>Skeletal Muscle Index (SMI)</label>
          <input
            type="text"
            value={clinical.imaging_smi}
            onChange={(e) => handleUpdate("imaging_smi", e.target.value)}
            placeholder="cm²/m²"
          />
        </div>
        <div className="input-group">
          <label>L3 Muscle Area</label>
          <input
            type="text"
            value={clinical.imaging_muscleArea}
            onChange={(e) => handleUpdate("imaging_muscleArea", e.target.value)}
            placeholder="cm²"
          />
        </div>
        <div className="input-group">
          <label>Muscle Attenuation</label>
          <input
            type="text"
            value={clinical.imaging_muscleAttenuation}
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
            value={clinical.imaging_imat}
            onChange={(e) => handleUpdate("imaging_imat", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>VAT (Visceral Fat Area)</label>
          <input
            type="text"
            value={clinical.imaging_vat}
            onChange={(e) => handleUpdate("imaging_vat", e.target.value)}
            placeholder="cm²"
          />
        </div>
      </div>
      <div className="input-group mt-1">
        <label>Imaging / Radiology Notes</label>
        <textarea
          style={{ minHeight: "100px" }}
          value={clinical.imaging_notes}
          onChange={(e) => handleUpdate("imaging_notes", e.target.value)}
          placeholder="Details on myosteatosis, sarcopenia severity, or other imaging findings..."
        />
      </div>
    </div>
  );
}