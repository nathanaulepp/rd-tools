// src/features/intervention/rx-planning/NpEnteralSection.tsx
// NP-1.2: Enteral Nutrition prescription fields.
// Reads/writes intervention.npEnteral via useInterventionStore directly — no props for state.
// Depends on: interventionNpConstants, shared UI primitives.

import React from "react";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { Field }       from "../../../shared/ui/Field";
import { NumInput }    from "../../../shared/ui/NumInput";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { NP_EN_ADMIN_OPTIONS } from "../../../shared/constants/interventionNpConstants";
import type { NpEnteralNutrition } from "../../../types/intervention";

// ── Internal sub-component: labeled low/high range input pair ─────────────────
// Used for NP-1.2.2 nutrient target ranges (kcal, protein, fluid).

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

  // ── Admin method preset chip handler ──────────────────────────────────────
  // Clicking a preset appends it to the textarea rather than replacing it,
  // since clinicians often combine route  method descriptions.
  function applyAdminPreset(preset: string) {
    const current = en.adminMethod.trim();
    update({ adminMethod: current ? `${current}\n${preset}` : preset });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

      {/* ── NP-1.2.2: Nutrient Targets ──────────────────────────────────────── */}
      <div>
        <div style={{
          fontSize: "0.72rem", fontWeight: 700, color: "#4a5568",
          textTransform: "uppercase", letterSpacing: "0.04em",
          marginBottom: "0.5rem",
        }}>
          NP-1.2.2 — Nutrient Targets (Low / High)
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
            <input
              type="text"
              value={en.formulaName}
              onChange={(e) => update({ formulaName: e.target.value })}
              placeholder="e.g. Osmolite 1.5, Peptamen, Nepro…"
              style={{ width: "100%", boxSizing: "border-box" }}
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