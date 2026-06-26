// src/features/assessment/assess-clinical/ClinicalC1MedicalContext.tsx
import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import type { Clinical } from "../../../types";

export default function ClinicalC1MedicalContext() {
  const { clinical, setClinical } = useClinicalStore();
  const [expanded, setExpanded] = React.useState(true);

  const handleUpdate = (field: keyof Clinical, val: string) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  return (
    <div className="card">
      <CollapseHeader
        label="C1: Medical Context"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <div className="grid-2-col">
          <div className="input-group">
            <label>Allergies/Intolerances</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.allergiesIntolerances || ""}
              onChange={(e) => handleUpdate("allergiesIntolerances", e.target.value)}
              placeholder="e.g. latex, milk, soy..."
            />
          </div>
          <div className="input-group">
            <label>Medical Devices/Prosthetics</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.medicalDevices || ""}
              onChange={(e) => handleUpdate("medicalDevices", e.target.value)}
              placeholder="e.g. hearing aids, pacemaker, dental prosthetics..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
