// src/features/intervention/rx-planning/NpEnteralSection.tsx
// NP-1.2: Enteral Nutrition prescription fields.
// Reads/writes intervention.npEnteral via useInterventionStore directly — no props for state.
// Depends on: interventionNpConstants, shared UI primitives.

import React from "react";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { Field }       from "../../../shared/ui/Field";
import { NumInput }    from "../../../shared/ui/NumInput";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { PullFromStandardsButton } from "../../../shared/ui/PullFromStandardsButton";
import { NP_EN_ADMIN_OPTIONS } from "../../../shared/constants/interventionNpConstants";
import type { NpEnteralNutrition } from "../../../types/intervention";
import type { ParsedTargets } from "../../../shared/utils/parseStandardsTargets";
import FormulaLookupInput, { type FormulaPatch } from "./FormulaLookupInput";
import FormulaViabilityPanel from "./FormulaViabilityPanel";


// ── Internal sub-component: labeled low/high range input pair ─────────────────

interface RangeRowProps {
  label: string;
  unit: string;
  low: string;
  high: string;
  onLowChange: (v: string) => void;
  onHighChange: (v: string) => void;
}

function RangeRow({ label, unit, low, high, onLowChange, onHighChange }: RangeRowProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{
        fontSize: "0.72rem", fontWeight: 700, color: "#4a5568",
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label} ({unit})
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
        <NumInput value={low}  onChange={onLowChange}  placeholder="Low"  />
        <NumInput value={high} onChange={onHighChange} placeholder="High" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.65rem", color: "#a0aec0" }}>Low</span>
        <span style={{ fontSize: "0.65rem", color: "#a0aec0" }}>High</span>
      </div>
    </div>
  );
}

// ── Body position presets ─────────────────────────────────────────────────────

const BODY_POSITION_OPTIONS: string[] = [
  "Head of bed elevated ≥ 30°",
  "Head of bed elevated ≥ 45°",
  "Semi-recumbent",
  "Prone",
  "Reverse Trendelenburg",
  "Upright / seated",
];

// ── Main component ────────────────────────────────────────────────────────────

export default function NpEnteralSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const en = intervention.npEnteral;

  function update(patch: Partial<NpEnteralNutrition>) {
    setIntervention({ npEnteral: { ...en, ...patch } });
  }

  // ── Pull from Standards handler ───────────────────────────────────────────
  function handlePull(targets: ParsedTargets) {
    update({
      ...(targets.kcalLow    && { kcalLow:    targets.kcalLow    }),
      ...(targets.kcalHigh   && { kcalHigh:   targets.kcalHigh   }),
      ...(targets.proteinLow  && { proteinLow:  targets.proteinLow  }),
      ...(targets.proteinHigh && { proteinHigh: targets.proteinHigh }),
      ...(targets.fluidLow   && { fluidLow:   targets.fluidLow   }),
      ...(targets.fluidHigh  && { fluidHigh:  targets.fluidHigh  }),
    });
  }

  // ── Admin method preset chip handler ──────────────────────────────────────
  function applyAdminPreset(preset: string) {
    const current = en.adminMethod.trim();
    update({ adminMethod: current ? `${current}\n${preset}` : preset });
  }

  // ── Formula viability apply handler ───────────────────────────────────────
  // When the clinician selects a formula from the viability panel, auto-fill
  // the formula name, daily volume, and infusion rate fields.
  function handleViabilityApply(
    formulaName: string,
    rateMlHr: number,
    volMlDay: number
  ) {
    update({
      formulaName,
      infusionRateMlHr: String(rateMlHr),
      dailyVolumeMl: String(volMlDay),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

      {/* ── NP-1.2.2: Nutrient Targets ──────────────────────────────────────── */}
      <div>
        {/* Sub-header row: label + pull button */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}>
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, color: "#4a5568",
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            NP-1.2.2 — Nutrient Targets (Low / High)
          </span>
          <PullFromStandardsButton onPull={handlePull} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
          <RangeRow
            label="Calories"
            unit="kcal"
            low={en.kcalLow}
            high={en.kcalHigh}
            onLowChange={(v) => update({ kcalLow: v })}
            onHighChange={(v) => update({ kcalHigh: v })}
          />
          <RangeRow
            label="Protein"
            unit="g"
            low={en.proteinLow}
            high={en.proteinHigh}
            onLowChange={(v) => update({ proteinLow: v })}
            onHighChange={(v) => update({ proteinHigh: v })}
          />
          <RangeRow
            label="Fluid"
            unit="mL"
            low={en.fluidLow}
            high={en.fluidHigh}
            onLowChange={(v) => update({ fluidLow: v })}
            onHighChange={(v) => update({ fluidHigh: v })}
          />
        </div>

        {/* ── Formula Viability Panel ────────────────────────────────────────
            Appears automatically once kcal targets are populated.
            Ranks the formulary against current targets and lets the
            clinician apply a formula directly to the prescription fields. */}
        <FormulaViabilityPanel
          kcalLow={en.kcalLow}
          kcalHigh={en.kcalHigh}
          proteinLow={en.proteinLow}
          proteinHigh={en.proteinHigh}
          fluidLow={en.fluidLow}
          fluidHigh={en.fluidHigh}
          onApply={handleViabilityApply}
        />
      </div>

      {/* ── NP-1.2.3: Formula Composition and Volume ─────────────────────────── */}
      <div>
        <div style={{
          fontSize: "0.72rem", fontWeight: 700, color: "#4a5568",
          textTransform: "uppercase", letterSpacing: "0.04em",
          marginBottom: "0.5rem",
        }}>
          NP-1.2.3 — Formula Composition and Volume
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.65rem" }}>
          <Field label="NP-1.2.3.1 — Formula Name / Type">
            <FormulaLookupInput
              value={en.formulaName}
              onChange={(patch: FormulaPatch) => {
                update({ formulaName: patch.formulaName });
              }}
            />
          </Field>
          <Field label="NP-1.2.3.2 — Total Daily Volume (mL)">
            <NumInput
              value={en.dailyVolumeMl}
              onChange={(v) => update({ dailyVolumeMl: v })}
              placeholder="mL/day"
            />
          </Field>
          <Field label="NP-1.2.3.3 — Target Infusion Rate (mL/hr)">
            <NumInput
              value={en.infusionRateMlHr}
              onChange={(v) => update({ infusionRateMlHr: v })}
              placeholder="mL/hr"
            />
          </Field>
        </div>
      </div>

      {/* ── NP-1.2.4: Method of Administration ──────────────────────────────── */}
      <Field label="NP-1.2.4 — Method of Administration">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.35rem" }}>
          {NP_EN_ADMIN_OPTIONS.map((preset) => (
            <div
              key={preset}
              className="chip"
              onClick={() => applyAdminPreset(preset)}
              style={{ cursor: "pointer" }}
            >
              {preset}
            </div>
          ))}
        </div>
        <textarea
          value={en.adminMethod}
          onChange={(e) => update({ adminMethod: e.target.value })}
          placeholder="Describe administration method or click a preset above…"
          style={{ minHeight: "60px", width: "100%", boxSizing: "border-box" }}
        />
      </Field>

      {/* ── NP-1.2.5: Body Position ──────────────────────────────────────────── */}
      <Field label="NP-1.2.5 — Body Position">
        <SelectInput
          value={en.bodyPosition}
          onChange={(v) => update({ bodyPosition: v })}
          options={BODY_POSITION_OPTIONS}
          placeholder="Select position…"
        />
      </Field>

      {/* ── NP-1.2.6: Other ──────────────────────────────────────────────────── */}
      <Field label="NP-1.2.6 — Other">
        <textarea
          value={en.other}
          onChange={(e) => update({ other: e.target.value })}
          placeholder="Any additional enteral nutrition notes…"
          style={{ minHeight: "50px", width: "100%", boxSizing: "border-box" }}
        />
      </Field>

    </div>
  );
}