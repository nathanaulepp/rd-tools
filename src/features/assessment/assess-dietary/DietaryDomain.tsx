// src/features/assessment/assess-dietary/DietaryDomain.tsx
// Phase 3 refactor: pure container — delegates to sub-components.
//
//   D1  → D1NutritionRx
//   D2  → DietaryD2Intake
//   D3–D7, D9 → DietaryD3toD9
//   D8  → DietaryD8Supplements

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { DIETARY_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";

import D1NutritionRx from "./D1NutritionRx";
import DietaryD2Intake from "./DietaryD2Intake";
import DietaryD3toD9 from "./DietaryD3toD9";
import DietaryD8Supplements from "./DietaryD8Supplements";

interface DietaryDomainProps {
  dietary: any;
  setDietary: (d: any) => void;
  activeSubDomain: string;
  clinical: any;
}

export default function DietaryDomain({
  dietary,
  setDietary,
  activeSubDomain,
  clinical,
}: DietaryDomainProps) {
  const handleUpdate = (field: string, val: any) =>
    setDietary({ ...dietary, [field]: val });

  const title =
    DIETARY_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ?? "Dietary";

  const renderContent = () => {
    switch (activeSubDomain) {
      case "D1":
        return <D1NutritionRx dietary={dietary} setDietary={setDietary} />;

      case "D2":
        return <DietaryD2Intake dietary={dietary} handleUpdate={handleUpdate} />;

      case "D3":
      case "D4":
      case "D5":
      case "D6":
      case "D7":
      case "D9":
        return (
          <DietaryD3toD9
            dietary={dietary}
            handleUpdate={handleUpdate}
            activeSubDomain={activeSubDomain as "D3" | "D4" | "D5" | "D6" | "D7" | "D9"}
          />
        );

      case "D8":
        return (
          <DietaryD8Supplements
            dietary={dietary}
            handleUpdate={handleUpdate}
            clinical={clinical}
          />
        );

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