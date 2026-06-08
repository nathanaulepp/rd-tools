// src/features/assessment/assess-refeeding/C4_Electrolytes.tsx
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import type { RiskLevel, ElectrolyteCriterion } from "../../../types/refeedingScreen";
import { scoreElectrolytes, riskColor } from "../../../shared/utils/refeedingScreenLogic";
import { CriterionCard } from "./CriterionCard";

export function C4_Electrolytes() {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();
  const computedRisk = scoreElectrolytes(s.c4_electrolytes);

  const setElec = (key: keyof ElectrolyteCriterion, val: RiskLevel) =>
    setRefeedingScreen({
      c4_electrolytes: { ...s.c4_electrolytes, [key]: val },
    });

  const ELECS: { key: keyof ElectrolyteCriterion; symbol: string; name: string }[] = [
    { key: "potassium",  symbol: "K⁺",  name: "Potassium" },
    { key: "phosphorus", symbol: "PO₄³⁻", name: "Phosphorus" },
    { key: "magnesium",  symbol: "Mg²⁺", name: "Magnesium" },
  ];

  return (
    <CriterionCard
      number={4}
      label="Electrolytes [K, P, Mg]"
      computedRisk={computedRisk}
      sourceTag="clinical_judgment"
    >
      <div style={{ fontSize: "0.72rem", color: "#718096", marginBottom: "0.5rem" }}>
        Assess each electrolyte based on current labs and supplementation history. Select the highest applicable level.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {ELECS.map(({ key, symbol, name }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, minWidth: "110px", color: "#2c3e50" }}>
              {symbol} {name}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["none", "moderate", "significant"] as RiskLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setElec(key, lvl)}
                  style={{
                    fontSize: "0.67rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: "10px",
                    border: `1.5px solid ${lvl === "none" ? "#27ae60" : riskColor(lvl)}`,
                    background:
                      s.c4_electrolytes[key] === lvl
                        ? lvl === "none"
                          ? "#27ae60"
                          : riskColor(lvl)
                        : "transparent",
                    color:
                      s.c4_electrolytes[key] === lvl
                        ? "#fff"
                        : lvl === "none"
                        ? "#27ae60"
                        : riskColor(lvl),
                    cursor: "pointer",
                  }}
                >
                  {lvl === "none" ? "Normal" : lvl === "moderate" ? "Moderate" : "Significant"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Descriptor table */}
      <div style={{ marginTop: "0.65rem", padding: "0.5rem", background: "var(--bg-color)", borderRadius: "5px" }}>
        <div style={{ fontSize: "0.67rem", fontWeight: 700, color: "#718096", marginBottom: "4px", textTransform: "uppercase" }}>Criterion Descriptors</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#da7f2b", flexShrink: 0, marginTop: "3px" }} />
            <span style={{ fontSize: "0.69rem", color: "#4a5568" }}>
              <b>Moderate:</b> Minimally low levels OR normal current levels with recent low levels necessitating minimal or single-dose supplementation
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e74c3c", flexShrink: 0, marginTop: "3px" }} />
            <span style={{ fontSize: "0.69rem", color: "#4a5568" }}>
              <b>Significant:</b> Moderately/significantly low levels OR minimally low/normal levels with recent low levels necessitating significant or multiple-dose supplementation
            </span>
          </div>
        </div>
      </div>
    </CriterionCard>
  );
}