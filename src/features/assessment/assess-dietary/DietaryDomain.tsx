// src/features/assessment/assess-dietary/DietaryDomain.tsx
// Phase 5: Reads useUIStore directly. No props for domain state.

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { useUIStore } from "../../../stores/useUIStore";

import D1NutritionRx from "./D1NutritionRx";
import DietaryD2Intake from "./DietaryD2Intake";
import DietaryD3toD9 from "./DietaryD3toD9";

export default function DietaryDomain() {
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  React.useEffect(() => {
    if (activeSubDomain && activeSubDomain.startsWith("D")) {
      const el = document.getElementById(`dietary-${activeSubDomain}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [activeSubDomain]);

  return (
    <div className="fade-in">
      <DomainHeader title="Dietary Data" />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div id="dietary-D1" style={{ scrollMarginTop: "1rem" }}>
          <D1NutritionRx />
        </div>
        <div id="dietary-D2" style={{ scrollMarginTop: "1rem" }}>
          <DietaryD2Intake />
        </div>
        <div id="dietary-D3-D9" style={{ scrollMarginTop: "1rem" }}>
          <DietaryD3toD9 />
        </div>
      </div>
    </div>
  );
}