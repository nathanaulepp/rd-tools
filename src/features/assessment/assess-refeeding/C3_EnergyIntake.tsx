// src/features/assessment/assess-refeeding/C3_EnergyIntake.tsx
import React from "react";
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import type { RiskLevel, EnergyIntakeOption } from "../../../types/refeedingScreen";
import { CriterionCard } from "./CriterionCard";

interface Props {
  computedRisk: RiskLevel;
  eeiPctFromDietary: string;   // dietary.eeiPercent (string)
  eeiDaysFromDietary: string;  // dietary.eeiTimeframe (string)
}

export function C3_EnergyIntake({ computedRisk, eeiPctFromDietary, eeiDaysFromDietary }: Props) {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();

  const hasDietaryData = !!eeiPctFromDietary || !!eeiDaysFromDietary;

  const OPTIONS: { key: EnergyIntakeOption; label: string; desc: string }[] = [
    {
      key: "option1",
      label: "Option 1: Negligible oral intake",
      desc: "None or negligible oral intake — enter number of days",
    },
    {
      key: "option2",
      label: "Option 2: % EER during acute illness/injury",
      desc: "< X% of estimated EER for N days during acute illness or injury",
    },
    {
      key: "option3",
      label: "Option 3: % EER general / chronic",
      desc: "< X% of estimated EER for N days (> 1 month context)",
    },
  ];

  const handleOptionSelect = (opt: EnergyIntakeOption) => {
    const updates: Partial<typeof s> = { c3_option: opt };
    // Pre-fill from dietary store for options 2 & 3
    if ((opt === "option2" || opt === "option3") && hasDietaryData) {
      if (!s.c3_intakePct && eeiPctFromDietary) updates.c3_intakePct = eeiPctFromDietary;
      if (!s.c3_intakeDays && eeiDaysFromDietary) updates.c3_intakeDays = eeiDaysFromDietary;
    }
    setRefeedingScreen(updates);
  };

  return (
    <CriterionCard
      number={3}
      label="Energy Intake"
      computedRisk={computedRisk}
      override={s.c3_override}
      manualRisk={s.c3_manualRisk}
      onToggleOverride={(v) => setRefeedingScreen({ c3_override: v })}
      onManualRiskChange={(v) => setRefeedingScreen({ c3_manualRisk: v })}
      sourceTag="clinical_judgment"
    >
      {/* Option selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "0.6rem" }}>
        {OPTIONS.map((opt) => (
          <label
            key={opt.key}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: "5px",
              border: `1px solid ${s.c3_option === opt.key ? "#3498db" : "var(--border)"}`,
              background: s.c3_option === opt.key ? "#3498db10" : "transparent",
              transition: "all 0.15s",
            }}
          >
            <input
              type="radio"
              name="c3_option"
              checked={s.c3_option === opt.key}
              onChange={() => handleOptionSelect(opt.key)}
              style={{ marginTop: "2px", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2c3e50" }}>{opt.label}</div>
              <div style={{ fontSize: "0.68rem", color: "#718096" }}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Input fields — context-sensitive */}
      {s.c3_option && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginTop: "0.4rem" }}>
          {/* Days field — all options */}
          <div style={fieldWrap}>
            <label style={fieldLabel}>
              {s.c3_option === "option1" ? "Days of Negligible Intake" : "Duration (days)"}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={s.c3_intakeDays}
              onChange={(e) => setRefeedingScreen({ c3_intakeDays: e.target.value })}
              placeholder="e.g. 8"
              style={numInput}
            />
          </div>

          {/* % EER — options 2 & 3 only */}
          {(s.c3_option === "option2" || s.c3_option === "option3") && (
            <div style={fieldWrap}>
              <label style={fieldLabel}>
                % of EER Consumed
                {hasDietaryData && (
                  <span style={{ color: "#3498db", marginLeft: "4px" }}>(dietary: {eeiPctFromDietary}%)</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                max="200"
                step="1"
                value={s.c3_intakePct}
                onChange={(e) => setRefeedingScreen({ c3_intakePct: e.target.value })}
                placeholder="e.g. 62"
                style={numInput}
              />
            </div>
          )}

          {/* Pull from dietary button */}
          {(s.c3_option === "option2" || s.c3_option === "option3") && hasDietaryData && (
            <button
              onClick={() =>
                setRefeedingScreen({
                  c3_intakePct: eeiPctFromDietary,
                  c3_intakeDays: eeiDaysFromDietary,
                })
              }
              style={pullBtn}
            >
              ↙ Pull from Dietary
            </button>
          )}
        </div>
      )}

      {/* Threshold reference */}
      {s.c3_option && (
        <div style={{ marginTop: "0.6rem" }}>
          <div style={threshHeader}>Thresholds</div>
          {s.c3_option === "option1" && (
            <ThreshLines lines={[
              { color: "#da7f2b", text: "Moderate: 5–6 days of negligible/no oral intake" },
              { color: "#e74c3c", text: "Significant: > 7 days of negligible/no oral intake" },
            ]} />
          )}
          {s.c3_option === "option2" && (
            <ThreshLines lines={[
              { color: "#da7f2b", text: "Moderate: < 75% of EER for > 7 days during acute illness/injury" },
              { color: "#e74c3c", text: "Significant: < 50% of EER for > 5 days during acute illness/injury" },
            ]} />
          )}
          {s.c3_option === "option3" && (
            <ThreshLines lines={[
              { color: "#da7f2b", text: "Moderate: < 75% of EER for > 1 month (> 30 days)" },
              { color: "#e74c3c", text: "Significant: < 50% of EER for > 1 month (> 30 days)" },
            ]} />
          )}
        </div>
      )}
    </CriterionCard>
  );
}

function ThreshLines({ lines }: { lines: { color: string; text: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.71rem", color: "#4a5568" }}>{l.text}</span>
        </div>
      ))}
    </div>
  );
}

const fieldWrap: React.CSSProperties  = { display: "flex", flexDirection: "column", gap: "3px" };
const fieldLabel: React.CSSProperties = { fontSize: "0.68rem", fontWeight: 700, color: "#718096", textTransform: "uppercase" };
const numInput: React.CSSProperties   = { width: "110px", padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "0.85rem" };
const threshHeader: React.CSSProperties = { fontSize: "0.68rem", fontWeight: 700, color: "#718096", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" };
const pullBtn: React.CSSProperties = {
  fontSize: "0.7rem", fontWeight: 700, padding: "4px 10px",
  borderRadius: "5px", border: "1px solid #3498db", background: "transparent",
  color: "#3498db", cursor: "pointer", alignSelf: "flex-end",
};