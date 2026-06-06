import React from "react";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import NpOralSection from "./NpOralSection";
import NpEnteralSection from "./NpEnteralSection";
import NpParenteralSection from "./NpParenteralSection";
import NpIvFluidSection from "./NpIvFluidSection";

type NpMode = "oral" | "enteral" | "parenteral" | "ivfluid";

const MODE_OPTIONS: { key: NpMode; label: string; color: string }[] = [
  { key: "oral",       label: "Oral (NP-1.1)",        color: "#27ae60" },
  { key: "enteral",    label: "Enteral (NP-1.2)",      color: "#8e44ad" },
  { key: "parenteral", label: "Parenteral (NP-1.3)",   color: "#8e44ad" },
  { key: "ivfluid",   label: "IV Fluid (NP-1.4)",     color: "#2980b9" },
];

export default function NutritionPrescriptionPanel() {
  const { intervention, setIntervention } = useInterventionStore();
  const activeModes = intervention.npActiveModes ?? [];

  function toggleMode(mode: NpMode) {
    const next = activeModes.includes(mode)
      ? activeModes.filter(m => m !== mode)
      : [...activeModes, mode];
    setIntervention({ npActiveModes: next });
  }

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <SectionHeader title="NP: Nutrition Prescription" color="#2c3e50" subtitle="Select active delivery modes for this patient" />

      {/* Mode toggle chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
        {MODE_OPTIONS.map(({ key, label, color }) => {
          const isActive = activeModes.includes(key);
          return (
            <div
              key={key}
              onClick={() => toggleMode(key)}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                border: `2px solid ${color}`,
                background: isActive ? color : "transparent",
                color: isActive ? "#fff" : color,
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.2s",
                userSelect: "none",
              }}
            >
              {isActive ? "✓ " : ""}{label}
            </div>
          );
        })}
      </div>

      {activeModes.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontStyle: "italic", padding: "0.5rem 0" }}>
          Select one or more delivery modes above to document the nutrition prescription.
        </div>
      )}

      {activeModes.includes("oral") && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#27ae60", marginBottom: "0.5rem", borderLeft: "3px solid #27ae60", paddingLeft: "8px" }}>
            Oral Nutrition (NP-1.1)
          </div>
          <NpOralSection />
        </div>
      )}

      {activeModes.includes("enteral") && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#8e44ad", marginBottom: "0.5rem", borderLeft: "3px solid #8e44ad", paddingLeft: "8px" }}>
            Enteral Nutrition (NP-1.2)
          </div>
          <NpEnteralSection />
        </div>
      )}

      {activeModes.includes("parenteral") && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#8e44ad", marginBottom: "0.5rem", borderLeft: "3px solid #8e44ad", paddingLeft: "8px" }}>
            Parenteral Nutrition (NP-1.3)
          </div>
          <NpParenteralSection />
        </div>
      )}

      {activeModes.includes("ivfluid") && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2980b9", marginBottom: "0.5rem", borderLeft: "3px solid #2980b9", paddingLeft: "8px" }}>
            IV Fluid (NP-1.4)
          </div>
          <NpIvFluidSection />
        </div>
      )}
    </div>
  );
}