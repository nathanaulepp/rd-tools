// src/features/assessment/assess-refeeding/C5_FatLoss.tsx
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import type { RiskLevel } from "../../../types/refeedingScreen";
import { CriterionCard } from "./CriterionCard";

interface Props {
  autoRisk: RiskLevel;
  computedRisk: RiskLevel;
  orbital: string;
  cheek: string;
  tricepsFat: string;
  midAxillary: string;
}

const SITE_LABELS: Record<string, string> = {
  orbital: "Orbital",
  cheek: "Cheek / Buccal",
  tricepsFat: "Triceps",
  midAxillary: "Mid-Axillary",
};

export function C5_FatLoss({ computedRisk, orbital, cheek, tricepsFat, midAxillary }: Props) {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();

  const sites = { orbital, cheek, tricepsFat, midAxillary };
  const hasSiteData = Object.values(sites).some((v) => v && v !== "");

  const severityColor: Record<string, string> = {
    Normal: "#27ae60",
    Mild: "#f39c12",
    Moderate: "#da7f2b",
    Severe: "#e74c3c",
    "": "#a0aec0",
  };

  return (
    <CriterionCard
      number={5}
      label="Subcutaneous Fat Loss"
      computedRisk={computedRisk}
      override={s.c5_override}
      manualRisk={s.c5_manualRisk}
      onToggleOverride={(v) => setRefeedingScreen({ c5_override: v })}
      onManualRiskChange={(v) => setRefeedingScreen({ c5_manualRisk: v })}
      sourceTag={hasSiteData ? "auto" : "unavailable"}
    >
      {hasSiteData ? (
        <div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.4rem" }}>
            {Object.entries(sites).map(([key, val]) => (
              <div
                key={key}
                style={{
                  background: `${severityColor[val] ?? "#a0aec0"}15`,
                  border: `1px solid ${severityColor[val] ?? "#a0aec0"}50`,
                  borderRadius: "6px",
                  padding: "4px 10px",
                  textAlign: "center",
                  minWidth: "80px",
                }}
              >
                <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 600, textTransform: "uppercase" }}>
                  {SITE_LABELS[key]}
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: severityColor[val] ?? "#a0aec0" }}>
                  {val || "—"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.69rem", color: "#718096" }}>
            Auto-populated from NFPE (C5). Any <b>Severe</b> = Significant risk · Any <b>Moderate</b> = Moderate risk.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "0.73rem", color: "#a0aec0" }}>
          No NFPE subcutaneous fat data entered. Complete the Clinical domain (C5 · NFPE) to enable auto-scoring, or use the override below.
        </div>
      )}

      <div style={{ marginTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Dot color="#da7f2b" text="Moderate: Evidence of moderate fat loss" />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Dot color="#e74c3c" text="Significant: Evidence of severe fat loss" />
        </div>
      </div>
    </CriterionCard>
  );
}

function Dot({ color, text }: { color: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: "0.69rem", color: "#4a5568" }}>{text}</span>
    </div>
  );
}