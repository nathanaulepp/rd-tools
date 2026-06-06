import React from "react";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import type { NpIvFluid } from "../../../types/intervention";
import { NP_SOLUTION_OPTIONS } from "../../../shared/constants/interventionNpConstants";

const ADMIN_PRESETS = [
  "Continuous IV fluid at 75 mL/hr",
  "Continuous IV fluid at 125 mL/hr",
  "IV fluid bolus as needed for hydration",
  "Intermittent IV fluid with medications",
];

export default function NpIvFluidSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const iv = intervention.npIvFluid;

  function update(patch: Partial<NpIvFluid>) {
    setIntervention({ npIvFluid: { ...iv, ...patch } });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="card">
        <SectionHeader title="NP-1.4.1–2 — Energy & Composition" color="#2980b9" />
        <div className="grid-2-col">
          <Field label="Energy (kcal/day)" hint="Only if dextrose-containing solution">
            <NumInput value={iv.energyKcal} onChange={v => update({ energyKcal: v })} placeholder="e.g. 170" />
          </Field>
          <Field label="Dextrose Content (g/day)">
            <NumInput value={iv.dextroseG} onChange={v => update({ dextroseG: v })} placeholder="e.g. 50" />
          </Field>
        </div>
        <Field label="Electrolyte Additives" style={{ marginTop: "0.75rem" }}>
          <textarea
            value={iv.electrolyteAdditives}
            onChange={e => update({ electrolyteAdditives: e.target.value })}
            placeholder="e.g. 20 mEq KCl, 40 mEq NaCl"
            style={{ minHeight: "55px" }}
          />
        </Field>
      </div>

      <div className="card">
        <SectionHeader title="NP-1.4.3–4 — Solution & Administration" color="#2980b9" />
        <div className="grid-2-col" style={{ marginBottom: "0.75rem" }}>
          <Field label="Solution">
            <SelectInput
              value={iv.solution}
              onChange={v => update({ solution: v })}
              options={NP_SOLUTION_OPTIONS}
              placeholder="Select solution..."
            />
          </Field>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.5rem" }}>
          {ADMIN_PRESETS.map(p => (
            <div key={p} className="chip" onClick={() => update({ adminMethod: p })} style={{ cursor: "pointer" }}>
              {p}
            </div>
          ))}
        </div>
        <Field label="Method of Administration">
          <textarea
            value={iv.adminMethod}
            onChange={e => update({ adminMethod: e.target.value })}
            placeholder="e.g. Intravenous fluid administration at 75 mL/hr continuous"
            style={{ minHeight: "55px" }}
          />
        </Field>
      </div>

      <div className="card">
        <Field label="NP-1.4.5 — Values Inclusion / Notes">
          <textarea
            value={iv.valuesInclusion}
            onChange={e => update({ valuesInclusion: e.target.value })}
            placeholder="Additional notes..."
            style={{ minHeight: "55px" }}
          />
        </Field>
      </div>
    </div>
  );
}