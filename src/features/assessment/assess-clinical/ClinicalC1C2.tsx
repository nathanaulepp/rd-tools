// src/features/assessment/assess-clinical/ClinicalC1C2.tsx
// Phase 5: Reads useClinicalStore directly. No props for domain state.

import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { useUIStore } from "../../../stores/useUIStore";
import type { Clinical } from "../../../types";

export default function ClinicalC1C2() {
  const { clinical, setClinical } = useClinicalStore();
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  const handleUpdate = (field: keyof Clinical, val: string | string[]) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  if (activeSubDomain === "C1") {
    return (
      <div className="card">
        <h4 className="mb-1">C1: Medical Context</h4>
        <div className="grid-2-col">
          <div className="input-group">
            <label>Chief Complaint</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.chiefComplaint}
              onChange={(e) => handleUpdate("chiefComplaint", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Medical History</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.medHx}
              onChange={(e) => handleUpdate("medHx", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Family History</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.familyHx}
              onChange={(e) => handleUpdate("familyHx", e.target.value)}
              placeholder="e.g. mother and father HTN, maternal father cancer..."
            />
          </div>
          <div className="input-group">
            <label>Social History</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.socialHx}
              onChange={(e) => handleUpdate("socialHx", e.target.value)}
              placeholder="e.g. occupation, education, social support, living situation..."
            />
          </div>
          <div className="input-group">
            <label>Allergies/Intolerances</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.allergiesIntolerances}
              onChange={(e) => handleUpdate("allergiesIntolerances", e.target.value)}
              placeholder="e.g. latex, milk, soy..."
            />
          </div>
          <div className="input-group">
            <label>Medical Devices/Prosthetics</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={clinical.medicalDevices}
              onChange={(e) => handleUpdate("medicalDevices", e.target.value)}
              placeholder="e.g. hearing aids, pacemaker, dental prosthetics..."
            />
          </div>
        </div>
      </div>
    );
  }

  // C2
  return (
    <div className="card">
      <h4 className="mb-1">C2: Vital Signs & Screenings</h4>
      <div className="grid-5-col">
        <div className="input-group">
          <label>Temp (°F)</label>
          <input
            type="text"
            value={clinical.temp}
            onChange={(e) => handleUpdate("temp", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>HR (bpm)</label>
          <input
            type="text"
            value={clinical.hr}
            onChange={(e) => handleUpdate("hr", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>
            SpO<sub>2</sub> (%)
          </label>
          <input
            type="text"
            value={clinical.spo2}
            onChange={(e) => handleUpdate("spo2", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>BP (mmHg)</label>
          <input
            type="text"
            value={clinical.bp}
            onChange={(e) => handleUpdate("bp", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>RR (bpm)</label>
          <input
            type="text"
            value={clinical.rr}
            onChange={(e) => handleUpdate("rr", e.target.value)}
          />
        </div>
      </div>
      <div className="input-group mt-1">
        <label>Screenings</label>
        <textarea
          style={{ minHeight: "100px" }}
          value={clinical.screenings}
          onChange={(e) => handleUpdate("screenings", e.target.value)}
          placeholder="e.g. MSS, malnutrition screening, etc."
        />
      </div>
    </div>
  );
}