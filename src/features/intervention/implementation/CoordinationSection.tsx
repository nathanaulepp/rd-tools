import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { RC1_COLLABORATION_ACTIONS, RC2_DISCHARGE_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NcpCoordination } from "../../../types/intervention";

export default function CoordinationSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const rc = intervention.coordination;
  const update = (patch: Partial<NcpCoordination>) =>
    setIntervention({ coordination: { ...rc, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="RC-1: Collaboration & Referral">
        <ChipGroup options={RC1_COLLABORATION_ACTIONS} value={rc.collaborationActions} onChange={v => update({ collaborationActions: v as string[] })} multiSelect />
      </Field>
      <Field label="RC-2: Discharge & Transfer">
        <ChipGroup options={RC2_DISCHARGE_ACTIONS} value={rc.dischargeActions} onChange={v => update({ dischargeActions: v as string[] })} multiSelect />
      </Field>
      <Field label="Notes">
        <textarea value={rc.notes} onChange={e => update({ notes: e.target.value })} placeholder="Additional coordination of care notes..." style={{ minHeight: "55px" }} />
      </Field>
    </div>
  );
}