import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import {
  ND3_MEDICAL_FOOD_ACTIONS,
  ND3_VITAMIN_SUPPLEMENTS,
  ND3_MINERAL_SUPPLEMENTS,
  ND3_BIOACTIVE_ACTIONS,
} from "../../../shared/constants/interventionNdConstants";
import type { NdSupplementTherapy } from "../../../types/intervention";

export default function NdSupplementSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const st = intervention.ndSupplementTherapy;
  const update = (patch: Partial<NdSupplementTherapy>) =>
    setIntervention({ ndSupplementTherapy: { ...st, ...patch } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="ND-3.1: Medical Food Supplement">
        <ChipGroup options={ND3_MEDICAL_FOOD_ACTIONS} value={st.medicalFoodActions} onChange={v => update({ medicalFoodActions: v as string[] })} multiSelect />
      </Field>
      <Field label="ND-3.2: Vitamin Supplements">
        <ChipGroup options={ND3_VITAMIN_SUPPLEMENTS} value={st.vitaminSupplements} onChange={v => update({ vitaminSupplements: v as string[] })} multiSelect />
      </Field>
      <Field label="ND-3.2: Mineral Supplements">
        <ChipGroup options={ND3_MINERAL_SUPPLEMENTS} value={st.mineralSupplements} onChange={v => update({ mineralSupplements: v as string[] })} multiSelect />
      </Field>
      <Field label="ND-3.3: Bioactive Constituent Management">
        <ChipGroup options={ND3_BIOACTIVE_ACTIONS} value={st.bioactiveActions} onChange={v => update({ bioactiveActions: v as string[] })} multiSelect />
      </Field>
      <Field label="Notes">
        <textarea value={st.notes} onChange={e => update({ notes: e.target.value })} placeholder="Additional supplement therapy notes..." style={{ minHeight: "55px" }} />
      </Field>
    </div>
  );
}