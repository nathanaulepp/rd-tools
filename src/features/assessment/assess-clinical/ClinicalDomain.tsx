// src/features/assessment/assess-clinical/ClinicalDomain.tsx

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";

import ClinicalC1VitalSigns from "./ClinicalC1VitalSigns";
import ClinicalC2GISystemic from "./ClinicalC2GISystemic";
import ClinicalC4NFPE from "./ClinicalC4NFPE";
import ClinicalC5Radiology from "./ClinicalC5Radiology";
import ClinicalC6Medications from "./ClinicalC6Medications";

export default function ClinicalDomain() {

  return (
    <div className="fade-in">
      <DomainHeader title="Clinical Findings & NFPE" />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div id="clinical-C1" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC1VitalSigns />
        </div>
        <div id="clinical-C2" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC2GISystemic />
        </div>
        <div id="clinical-C3" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC4NFPE />
        </div>
        <div id="clinical-C4" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC5Radiology />
        </div>
        <div id="clinical-C5" style={{ scrollMarginTop: "1rem" }}>
          <ClinicalC6Medications />
        </div>
      </div>
    </div>
  );
}