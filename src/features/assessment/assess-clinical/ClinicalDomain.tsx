// src/features/assessment/assess-clinical/ClinicalDomain.tsx
// Phase 3 refactor: pure container — delegates to sub-components.
//
//   C1, C2 → ClinicalC1C2
//   C3, C4 → ClinicalC3C4
//   C5     → ClinicalC5NFPE
//   C6     → ClinicalC6Imaging

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { CLINICAL_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";

import ClinicalC1C2 from "./ClinicalC1C2";
import ClinicalC3C4 from "./ClinicalC3C4";
import ClinicalC5NFPE from "./ClinicalC5NFPE";
import ClinicalC6Imaging from "./ClinicalC6Imaging";

interface ClinicalDomainProps {
  clinical: any;
  setClinical: (updates: any) => void;
  activeSubDomain: string;
}

export default function ClinicalDomain({
  clinical,
  setClinical,
  activeSubDomain,
}: ClinicalDomainProps) {
  const handleUpdate = (field: string, val: string | string[]) =>
    setClinical({ ...clinical, [field]: val });

  const title =
    CLINICAL_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ??
    "Clinical Findings & NFPE";

  const renderContent = () => {
    switch (activeSubDomain) {
      case "C1":
      case "C2":
        return (
          <ClinicalC1C2
            clinical={clinical}
            handleUpdate={handleUpdate}
            activeSubDomain={activeSubDomain as "C1" | "C2"}
          />
        );
      case "C3":
      case "C4":
        return (
          <ClinicalC3C4
            clinical={clinical}
            handleUpdate={handleUpdate}
            activeSubDomain={activeSubDomain as "C3" | "C4"}
          />
        );
      case "C5":
        return (
          <ClinicalC5NFPE clinical={clinical} handleUpdate={handleUpdate} />
        );
      case "C6":
        return (
          <ClinicalC6Imaging
            clinical={clinical}
            handleUpdate={handleUpdate}
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