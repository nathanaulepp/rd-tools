import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { C1_THEORETICAL_BASIS, C2_STRATEGIES } from "../../../shared/constants/interventionNdConstants";
import type { NcpCounseling } from "../../../types/intervention";

export default function CounselingSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const c = intervention.counseling;
  const update = (patch: Partial<NcpCounseling>) =>
    setIntervention({ counseling: { ...c, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="C-1: Theoretical Basis / Approach">
        <ChipGroup options={C1_THEORETICAL_BASIS} value={c.theoreticalBasis} onChange={v => update({ theoreticalBasis: v as string[] })} multiSelect />
      </Field>
      <Field label="C-2: Counseling Strategies">
        <ChipGroup options={C2_STRATEGIES} value={c.strategies} onChange={v => update({ strategies: v as string[] })} multiSelect />
      </Field>
      <Field label="Notes">
        <textarea value={c.notes} onChange={e => update({ notes: e.target.value })} placeholder="Additional counseling notes..." style={{ minHeight: "55px" }} />
      </Field>
    </div>
  );
}