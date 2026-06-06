import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { ND4_FEEDING_ASSISTANCE_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NdFeedingAssistance } from "../../../types/intervention";

export default function NdFeedingAssistanceSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const fa = intervention.ndFeedingAssistance;
  const update = (patch: Partial<NdFeedingAssistance>) =>
    setIntervention({ ndFeedingAssistance: { ...fa, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="ND-4: Feeding Assistance Actions">
        <ChipGroup
          options={ND4_FEEDING_ASSISTANCE_ACTIONS}
          value={fa.actions}
          onChange={v => update({ actions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={fa.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Additional feeding assistance notes..."
          style={{ minHeight: "55px" }}
        />
      </Field>
    </div>
  );
}