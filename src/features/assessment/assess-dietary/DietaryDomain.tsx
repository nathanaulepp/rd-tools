// src/features/assessment/assess-dietary/DietaryDomain.tsx
// Phase 5: Reads useUIStore directly. No props for domain state.

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { DIETARY_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";
import { useUIStore } from "../../../stores/useUIStore";

import D1NutritionRx from "./D1NutritionRx";
import DietaryD2Intake from "./DietaryD2Intake";
import DietaryD3toD9 from "./DietaryD3toD9";
import DietaryD8Supplements from "./DietaryD8Supplements";

export default function DietaryDomain() {
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  const title =
    DIETARY_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ?? "Dietary";

  const renderContent = () => {
    switch (activeSubDomain) {
      case "D1":
        return <D1NutritionRx />;

      case "D2":
        return <DietaryD2Intake />;

      case "D3":
      case "D4":
      case "D5":
      case "D6":
      case "D7":
      case "D9":
        return <DietaryD3toD9 />;

      case "D8":
        return <DietaryD8Supplements />;

      default:
        return <div>Select a sub-domain from the sidebar.</div>;
    }
  };

  return (
    <div className="fade-in">
      <DomainHeader title={title} />
      {renderContent()}
    </div>
  );
}