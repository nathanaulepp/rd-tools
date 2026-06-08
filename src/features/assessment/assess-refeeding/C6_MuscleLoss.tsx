// src/features/assessment/assess-refeeding/C6_MuscleLoss.tsx
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import type { RiskLevel } from "../../../types/refeedingScreen";
import { CriterionCard } from "./CriterionCard";

interface Props {
  autoRisk: RiskLevel;
  computedRisk: RiskLevel;
  temples: string;
  clavicles: string;
  shoulders: string;
  scapula: string;
  interosseous: string;
  thighs: string;
  calves: string;
}

const MUSCLE_LABELS: Record<string, string> = {
  temples: "Temples",
  clavicles: "Clavicles",
  shoulders: "Shoulders",
  scapula: "Scapula",
  interosseous: "Interosseous",
  thighs: "Thighs",
  calves: "Calves",
};

export function C6_MuscleLoss({ computedRisk, ...sites }: Props) {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();

  const siteMap = {
    temples: sites.temples,
    clavicles: sites.clavicles,
    shoulders: sites.shoulders,
    scapula: sites.scapula,
    interosseous: sites.interosseous,
    thighs: sites.thighs,
    calves: sites.calves,
  };

  const hasSiteData = Object.values(siteMap).some((v) => v && v !== "");

  const severityColor: Record<string, string> = {
    Normal: "#27ae60",
    Mild: "#f39c12",
    Moderate: "#da7f2b",
    Severe: "#e74c3c",
    "": "#a0aec0",
  };

  return (
    <CriterionCard
      number={6}
      label="Muscle Wasting"
      computedRisk={computedRisk}
      override={s.c6_override}
      manualRisk={s.c6_manualRisk}
      onToggleOverride={(v) => setRefeedingScreen({ c6_override: v })}
      onManualRiskChange={(v) => setRefeedingScreen({ c6_manualRisk: v })}
      sourceTag={hasSiteData ? "auto" : "unavailable"}
    >
      {hasSiteData ? (
        <div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "0.4rem" }}>
            {Object.entries(siteMap).map(([key, val]) => (
              <div
                key={key}
                style={{
                  background: `${severityColor[val] ?? "#a0aec0"}15`,
                  border: `1px solid ${severityColor[val] ?? "#a0aec0"}50`,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  textAlign: "center",
                  minWidth: "72px",
                }}
              >
                <div style={{ fontSize: "0.6rem", color: "#718096", fontWeight: 600, textTransform: "uppercase" }}>
                  {MUSCLE_LABELS[key]}
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: severityColor[val] ?? "#a0aec0" }}>
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
          No NFPE muscle wasting data entered. Complete the Clinical domain (C5 · NFPE) to enable auto-scoring, or use the override below.
        </div>
      )}

      <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "2px" }}>
        <Dot color="#da7f2b" text="Moderate: Evidence of severe loss (per ASPEN — appears in both moderate and significant columns)" />
        <Dot color="#e74c3c" text="Significant: Evidence of severe loss" />
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