import React, { useState } from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { Field } from "../../../shared/ui/Field";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import type { NdMealsSnacks } from "../../../types/intervention";
import type { CategorizedOption } from "../../../shared/constants/interventionNdConstants";
import {
  ND1_DIET_TYPES,
  ND1_PROTEIN_MODS,
  ND1_AMINO_ACID_MODS,
  ND1_CARB_MODS,
  ND1_FAT_MODS,
  ND1_FIBER_MODS,
  ND1_FLUID_MODS,
  ND1_MINERAL_MODS,
  ND1_VITAMIN_MODS,
  ND1_FOOD_GROUP_MODS,
  ND1_SPECIFIC_FOOD_MODS,
  ND1_INTAKE_TIMING,
  ND1_OTHER,
} from "../../../shared/constants/interventionNdConstants";
import { NP_TEXTURE_OPTIONS } from "../../../shared/constants/interventionNpConstants";

// Two-level chip expansion for CategorizedOption arrays
function CategorizedChips({
  options,
  value,
  onChange,
}: {
  options: CategorizedOption[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);

  function toggleExpand(label: string) {
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  }

  function toggleChild(child: string, parent: string) {
    let next: string[];
    if (value.includes(child)) {
      next = value.filter(v => v !== child);
      // Remove parent if no children remain selected
      const siblings = options.find(o => o.label === parent)?.children ?? [];
      const remainingSiblings = next.filter(v => siblings.includes(v));
      if (remainingSiblings.length === 0) {
        next = next.filter(v => v !== parent);
      }
    } else {
      next = [...value.filter(v => v !== parent), parent, child];
    }
    onChange(next);
  }

  function toggleParent(parent: string, children?: string[]) {
    if (children && children.length > 0) {
      // Expand/collapse; parent selected by selecting a child
      toggleExpand(parent);
    } else {
      // Leaf parent — toggle directly
      const next = value.includes(parent)
        ? value.filter(v => v !== parent)
        : [...value, parent];
      onChange(next);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {options.map(opt => {
        const isParentSelected = value.includes(opt.label);
        const isExpanded = expanded.includes(opt.label);
        const hasChildren = opt.children && opt.children.length > 0;
        const selectedChildCount = hasChildren
          ? (opt.children ?? []).filter(c => value.includes(c)).length
          : 0;

        return (
          <div key={opt.label}>
            <div
              className={`chip ${isParentSelected ? "active" : ""}`}
              onClick={() => toggleParent(opt.label, opt.children)}
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              {opt.label}
              {hasChildren && (
                <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>
                  {selectedChildCount > 0 ? ` (${selectedChildCount})` : ""} {isExpanded ? "▲" : "▼"}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div style={{ marginLeft: "1rem", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px", paddingBottom: "4px" }}>
                {(opt.children ?? []).map(child => (
                  <div
                    key={child}
                    className={`chip ${value.includes(child) ? "active" : ""}`}
                    onClick={() => toggleChild(child, opt.label)}
                    style={{ cursor: "pointer", fontSize: "0.68rem" }}
                  >
                    {child}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Inner accordion for each ND-1 sub-category
function SubAccordion({ label, badge, color, children }: { label: string; badge?: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "4px" }}>
      <CollapseHeader label={label} expanded={open} onToggle={() => setOpen(o => !o)} accent={color} badge={badge ?? null} />
      {open && (
        <div style={{ border: `1px solid ${color}30`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: "0.75rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function NdFoodDeliverySection() {
  const { intervention, setIntervention } = useInterventionStore();
  const ms = intervention.ndMealsSnacks;
  const update = (patch: Partial<NdMealsSnacks>) =>
    setIntervention({ ndMealsSnacks: { ...ms, ...patch } });

  const countSelected = (arr: string[]) => arr.length > 0 ? `${arr.length} selected` : null;

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>

      <SubAccordion label="General Diet Types & Patterns" color="#3498db" badge={countSelected(ms.selectedDietTypes) ?? undefined}>
        <Field label="Select applicable diet types">
          <ChipGroup options={ND1_DIET_TYPES} value={ms.selectedDietTypes} onChange={v => update({ selectedDietTypes: v as string[] })} multiSelect />
        </Field>
      </SubAccordion>

      <SubAccordion label="Texture Modification" color="#3498db" badge={ms.textureLevel ? "1 selected" : undefined}>
        <Field label="IDDSI Texture Level">
          <SelectInput value={ms.textureLevel} onChange={v => update({ textureLevel: v })} options={NP_TEXTURE_OPTIONS} placeholder="Select texture level..." />
        </Field>
      </SubAccordion>

      <SubAccordion label="Protein Modifications" color="#e67e22" badge={countSelected(ms.proteinMods) ?? undefined}>
        <Field label="Protein modification options">
          <ChipGroup options={ND1_PROTEIN_MODS} value={ms.proteinMods} onChange={v => update({ proteinMods: v as string[] })} multiSelect />
        </Field>
      </SubAccordion>

      <SubAccordion label="Amino Acid Modifications" color="#e67e22" badge={countSelected(ms.aminoAcidMods) ?? undefined}>
        <CategorizedChips options={ND1_AMINO_ACID_MODS} value={ms.aminoAcidMods} onChange={v => update({ aminoAcidMods: v })} />
      </SubAccordion>

      <SubAccordion label="Carbohydrate Modifications" color="#f39c12" badge={countSelected(ms.carbMods) ?? undefined}>
        <CategorizedChips options={ND1_CARB_MODS} value={ms.carbMods} onChange={v => update({ carbMods: v })} />
      </SubAccordion>

      <SubAccordion label="Fat Modifications" color="#f39c12" badge={countSelected(ms.fatMods) ?? undefined}>
        <CategorizedChips options={ND1_FAT_MODS} value={ms.fatMods} onChange={v => update({ fatMods: v })} />
      </SubAccordion>

      <SubAccordion label="Fiber Modifications" color="#27ae60" badge={countSelected(ms.fiberMods) ?? undefined}>
        <ChipGroup options={ND1_FIBER_MODS} value={ms.fiberMods} onChange={v => update({ fiberMods: v as string[] })} multiSelect />
      </SubAccordion>

      <SubAccordion label="Fluid Modifications" color="#27ae60" badge={countSelected(ms.fluidMods) ?? undefined}>
        <ChipGroup options={ND1_FLUID_MODS} value={ms.fluidMods} onChange={v => update({ fluidMods: v as string[] })} multiSelect />
      </SubAccordion>

      <SubAccordion label="Mineral Modifications" color="#8e44ad" badge={countSelected(ms.mineralMods) ?? undefined}>
        <CategorizedChips options={ND1_MINERAL_MODS} value={ms.mineralMods} onChange={v => update({ mineralMods: v })} />
      </SubAccordion>

      <SubAccordion label="Vitamin Modifications" color="#8e44ad" badge={countSelected(ms.vitaminMods) ?? undefined}>
        <CategorizedChips options={ND1_VITAMIN_MODS} value={ms.vitaminMods} onChange={v => update({ vitaminMods: v })} />
      </SubAccordion>

      <SubAccordion label="Food Group Modifications" color="#2c3e50" badge={countSelected(ms.foodGroupMods) ?? undefined}>
        <ChipGroup options={ND1_FOOD_GROUP_MODS} value={ms.foodGroupMods} onChange={v => update({ foodGroupMods: v as string[] })} multiSelect />
      </SubAccordion>

      <SubAccordion label="Specific Food / Ingredient Modifications" color="#2c3e50" badge={countSelected(ms.specificFoodMods) ?? undefined}>
        <ChipGroup options={ND1_SPECIFIC_FOOD_MODS} value={ms.specificFoodMods} onChange={v => update({ specificFoodMods: v as string[] })} multiSelect />
      </SubAccordion>

      <SubAccordion label="Intake Timing" color="#16a085" badge={countSelected(ms.intakeTiming) ?? undefined}>
        <ChipGroup options={ND1_INTAKE_TIMING} value={ms.intakeTiming} onChange={v => update({ intakeTiming: v as string[] })} multiSelect />
      </SubAccordion>

      <SubAccordion label="Other" color="#7f8c8d" badge={countSelected(ms.other) ?? undefined}>
        <ChipGroup options={ND1_OTHER} value={ms.other} onChange={v => update({ other: v as string[] })} multiSelect />
      </SubAccordion>

      <div style={{ marginTop: "0.5rem" }}>
        <Field label="ND-1 Notes">
          <textarea value={ms.notes} onChange={e => update({ notes: e.target.value })} placeholder="Additional meals and snacks notes..." style={{ minHeight: "55px" }} />
        </Field>
      </div>
    </div>
  );
}