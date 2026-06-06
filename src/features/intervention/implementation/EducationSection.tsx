import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { E1_CONTENT_ACTIONS, E2_APPLICATION_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NcpEducation } from "../../../types/intervention";

export default function EducationSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const ed = intervention.education;
  const update = (patch: Partial<NcpEducation>) =>
    setIntervention({ education: { ...ed, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="E-1: Nutrition Education — Content">
        <ChipGroup options={E1_CONTENT_ACTIONS} value={ed.contentActions} onChange={v => update({ contentActions: v as string[] })} multiSelect />
      </Field>
      <Field label="E-2: Nutrition Education — Application">
        <ChipGroup options={E2_APPLICATION_ACTIONS} value={ed.applicationActions} onChange={v => update({ applicationActions: v as string[] })} multiSelect />
      </Field>
      <Field label="Notes">
        <textarea value={ed.notes} onChange={e => update({ notes: e.target.value })} placeholder="Additional education notes..." style={{ minHeight: "55px" }} />
      </Field>
    </div>
  );
}