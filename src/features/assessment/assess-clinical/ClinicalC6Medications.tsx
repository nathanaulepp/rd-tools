// src/features/assessment/assess-clinical/ClinicalC6Medications.tsx
import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import type { Clinical } from "../../../types";
import DrugLookupTool from "../../drugs/DrugLookupTool";

export default function ClinicalC6Medications() {
  const { clinical, setClinical } = useClinicalStore();

  const handleUpdate = (field: keyof Clinical, val: string) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  return (
    <div className="card">
      <DrugLookupTool
        label="C6: Medications"
        value={clinical.medications || ""}
        onChange={(v) => handleUpdate("medications", v)}
        showDoseFields={true}
        multiEntry={true}
      />
    </div>
  );
}
