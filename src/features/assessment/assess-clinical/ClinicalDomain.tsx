// src/features/assessment/assess-clinical/ClinicalDomain.tsx
// Phase 5: Reads useUIStore directly. No props for domain state.

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { CLINICAL_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";
import { useUIStore } from "../../../stores/useUIStore";

import ClinicalC1C2 from "./ClinicalC1C2";
import ClinicalC3C4 from "./ClinicalC3C4";
import ClinicalC5NFPE from "./ClinicalC5NFPE";
import ClinicalC6Imaging from "./ClinicalC6Imaging";

export default function ClinicalDomain() {
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  const title =
    CLINICAL_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ??
    "Clinical Findings & NFPE";

  const renderContent = () => {
    switch (activeSubDomain) {
      case "C1":
      case "C2":
        return <ClinicalC1C2 />;
      case "C3":
      case "C4":
        return <ClinicalC3C4 />;
      case "C5":
        return <ClinicalC5NFPE />;
      case "C6":
        return <ClinicalC6Imaging />;
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