// src/features/assessment/assess-anthro/AnthroDomain.tsx
// Phase 5: Pure container — reads activeSubDomain from useUIStore,
// all domain state from stores. Zero props required from parent.

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { ASSESSMENT_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";
import { useUIStore } from "../../../stores/useUIStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";

import AnthroA1A7 from "./AnthroA1A7";
import AnthroA8 from "./AnthroA8";

export default function AnthroDomain() {
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);
  const { ageDays } = useCalculatedMetrics();

  const title =
    ASSESSMENT_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ??
    "Anthropometrics";

  const renderContent = () => {
    switch (activeSubDomain) {
      case "A1-A7":
        return <AnthroA1A7 />;
      case "A8":
        return <AnthroA8 />;
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