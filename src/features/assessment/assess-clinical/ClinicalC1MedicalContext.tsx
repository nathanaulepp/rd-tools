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
            <label>Purpose of Visit</label>
            <textarea
              style={{ minHeight: "60px" }}
              value={clinical.purposeOfVisit || ""}
              onChange={(e) => handleUpdate("purposeOfVisit", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Chief Complaint</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.chiefComplaint || ""}
              onChange={(e) => handleUpdate("chiefComplaint", e.target.value)}
            />
          </div>
        <div className="input-group">
          <label>Medical History</label>
          <textarea
            style={{ minHeight: "150px" }}
            value={clinical.medHx || ""}
            onChange={(e) => handleUpdate("medHx", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Family History</label>
          <textarea
            style={{ minHeight: "150px" }}
            value={clinical.familyHx || ""}
            onChange={(e) => handleUpdate("familyHx", e.target.value)}
            placeholder="e.g. mother and father HTN, maternal father cancer..."
          />
        </div>
        <div className="input-group">
          <label>Social History</label>
          <textarea
            style={{ minHeight: "150px" }}
            value={clinical.socialHx || ""}
            onChange={(e) => handleUpdate("socialHx", e.target.value)}
            placeholder="e.g. occupation, education, social support, living situation..."
          />
        </div>
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
