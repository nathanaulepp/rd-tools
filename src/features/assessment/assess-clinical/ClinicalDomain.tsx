// src/features/assessment/assess-clinical/ClinicalDomain.tsx
// Phase 5: Reads useUIStore directly. No props for domain state.

import React, { useEffect } from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { useUIStore } from "../../../stores/useUIStore";

import ClinicalC1MedicalContext from "./ClinicalC1MedicalContext";
import ClinicalC2VitalSigns from "./ClinicalC2VitalSigns";
import ClinicalC3GISystemic from "./ClinicalC3GISystemic";
import ClinicalC4NFPE from "./ClinicalC4NFPE";
import ClinicalC5Radiology from "./ClinicalC5Radiology";
import ClinicalC6Medications from "./ClinicalC6Medications";

export default function ClinicalDomain() {
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  useEffect(() => {
    if (activeSubDomain) {
      // Find the element by ID and scroll it into view smoothly
      const el = document.getElementById(`clinical-${activeSubDomain}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [activeSubDomain]);

  return (
    <div className="fade-in">
      <DomainHeader title="Clinical Findings & NFPE" />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div id="clinical-C1" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC1MedicalContext />
        </div>
        <div id="clinical-C2" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC2VitalSigns />
        </div>
        <div id="clinical-C3" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC3GISystemic />
        </div>
        <div id="clinical-C4" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC4NFPE />
        </div>
        <div id="clinical-C5" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC5Radiology />
        </div>
        <div id="clinical-C6" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC6Medications />
        </div>
      </div>
    </div>
  );
}