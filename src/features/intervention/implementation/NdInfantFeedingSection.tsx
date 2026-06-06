import React, { useState } from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { Field } from "../../../shared/ui/Field";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import { ND7_BREASTMILK_ACTIONS, ND7_FORMULA_ACTIONS } from "../../../shared/constants/interventionNdConstants";
import type { NdInfantFeeding } from "../../../types/intervention";

export default function NdInfantFeedingSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const { ageDays } = useCalculatedMetrics();
  const [manualOverride, setManualOverride] = useState(false);
  const inf = intervention.ndInfantFeeding;
  const update = (patch: Partial<NdInfantFeeding>) =>
    setIntervention({ ndInfantFeeding: { ...inf, ...patch } });

  const isAgeGated = ageDays !== null && ageDays >= 730;
  if (isAgeGated && !manualOverride) {
    return (
      <div style={{ padding: "0.75rem" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontStyle: "italic" }}>
          ND-7 is age-gated (patient is ≥ 24 months).{" "}
          <span
            style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setManualOverride(true)}
          >
            Show anyway
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {isAgeGated && (
        <div style={{ fontSize: "0.75rem", color: "var(--warning-text)", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: "4px", padding: "4px 8px" }}>
          ⚠ Manual override active — patient is ≥ 24 months.
        </div>
      )}
      <Field label="ND-7.1: Breastmilk / Human Milk Management">
        <ChipGroup
          options={ND7_BREASTMILK_ACTIONS}
          value={inf.breastmilkActions}
          onChange={v => update({ breastmilkActions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="ND-7.2: Infant Formula Management">
        <ChipGroup
          options={ND7_FORMULA_ACTIONS}
          value={inf.formulaActions}
          onChange={v => update({ formulaActions: v as string[] })}
          multiSelect
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={inf.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Additional infant feeding notes..."
          style={{ minHeight: "55px" }}
        />
      </Field>
    </div>
  );
}