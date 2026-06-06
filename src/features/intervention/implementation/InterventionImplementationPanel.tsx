// src/features/intervention/implementation/InterventionImplementationPanel.tsx

import React from "react";
import { INTERVENTION_TREE } from "../../../shared/constants/interventionTree";
import InterventionRail from "./InterventionRail";
import LeafNoteMap from "./LeafNoteMap";

export default function InterventionImplementationPanel() {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: "0.95rem",
          color: "var(--primary)",
          marginBottom: "0.75rem",
          paddingBottom: "0.4rem",
          borderBottom: "2px solid var(--bg-color)",
        }}
      >
        NCP Intervention Implementation
      </div>

      <InterventionRail tree={INTERVENTION_TREE} />

      <LeafNoteMap />
    </div>
  );
}