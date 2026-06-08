// src/features/assessment/assess-refeeding/RefeedingResult.tsx
import type { OverallRisk, CriterionResult } from "../../../types/refeedingScreen";
import { riskColor, riskLabel } from "../../../shared/utils/refeedingScreenLogic";

interface Props {
  overall: OverallRisk;
  criteria: CriterionResult[];
}

const SOURCE_LABEL: Record<string, string> = {
  auto: "Auto",
  manual: "Manual",
  clinical_judgment: "CJ",
};

export function RefeedingResult({ overall, criteria }: Props) {
  const color = riskColor(overall.level);
  const isNone = overall.level === "none";

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${color}`,
        background: isNone ? "transparent" : `${color}06`,
      }}
    >
      {/* Result header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary)" }}>
          Risk Assessment Summary
        </div>
        <div
          style={{
            background: color,
            color: "#fff",
            borderRadius: "8px",
            padding: "4px 16px",
            fontSize: "0.82rem",
            fontWeight: 800,
          }}
        >
          {isNone ? "Low / Not at Risk" : riskLabel(overall.level)}
        </div>
      </div>

      {/* Scoring logic */}
      <div
        style={{
          fontSize: "0.72rem",
          color: "#4a5568",
          background: "var(--bg-color)",
          borderRadius: "5px",
          padding: "6px 10px",
          marginBottom: "0.65rem",
        }}
      >
        <b>ASPEN Scoring Logic:</b> ≥ 1 Significant criterion → Significant Risk · ≥ 2 Moderate criteria → Moderate Risk ·
        <span style={{ color: "#e74c3c", fontWeight: 700 }}> Significant: {overall.significantCount}</span>
        {" "}/{" "}
        <span style={{ color: "#da7f2b", fontWeight: 700 }}> Moderate: {overall.moderateCount}</span>
      </div>

      {/* Criteria grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {criteria.map((c) => {
          const cr = riskColor(c.risk);
          const met = c.risk !== "none";
          return (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 8px",
                borderRadius: "5px",
                background: met ? `${cr}08` : "var(--bg-color)",
                border: `1px solid ${met ? `${cr}30` : "var(--border)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: met ? cr : "#a0aec0",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#2c3e50" }}>
                  {c.label}
                </span>
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "#a0aec0",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "0 5px",
                  }}
                >
                  {SOURCE_LABEL[c.source] ?? c.source}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: met ? cr : "#27ae60",
                }}
              >
                {met ? riskLabel(c.risk) : "Not Met"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}