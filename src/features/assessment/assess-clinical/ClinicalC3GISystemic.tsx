// src/features/assessment/assess-clinical/ClinicalC3GISystemic.tsx
import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import type { Clinical } from "../../../types";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { Field } from "../../../shared/ui/Field";
import {
  GI_SYMPTOM_OPTIONS,
  BOWEL_FUNCTION_OPTIONS,
  DENTITION_OPTIONS,
  SWALLOW_CHEW_OPTIONS,
  NICHE_CONDITION_OPTIONS,
} from "../../../shared/constants/clinicalC4Options";

const toggleExclusiveChip = (
  next: string[],
  prev: string[],
  noneValue: string
): string[] => {
  const added = next.find((x) => !prev.includes(x));
  if (added === noneValue) {
    return [noneValue];
  }
  if (next.includes(noneValue) && next.length > 1) {
    return next.filter((x) => x !== noneValue);
  }
  return next;
};

export default function ClinicalC3GISystemic() {
  const { clinical, setClinical } = useClinicalStore();

  const handleUpdate = (field: keyof Clinical, val: string | string[]) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  return (
    <div className="card">
      <h4 className="mb-1">C3: GI & Systemic Function</h4>
      <div className="grid-2-col mb-1">
        {/* Column 1 — GI & Bowel Function */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Field label="GI Symptoms (Checklist)">
            <ChipGroup
              multiSelect={true}
              options={GI_SYMPTOM_OPTIONS}
              value={clinical.giSymptoms || []}
              onChange={(v) => {
                const prev = clinical.giSymptoms || [];
                const next = Array.isArray(v) ? v : [v];
                handleUpdate("giSymptoms", toggleExclusiveChip(next, prev, "None"));
              }}
            />
          </Field>
          <Field label="Bowel Function">
            <SelectInput
              value={clinical.bowelFunction || ""}
              onChange={(v) => handleUpdate("bowelFunction", v)}
              options={BOWEL_FUNCTION_OPTIONS}
            />
          </Field>
          <div className="input-group">
            <label>GI Notes</label>
            <input
              type="text"
              value={clinical.giDistress || ""}
              onChange={(e) => handleUpdate("giDistress", e.target.value)}
              placeholder="e.g. Diarrhea x3 episodes this morning"
            />
          </div>
        </div>

        {/* Column 2 — Oral & Swallow Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Field label="Dentition">
            <SelectInput
              value={clinical.dentition || ""}
              onChange={(v) => handleUpdate("dentition", v)}
              options={DENTITION_OPTIONS}
            />
          </Field>
          <Field label="Swallow / Chew Concerns">
            <ChipGroup
              multiSelect={true}
              options={SWALLOW_CHEW_OPTIONS}
              value={clinical.swallowChewConcerns || []}
              onChange={(v) => {
                const prev = clinical.swallowChewConcerns || [];
                const next = Array.isArray(v) ? v : [v];
                handleUpdate("swallowChewConcerns", toggleExclusiveChip(next, prev, "No issues noted"));
              }}
            />
          </Field>
          <div className="input-group">
            <label>Oral Hygiene</label>
            <input
              type="text"
              value={clinical.oralHygiene || ""}
              onChange={(e) => handleUpdate("oralHygiene", e.target.value)}
              placeholder="e.g. brushes teeth, no flossing"
            />
          </div>
        </div>
      </div>

      <div className="mt-1">
        <Field label="Specialized Population Flags (optional)">
          <ChipGroup
            multiSelect={true}
            options={NICHE_CONDITION_OPTIONS}
            value={clinical.nicheConditionFlags || []}
            onChange={(v) => handleUpdate("nicheConditionFlags", v)}
          />
        </Field>
      </div>

      <div className="grid-2-col mt-1">
        {clinical.nicheConditionFlags?.includes("Burn Patient") && (
          <div className="input-group">
            <label>TBSA Burned (%)</label>
            <input
              type="text"
              value={clinical.tbsa || ""}
              onChange={(e) => handleUpdate("tbsa", e.target.value)}
              placeholder="For Milner/Toronto formula"
            />
          </div>
        )}
        {clinical.nicheConditionFlags?.includes("Cystic Fibrosis") && (
          <div className="input-group">
            <label>FEV₁ % Predicted</label>
            <input
              type="text"
              value={clinical.fev1 || ""}
              onChange={(e) => handleUpdate("fev1", e.target.value)}
              placeholder="For CF equation"
            />
          </div>
        )}
      </div>
    </div>
  );
}
