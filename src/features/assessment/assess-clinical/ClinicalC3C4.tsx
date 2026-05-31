// src/features/assessment/assess-clinical/ClinicalC3C4.tsx
// Extracted from ClinicalDomain.tsx — C3 (Medications) and C4 (GI & Systemic Function).

import React from "react";
import DrugLookupTool from "../../drugs/DrugLookupTool";
import type { Clinical } from "../../../types";

interface ClinicalC3C4Props {
  clinical: Clinical;
  handleUpdate: (field: string, val: string | string[]) => void;
  activeSubDomain: "C3" | "C4";
}

export default function ClinicalC3C4({
  clinical,
  handleUpdate,
  activeSubDomain,
}: ClinicalC3C4Props) {
  if (activeSubDomain === "C3") {
    return (
      <div className="card">
        <DrugLookupTool
          label="C3: Medications"
          value={clinical.medications || ""}
          onChange={(v) => handleUpdate("medications", v)}
          showDoseFields={true}
          multiEntry={true}
        />
      </div>
    );
  }

  // C4
  return (
    <div className="card">
      <h4 className="mb-1">C4: GI & Systemic Function</h4>
      <div className="grid-2-col">
        <div className="input-group">
          <label>GI Distress</label>
          <input
            type="text"
            value={clinical.giDistress}
            onChange={(e) => handleUpdate("giDistress", e.target.value)}
            placeholder="e.g. n/v/d/c/bm"
          />
        </div>
        <div className="input-group">
          <label>Oral/Chewing</label>
          <input
            type="text"
            value={clinical.chewing}
            onChange={(e) => handleUpdate("chewing", e.target.value)}
            placeholder="e.g. missing molars/incisors"
          />
        </div>
        <div className="input-group">
          <label>Oral Hygiene</label>
          <input
            type="text"
            value={clinical.oralHygiene}
            onChange={(e) => handleUpdate("oralHygiene", e.target.value)}
            placeholder="e.g. brushes teeth, no flossing"
          />
        </div>
        <div className="input-group">
          <label>Swallowing</label>
          <input
            type="text"
            value={clinical.swallowing}
            onChange={(e) => handleUpdate("swallowing", e.target.value)}
            placeholder="e.g. painful oropharyngeal swallow"
          />
        </div>
        <div className="input-group">
          <label>FEV₁ % Predicted</label>
          <input
            type="text"
            value={clinical.fev1}
            onChange={(e) => handleUpdate("fev1", e.target.value)}
            placeholder="For CF equation"
          />
        </div>
        <div className="input-group">
          <label>TBSA Burned (%)</label>
          <input
            type="text"
            value={clinical.tbsa}
            onChange={(e) => handleUpdate("tbsa", e.target.value)}
            placeholder="For Curreri formula"
          />
        </div>
      </div>
    </div>
  );
}