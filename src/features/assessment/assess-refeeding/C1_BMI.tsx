// src/features/assessment/assess-refeeding/C1_BMI.tsx
import { CSSProperties } from "react";
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import type { RiskLevel } from "../../../types/refeedingScreen";
import { CriterionCard } from "./CriterionCard";

interface Props {
  bmiNum: number;
  isPediatric: boolean;
  bmiZ: number | null;
  computedRisk: RiskLevel;
}

export function C1_BMI({ bmiNum, isPediatric, bmiZ, computedRisk }: Props) {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();

  const hasBMI = bmiNum > 0;
  const displayBMI = hasBMI ? bmiNum.toFixed(1) : "—";
  const displayZ = bmiZ !== null ? bmiZ.toFixed(2) : "—";

  return (
    <CriterionCard
      number={1}
      label="BMI"
      computedRisk={computedRisk}
      override={s.c1_override}
      manualRisk={s.c1_manualRisk}
      onToggleOverride={(v) => setRefeedingScreen({ c1_override: v })}
      onManualRiskChange={(v) => setRefeedingScreen({ c1_manualRisk: v })}
      sourceTag={hasBMI ? "auto" : "unavailable"}
    >
      {/* Auto-populated display */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={statBox}>
          <span style={statLabel}>Current BMI</span>
          <span style={{ ...statValue, color: hasBMI ? "#3498db" : "#a0aec0" }}>
            {displayBMI} <span style={{ fontSize: "0.7rem", fontWeight: 400 }}>kg/m²</span>
          </span>
        </div>

        {isPediatric && (
          <div style={statBox}>
            <span style={statLabel}>BMI Z-Score</span>
            <span style={{ ...statValue, color: bmiZ !== null ? "#9b59b6" : "#a0aec0" }}>
              {displayZ}
            </span>
          </div>
        )}

        <div style={thresholdBox}>
          {isPediatric ? (
            <>
              <span style={threshLine}><span style={{ color: "#e74c3c", fontWeight: 700 }}>Significant:</span> z-score &lt; -3</span>
              <span style={threshLine}><span style={{ color: "#da7f2b", fontWeight: 700 }}>Moderate:</span> z-score -2 to -3</span>
            </>
          ) : (
            <>
              <span style={threshLine}><span style={{ color: "#e74c3c", fontWeight: 700 }}>Significant:</span> &lt;16 kg/m²</span>
              <span style={threshLine}><span style={{ color: "#da7f2b", fontWeight: 700 }}>Moderate:</span> 16–18.5 kg/m²</span>
            </>
          )}
        </div>
      </div>

      {!hasBMI && (
        <div style={{ fontSize: "0.73rem", color: "#a0aec0", marginTop: "6px" }}>
          BMI not yet calculated — enter height and weight in the Anthropometrics domain.
        </div>
      )}
    </CriterionCard>
  );
}

const statBox: CSSProperties = {
  display: "flex", flexDirection: "column",
};
const statLabel: CSSProperties = {
  fontSize: "0.68rem", color: "#718096", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const statValue: CSSProperties = {
  fontSize: "1.35rem", fontWeight: 700,
};
const thresholdBox: CSSProperties = {
  display: "flex", flexDirection: "column", gap: "2px",
};
const threshLine: CSSProperties = {
  fontSize: "0.72rem", color: "#4a5568",
};