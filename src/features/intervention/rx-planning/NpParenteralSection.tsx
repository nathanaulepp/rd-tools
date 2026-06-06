import React from "react";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import type { NpParenteralNutrition } from "../../../types/intervention";
import { NP_PN_SOLUTION_OPTIONS } from "../../../shared/constants/interventionNpConstants";

const ADMIN_PRESETS = [
  "Continuous PN administration, central venous line",
  "Continuous PN administration, PICC line",
  "Cyclic PN administration (12h nocturnal)",
  "Peripheral parenteral nutrition (PPN), peripheral IV",
];

export default function NpParenteralSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const pn = intervention.npParenteral;

  function update(patch: Partial<NpParenteralNutrition>) {
    setIntervention({ npParenteral: { ...pn, ...patch } });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Energy */}
      <div className="card">
        <SectionHeader title="NP-1.3.1 — Energy" color="#8e44ad" />
        <Field label="Total Energy (kcal/day)">
          <NumInput value={pn.energyKcal} onChange={v => update({ energyKcal: v })} placeholder="e.g. 1800" />
        </Field>
      </div>

      {/* Macronutrients */}
      <div className="card">
        <SectionHeader title="NP-1.3.2.1 — Macronutrients" color="#8e44ad" />
        <div className="grid-3-col">
          <Field label="Amino Acids (g/day)">
            <NumInput value={pn.aminoAcidsG} onChange={v => update({ aminoAcidsG: v })} placeholder="e.g. 80" />
          </Field>
          <Field label="Dextrose (g/day)">
            <NumInput value={pn.dextroseG} onChange={v => update({ dextroseG: v })} placeholder="e.g. 250" />
          </Field>
          <Field label="Lipids / IVLE (g/day)">
            <NumInput value={pn.lipidsG} onChange={v => update({ lipidsG: v })} placeholder="e.g. 50" />
          </Field>
        </div>
      </div>

      {/* Electrolytes */}
      <div className="card">
        <SectionHeader title="NP-1.3.2.2 — Electrolytes" color="#8e44ad" />
        <div className="grid-5-col">
          <Field label="Sodium (mEq)">
            <NumInput value={pn.sodiumMeq} onChange={v => update({ sodiumMeq: v })} placeholder="mEq" />
          </Field>
          <Field label="Potassium (mEq)">
            <NumInput value={pn.potassiumMeq} onChange={v => update({ potassiumMeq: v })} placeholder="mEq" />
          </Field>
          <Field label="Magnesium (mEq)">
            <NumInput value={pn.magnesiumMeq} onChange={v => update({ magnesiumMeq: v })} placeholder="mEq" />
          </Field>
          <Field label="Calcium (mEq)">
            <NumInput value={pn.calciumMeq} onChange={v => update({ calciumMeq: v })} placeholder="mEq" />
          </Field>
          <Field label="Phosphorus (mmol)">
            <NumInput value={pn.phosphorusMmol} onChange={v => update({ phosphorusMmol: v })} placeholder="mmol" />
          </Field>
        </div>
      </div>

      {/* Vitamins & Trace Elements */}
      <div className="card">
        <SectionHeader title="NP-1.3.2.3 — Vitamins & Trace Elements" color="#8e44ad" />
        <div className="grid-2-col">
          <Field label="Multi-Vitamin Infusion (MVI) (mL/day)">
            <NumInput value={pn.mviMl} onChange={v => update({ mviMl: v })} placeholder="e.g. 10" />
          </Field>
          <Field label="Multi-Trace Elements (MTE) (mL/day)">
            <NumInput value={pn.mteMl} onChange={v => update({ mteMl: v })} placeholder="e.g. 1" />
          </Field>
        </div>
      </div>

      {/* Solution & Volume */}
      <div className="card">
        <SectionHeader title="NP-1.3.3 — Solution Composition & Volume" color="#8e44ad" />
        <div className="grid-2-col">
          <Field label="Solution Type / Compounding">
            <SelectInput
              value={pn.solutionType}
              onChange={v => update({ solutionType: v })}
              options={NP_PN_SOLUTION_OPTIONS}
              placeholder="Select or type..."
            />
          </Field>
          <Field label="Total Fluid Volume (mL/day)">
            <NumInput value={pn.totalFluidVolumeMl} onChange={v => update({ totalFluidVolumeMl: v })} placeholder="e.g. 2000" />
          </Field>
        </div>
      </div>

      {/* Administration */}
      <div className="card">
        <SectionHeader title="NP-1.3.4 — Method of Administration" color="#8e44ad" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.5rem" }}>
          {ADMIN_PRESETS.map(p => (
            <div
              key={p}
              className="chip"
              onClick={() => update({ adminMethod: p })}
              style={{ cursor: "pointer" }}
            >
              {p}
            </div>
          ))}
        </div>
        <Field label="Administration Method">
          <textarea
            value={pn.adminMethod}
            onChange={e => update({ adminMethod: e.target.value })}
            placeholder="e.g. Continuous parenteral nutrition administration, central venous line"
            style={{ minHeight: "60px" }}
          />
        </Field>
      </div>

      {/* Values Inclusion */}
      <div className="card">
        <Field label="NP-1.3.5 — Values Inclusion / Notes">
          <textarea
            value={pn.valuesInclusion}
            onChange={e => update({ valuesInclusion: e.target.value })}
            placeholder="Additional values or clinical context..."
            style={{ minHeight: "60px" }}
          />
        </Field>
      </div>
    </div>
  );
}