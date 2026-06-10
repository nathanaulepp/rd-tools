// src/features/intervention/rx-planning/NpOralSection.tsx
// NP-1.1: Oral Nutrition prescription fields.
// Reads/writes intervention.npOral via useInterventionStore directly — no props for state.
// Depends on: interventionNpConstants, shared UI primitives.

import React from "react";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { Field }       from "../../../shared/ui/Field";
import { NumInput }    from "../../../shared/ui/NumInput";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { ChipGroup }   from "../../../shared/ui/ChipGroup";
import { PullFromStandardsButton } from "../../../shared/ui/PullFromStandardsButton";
import {
  NP_NUTRIENT_OPTIONS,
  NP_NUTRIENT_UNITS,
  NP_TEXTURE_OPTIONS,
} from "../../../shared/constants/interventionNpConstants";
import type { NpOralNutrition, NutrientModifier } from "../../../types/intervention";
import type { ParsedTargets } from "../../../shared/utils/parseStandardsTargets";

// ── Internal sub-component: one dynamic nutrient modifier row ─────────────────

interface NutrientRowProps {
  row: NutrientModifier;
  onChange: (updated: NutrientModifier) => void;
  onRemove: () => void;
}

function NutrientRow({ row, onChange, onRemove }: NutrientRowProps) {
  const unitOptions = NP_NUTRIENT_UNITS[row.nutrient] ?? ["g"];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1.5fr auto",
        gap: "0.4rem",
        alignItems: "end",
        marginBottom: "0.35rem",
      }}
    >
      <SelectInput
        value={row.nutrient}
        onChange={(val) => {
          const newUnits = NP_NUTRIENT_UNITS[val] ?? ["g"];
          onChange({ ...row, nutrient: val, unit: newUnits[0] });
        }}
        options={NP_NUTRIENT_OPTIONS}
        placeholder="Select nutrient…"
      />
      <NumInput
        value={row.amount}
        onChange={(val) => onChange({ ...row, amount: val })}
        placeholder="Amount"
      />
      <SelectInput
        value={row.unit}
        onChange={(val) => onChange({ ...row, unit: val })}
        options={unitOptions}
      />
      <SelectInput
        value={row.direction}
        onChange={(val) =>
          onChange({ ...row, direction: val as NutrientModifier["direction"] })
        }
        options={["increased", "decreased", "consistent"]}
        placeholder="Direction…"
      />
      <button
        onClick={onRemove}
        style={{
          background: "transparent",
          border: "1px solid #e74c3c",
          color: "#e74c3c",
          borderRadius: "4px",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "0.75rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Foods and eating patterns ─────────────────────────────────────────────────

const FOODS_AND_PATTERNS_OPTIONS: string[] = [
  "General healthful diet",
  "Mediterranean diet",
  "Low sodium",
  "Low fat",
  "Low carbohydrate",
  "High protein",
  "High fiber",
  "Heart healthy",
  "Renal diet",
  "Diabetic diet",
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten free",
  "Lactose free",
];

// ── Main component ────────────────────────────────────────────────────────────

export default function NpOralSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const oral = intervention.npOral;

  function update(patch: Partial<NpOralNutrition>) {
    setIntervention({ npOral: { ...oral, ...patch } });
  }

  // ── Pull from Standards handler ───────────────────────────────────────────
  // Oral has a single energyKcal field — use the midpoint of the range.
  // Protein and fluid targets are not editable single-fields in NP-1.1, so
  // we only apply energy here and rely on the nutrient modifiers for protein.
  function handlePull(targets: ParsedTargets) {
    const updates: Partial<NpOralNutrition> = {};

    if (targets.kcalLow && targets.kcalHigh) {
      const low  = parseFloat(targets.kcalLow);
      const high = parseFloat(targets.kcalHigh);
      if (!isNaN(low) && !isNaN(high)) {
        // Use midpoint; if low === high use that value directly
        updates.energyKcal = String(Math.round((low + high) / 2));
      }
    }

    // Auto-add a protein modifier row if protein target was returned and
    // no "Protein" row already exists
    if (targets.proteinLow && targets.proteinHigh) {
      const protLow  = parseFloat(targets.proteinLow);
      const protHigh = parseFloat(targets.proteinHigh);
      if (!isNaN(protLow) && !isNaN(protHigh)) {
        const alreadyHasProtein = oral.nutrientModifiers.some(
          (r) => r.nutrient === "Protein"
        );
        if (!alreadyHasProtein) {
          const midProt = Math.round((protLow + protHigh) / 2);
          const newRow: NutrientModifier = {
            id: Date.now(),
            nutrient: "Protein",
            amount: String(midProt),
            unit: "g",
            direction: "increased",
          };
          updates.nutrientModifiers = [...oral.nutrientModifiers, newRow];
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      update(updates);
    }
  }

  // ── Nutrient modifier list helpers ────────────────────────────────────────

  function addNutrientRow() {
    const newRow: NutrientModifier = {
      id: Date.now(),
      nutrient: "",
      amount: "",
      unit: "g",
      direction: "",
    };
    update({ nutrientModifiers: [...oral.nutrientModifiers, newRow] });
  }

  function updateNutrientRow(id: number, updated: NutrientModifier) {
    update({
      nutrientModifiers: oral.nutrientModifiers.map((r) =>
        r.id === id ? updated : r
      ),
    });
  }

  function removeNutrientRow(id: number) {
    update({
      nutrientModifiers: oral.nutrientModifiers.filter((r) => r.id !== id),
    });
  }

  const disabled = oral.isNpo;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

      {/* NPO toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          id="npo-toggle"
          checked={oral.isNpo}
          onChange={(e) => update({ isNpo: e.target.checked })}
          style={{ width: "auto" }}
        />
        <label htmlFor="npo-toggle" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e74c3c", margin: 0 }}>
          Nil per os (NPO)
        </label>
        {oral.isNpo && (
          <span style={{
            background: "#e74c3c", color: "#fff", borderRadius: "4px",
            padding: "1px 8px", fontSize: "0.72rem", fontWeight: 800,
          }}>
            NPO
          </span>
        )}
      </div>

      {/* NP-1.1.1: Energy — with pull button */}
      <Field label="NP-1.1.1 — Energy (kcal/day)">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ flex: 1 }}>
            <NumInput
              value={oral.energyKcal}
              onChange={(v) => update({ energyKcal: v })}
              placeholder="e.g. 2000"
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <PullFromStandardsButton
              onPull={handlePull}
              include={["energy", "protein"]}
            />
          )}
        </div>
      </Field>

      {/* NP-1.1.2: Nutrient modifiers */}
      <Field label="NP-1.1.2 — Nutrient Modifications">
        {oral.nutrientModifiers.map((row) => (
          <NutrientRow
            key={row.id}
            row={row}
            onChange={(updated) => updateNutrientRow(row.id, updated)}
            onRemove={() => removeNutrientRow(row.id)}
          />
        ))}
        <button
          onClick={addNutrientRow}
          disabled={disabled}
          style={{
            marginTop: "0.25rem",
            background: "transparent",
            border: "1px solid #3498db",
            color: "#3498db",
            borderRadius: "4px",
            padding: "3px 10px",
            fontSize: "0.75rem",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
           Add nutrient
        </button>
      </Field>

      {/* NP-1.1.3: Foods and eating patterns */}
      <Field label="NP-1.1.3 — Foods and Eating Patterns">
        <ChipGroup
          options={FOODS_AND_PATTERNS_OPTIONS}
          value={oral.foodsAndPatterns}
          onChange={(v) => update({ foodsAndPatterns: v as string[] })}
          multiSelect={true}
        />
      </Field>

      {/* NP-1.1.4: Texture modification */}
      <Field label="NP-1.1.4 — Texture Modification">
        <SelectInput
          value={oral.textureModification}
          onChange={(v) => update({ textureModification: v })}
          options={NP_TEXTURE_OPTIONS}
          placeholder="Select IDDSI level…"
          disabled={disabled}
        />
      </Field>

      {/* NP-1.1.5: Oral supplements */}
      <Field label="NP-1.1.5 — Oral Nutrition Supplements">
        <textarea
          value={oral.oralSupplements}
          onChange={(e) => update({ oralSupplements: e.target.value })}
          placeholder="e.g. Standard 1.5 kcal/mL supplement, twice daily"
          disabled={disabled}
          style={{ minHeight: "60px", width: "100%", boxSizing: "border-box" }}
        />
      </Field>

      {/* NP-1.1.7: Values inclusion */}
      <Field label="NP-1.1.7 — Values Inclusion">
        <textarea
          value={oral.valuesInclusion}
          onChange={(e) => update({ valuesInclusion: e.target.value })}
          placeholder="Any cultural, religious, or personal values to incorporate…"
          disabled={disabled}
          style={{ minHeight: "50px", width: "100%", boxSizing: "border-box" }}
        />
      </Field>

    </div>
  );
}