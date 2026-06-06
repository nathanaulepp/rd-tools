import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { ND6_MED_MANAGEMENT_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NdMedManagement } from "../../../types/intervention";

export default function NdMedManagementSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const mm = intervention.ndMedManagement;
  const update = (patch: Partial<NdMedManagement>) =>
    setIntervention({ ndMedManagement: { ...mm, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="ND-6: Medication Management Actions">
        <ChipGroup
          options={ND6_MED_MANAGEMENT_ACTIONS}
          value={mm.actions}
          onChange={v => update({ actions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={mm.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Additional medication management notes..."
          style={{ minHeight: "55px" }}
        />
      </Field>
    </div>
  );
}