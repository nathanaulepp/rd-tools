// src/features/intervention/InterventionDomain.tsx
// All state reads happen in child components.

import React from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { useInterventionStore } from "../../stores/useInterventionStore";
import NutritionPrescriptionPanel from "./rx-planning/NutritionPrescriptionPanel";
import InterventionImplementationPanel from "./implementation/InterventionImplementationPanel";

export default function InterventionDomain() {
  const { intervention, setIntervention } = useInterventionStore();

  return (
    <div className="fade-in">
      <DomainHeader title="I. Nutrition Intervention" />

      {/* Section 1: Nutrition Prescription (NP) */}
      <NutritionPrescriptionPanel />

      {/* Section 2: NCP Intervention Implementation (ND/E/C/RC) */}
      <InterventionImplementationPanel />

      {/* Retained: SMART Goals */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#27ae60", marginBottom: "0.75rem", borderLeft: "4px solid #27ae60", paddingLeft: "10px" }}>
          Intervention Goals
        </div>
        <div className="input-group">
          <label>SMART Goals</label>
          <textarea
            value={intervention.goalStatement || ""}
            onChange={e => setIntervention({ goalStatement: e.target.value })}
            placeholder="Consolidate SMART goals here (Statement, Timeframe, Measurable outcomes)..."
            style={{ minHeight: "120px" }}
          />
        </div>
      </div>

      {/* Retained: Intervention Notes */}
      <div className="card">
        <div className="input-group">
          <label>Intervention Notes</label>
          <textarea
            value={intervention.interventionNotes || ""}
            onChange={e => setIntervention({ interventionNotes: e.target.value })}
            placeholder="Any additional narrative or clinical context..."
            style={{ minHeight: "80px" }}
          />
        </div>
      </div>
    </div>
  );
}