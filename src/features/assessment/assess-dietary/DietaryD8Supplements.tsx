// src/features/assessment/assess-dietary/DietaryD8Supplements.tsx
// Phase 5: Reads useDietaryStore and useClinicalStore directly. No props for domain state.

import React, { useMemo } from "react";
import { AlertBanner } from "../../../shared/ui/AlertBanner";
import DrugNutrientInteractionTable from "./DrugNutrientInteractionTable";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import type { Dietary } from "../../../types";

export default function DietaryD8Supplements() {
  const { dietary, setDietary } = useDietaryStore();
  const { clinical } = useClinicalStore();

  const handleUpdate = (field: keyof Dietary, val: any) =>
    setDietary({ [field]: val } as Partial<Dietary>);

  const drugs = useMemo(() => {
    try {
      const parsed = JSON.parse(clinical?.medications || "[]");
      if (Array.isArray(parsed)) return parsed.map((d: any) => d.name).filter(Boolean);
    } catch {
      return (clinical?.medications || "")
        .split(/[,;\n]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [clinical?.medications]);

  const supplements = useMemo(() => {
    const list = [
      ...(dietary?.herbalCAM || "").split(/[,;\n]+/),
      ...(dietary?.supplements || "").split(/[,;\n]+/),
    ];
    return list.map((s) => s.trim()).filter(Boolean);
  }, [dietary?.herbalCAM, dietary?.supplements]);

  return (
    <div className="card">
      <AlertBanner
        type="warning"
        message="Check Domain B for potential Drug-Nutrient Interactions related to Potassium."
      />

      <div className="grid-2-col">
        <div className="input-group">
          <label>D83: Supplement Products</label>
          <textarea
            value={dietary?.herbalCAM || ""}
            onChange={(e) => handleUpdate("herbalCAM", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>D84: Vitamin & Mineral Supplements</label>
          <textarea
            value={dietary?.supplements || ""}
            onChange={(e) => handleUpdate("supplements", e.target.value)}
          />
        </div>
      </div>

      <DrugNutrientInteractionTable drugs={drugs} supplements={supplements} />
    </div>
  );
}