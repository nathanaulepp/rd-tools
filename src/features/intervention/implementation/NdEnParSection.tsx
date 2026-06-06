import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { ND2_EN_ACTIONS, ND2_PN_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NdEnPnManagement } from "../../../types/intervention";

export default function NdEnParSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const ep = intervention.ndEnPnManagement;
  const update = (patch: Partial<NdEnPnManagement>) =>
    setIntervention({ ndEnPnManagement: { ...ep, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="ND-2.1: Enteral Nutrition Management Actions">
        <ChipGroup
          options={ND2_EN_ACTIONS}
          value={ep.enActions}
          onChange={v => update({ enActions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="ND-2.2: Parenteral / IV Fluid Management Actions">
        <ChipGroup
          options={ND2_PN_ACTIONS}
          value={ep.pnActions}
          onChange={v => update({ pnActions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={ep.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Additional EN/PN management notes..."
          style={{ minHeight: "55px" }}
        />
      </Field>
    </div>
  );
}