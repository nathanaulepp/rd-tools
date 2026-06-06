import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { ND5_ENVIRONMENT_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NdFeedingEnvironment } from "../../../types/intervention";

export default function NdFeedingEnvironmentSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const fe = intervention.ndFeedingEnvironment;
  const update = (patch: Partial<NdFeedingEnvironment>) =>
    setIntervention({ ndFeedingEnvironment: { ...fe, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="ND-5: Feeding Environment Actions">
        <ChipGroup
          options={ND5_ENVIRONMENT_ACTIONS}
          value={fe.actions}
          onChange={v => update({ actions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={fe.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Additional feeding environment notes..."
          style={{ minHeight: "55px" }}
        />
      </Field>
    </div>
  );
}