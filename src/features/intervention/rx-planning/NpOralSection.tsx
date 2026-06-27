// src/features/intervention/rx-planning/NpOralSection.tsx
// NP-1.1: Oral Nutrition prescription fields.
// Reads/writes intervention.npOral via useInterventionStore directly — no props for state.
// Depends on: interventionNpConstants, shared UI primitives.

import React, { useState } from "react";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { Field }       from "../../../shared/ui/Field";
import { NumInput }    from "../../../shared/ui/NumInput";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { PullFromStandardsButton } from "../../../shared/ui/PullFromStandardsButton";
import {
  NP_NUTRIENT_OPTIONS,
  NP_NUTRIENT_UNITS,
} from "../../../shared/constants/interventionNpConstants";
import type { NpOralNutrition, NutrientModifier } from "../../../types/intervention";
import type { ParsedTargets } from "../../../shared/utils/parseStandardsTargets";
import { getAllDiets, getAllDysphagiaeMods } from "../../../shared/api/db";
import type { HospitalDiet } from "../../../types";

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



// ── Diet Order Picker ─────────────────────────────────────────────────────────

interface NpDietOrderPickerProps {
  value: string[];
  onChange: (val: string[]) => void;
}

function NpDietOrderPicker({ value, onChange }: NpDietOrderPickerProps) {
  const [diets, setDiets] = useState<HospitalDiet[]>([]);

  React.useEffect(() => {
    let active = true;
    getAllDiets()
      .then((dList) => { if (active) setDiets(dList); })
      .catch((err) => console.error("Failed to load diets in NpDietOrderPicker", err));
    return () => { active = false; };
  }, []);

  const selected = Array.isArray(value) ? value : (value ? [value] : []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = Array.from(e.target.selectedOptions).map(o => o.value);
    onChange(chosen);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
      <select
        multiple
        value={selected}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "4px 6px",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
          fontSize: "0.85rem",
          boxSizing: "border-box",
          minHeight: "90px",
          fontFamily: "inherit",
        }}
      >
        {diets.map((d) => (
          <option key={d.id} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div style={{ fontSize: "0.7rem", color: "#64748b", fontStyle: "italic" }}>
          {selected.length} diet{selected.length !== 1 ? "s" : ""} selected — Ctrl/Cmd+click to deselect
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NpOralSection() {
  const { intervention, setIntervention } = useInterventionStore();
  const oral = intervention.npOral;

  const [foodConsistencyOptions, setFoodConsistencyOptions] = useState<string[]>([]);
  const [liquidConsistencyOptions, setLiquidConsistencyOptions] = useState<string[]>([]);

  React.useEffect(() => {
    let active = true;
    getAllDysphagiaeMods().then((mods) => {
      if (active) {
        setFoodConsistencyOptions(mods.filter(m => m.category === "Food").map(m => m.name));
        setLiquidConsistencyOptions(mods.filter(m => m.category === "Liquid").map(m => m.name));
      }
    }).catch(err => {
      console.error("Failed to load dysphagia options in NpOralSection", err);
    });
    return () => { active = false; };
  }, []);

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

      {!oral.isNpo && (
        <>
          {/* NP-1.1.0: Diet Order */}
          <Field label="NP-1.1.0 — Diet Order">
            <NpDietOrderPicker
              value={oral.dietOrder ?? []}
              onChange={(v) => update({ dietOrder: v })}
            />
          </Field>

          {/* NP-1.1.1: Energy — with pull button */}
          <Field label="NP-1.1.1 — Energy (kcal/day)">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <NumInput
                  value={oral.energyKcal}
                  onChange={(v) => update({ energyKcal: v })}
                  placeholder="e.g. 2000"
                />
              </div>
              <PullFromStandardsButton
                onPull={handlePull}
                include={["energy", "protein"]}
              />
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
              style={{
                marginTop: "0.25rem",
                background: "transparent",
                border: "1px solid #3498db",
                color: "#3498db",
                borderRadius: "4px",
                padding: "3px 10px",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
               Add nutrient
            </button>
          </Field>



          {/* NP-1.1.4: Texture / Liquid modification */}
          <Field label="NP-1.1.4 — Texture & Liquid Modification">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", display: "block", marginBottom: "3px" }}>
                  Food Consistency
                </label>
                <SelectInput
                  value={oral.textureModification}
                  onChange={(v) => update({ textureModification: v })}
                  options={foodConsistencyOptions}
                  placeholder="— Food consistency —"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", display: "block", marginBottom: "3px" }}>
                  Liquid Consistency
                </label>
                <SelectInput
                  value={oral.liquidConsistency ?? ""}
                  onChange={(v) => update({ liquidConsistency: v })}
                  options={liquidConsistencyOptions}
                  placeholder="— Liquid consistency —"
                />
              </div>
            </div>
          </Field>

          {/* NP-1.1.5: Oral supplements */}
          <Field label="NP-1.1.5 — Oral Nutrition Supplements">
            <textarea
              value={oral.oralSupplements}
              onChange={(e) => update({ oralSupplements: e.target.value })}
              placeholder="e.g. Standard 1.5 kcal/mL supplement, twice daily"
              style={{ minHeight: "60px", width: "100%", boxSizing: "border-box" }}
            />
          </Field>

          {/* NP-1.1.7: Values inclusion */}
          <Field label="NP-1.1.7 — Values Inclusion">
            <textarea
              value={oral.valuesInclusion}
              onChange={(e) => update({ valuesInclusion: e.target.value })}
              placeholder="Any cultural, religious, or personal values to incorporate…"
              style={{ minHeight: "50px", width: "100%", boxSizing: "border-box" }}
            />
          </Field>
        </>
      )}
    </div>
  );
}