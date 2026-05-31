// src/features/assessment/assess-anthro/AnthroDomain.tsx
// Phase 3 refactor: pure container (~40 lines).
// Delegates each sub-domain to its own component:
//   A1-A5 → AnthroA1A5
//   A6-A7 → AnthroA6A7
//   A8    → AnthroA8

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { ASSESSMENT_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";

import AnthroA1A5 from "./AnthroA1A5";
import AnthroA6A7 from "./AnthroA6A7";
import AnthroA8 from "./AnthroA8";

interface AnthroDomainProps {
  anthro: any;
  setAnthro: (updates: any) => void;
  dexaScans: any[];
  setDexaScans: (scans: any[]) => void;
  calculatedMetrics: any;
  patientData: any;
  dietary: any;
  activeSubDomain: string;
}

export default function AnthroDomain({
  anthro,
  setAnthro,
  dexaScans,
  setDexaScans,
  calculatedMetrics,
  patientData,
  activeSubDomain,
}: AnthroDomainProps) {
  const title =
    ASSESSMENT_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ??
    "Anthropometrics";

  const renderContent = () => {
    switch (activeSubDomain) {
      case "A1-A5":
        return (
          <AnthroA1A5
            anthro={anthro}
            setAnthro={setAnthro}
            calculatedMetrics={calculatedMetrics}
          />
        );
      case "A6-A7":
        return (
          <AnthroA6A7
            anthro={anthro}
            setAnthro={setAnthro}
            patientData={patientData}
            calculatedMetrics={calculatedMetrics}
          />
        );
      case "A8":
        return (
          <AnthroA8
            dexaScans={dexaScans}
            setDexaScans={setDexaScans}
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