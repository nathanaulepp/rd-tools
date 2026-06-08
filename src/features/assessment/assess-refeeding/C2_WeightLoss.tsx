// src/features/assessment/assess-refeeding/C2_WeightLoss.tsx
import { useMemo, CSSProperties, ReactNode } from "react";
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import { useAnthroStore }    from "../../../stores/useAnthroStore";
import { useNoteStore }      from "../../../stores/useNoteStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import { deriveWeightLoss, scoreWeightLoss } from "../../../shared/utils/refeedingScreenLogic";
import type { RiskLevel, WtLossSource } from "../../../types/refeedingScreen";
import { CriterionCard } from "./CriterionCard";

interface Props {
  autoRisk: RiskLevel;
  computedRisk: RiskLevel;
}

export function C2_WeightLoss({ computedRisk }: Props) {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();
  const anthro    = useAnthroStore((s) => s.anthro);
  const noteDate  = useNoteStore((s) => s.patientData.noteDate);
  const metrics   = useCalculatedMetrics();

  const derived = useMemo(
    () =>
      deriveWeightLoss(
        metrics.wtKg,
        anthro.ubw,
        anthro.wtUnit,
        anthro.ubwDate,
        noteDate
      ),
    [metrics.wtKg, anthro.ubw, anthro.wtUnit, anthro.ubwDate, noteDate]
  );

  const sourceTag: string =
    s.c2_source === "na"
      ? "unavailable"
      : s.c2_source === "manual"
      ? "clinical_judgment"
      : derived
      ? "auto"
      : "unavailable";

  // Piecewise threshold display helper
  const manualPct  = parseFloat(s.c2_manualPct) || 0;
  const manualDays = parseFloat(s.c2_manualDays) || 0;
  const manualCalc: RiskLevel =
    s.c2_source === "manual"
      ? scoreWeightLoss(manualPct, manualDays)
      : "none";

  const setSource = (v: WtLossSource) => setRefeedingScreen({ c2_source: v });

  return (
    <CriterionCard
      number={2}
      label="Weight Loss"
      computedRisk={computedRisk}
      override={s.c2_override}
      manualRisk={s.c2_manualRisk}
      onToggleOverride={(v) => setRefeedingScreen({ c2_override: v })}
      onManualRiskChange={(v) => setRefeedingScreen({ c2_manualRisk: v })}
      sourceTag={sourceTag}
    >
      {/* Source selector */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        {(["auto", "manual", "na"] as WtLossSource[]).map((src) => (
          <button
            key={src}
            onClick={() => setSource(src)}
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: "10px",
              border: "1.5px solid #3498db",
              background: s.c2_source === src ? "#3498db" : "transparent",
              color: s.c2_source === src ? "#fff" : "#3498db",
              cursor: "pointer",
            }}
          >
            {src === "auto" ? "Auto (from UBW)" : src === "manual" ? "Manual entry" : "No UBW available"}
          </button>
        ))}
      </div>

      {/* Auto mode */}
      {s.c2_source === "auto" && (
        <div>
          {derived ? (
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              <StatChip label="% Lost" value={`${derived.pct.toFixed(1)}%`} />
              <StatChip label="Over" value={`${derived.days} days`} />
              <StatChip label="Current Wt" value={`${metrics.wtKg.toFixed(1)} kg`} />
              <StatChip label="UBW" value={`${anthro.ubw} ${anthro.wtUnit}`} />
            </div>
          ) : (
            <InfoBox color="#a0aec0">
              {!anthro.ubw
                ? "No UBW entered in Anthropometrics."
                : !anthro.ubwDate
                ? "UBW date not entered. Please add it in Anthropometrics."
                : derived === null
                ? "UBW date is outside the 6-month window — using manual entry or clinical judgment is recommended."
                : "Unable to calculate weight loss."}
            </InfoBox>
          )}
          <ThresholdTable />
        </div>
      )}

      {/* Manual mode */}
      {s.c2_source === "manual" && (
        <div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <div style={fieldWrap}>
              <label style={fieldLabel}>% Weight Lost</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={s.c2_manualPct}
                onChange={(e) => setRefeedingScreen({ c2_manualPct: e.target.value })}
                placeholder="e.g. 6.5"
                style={numInput}
              />
            </div>
            <div style={fieldWrap}>
              <label style={fieldLabel}>Days</label>
              <input
                type="number"
                min="0"
                step="1"
                value={s.c2_manualDays}
                onChange={(e) => setRefeedingScreen({ c2_manualDays: e.target.value })}
                placeholder="e.g. 45"
                style={numInput}
              />
            </div>
            {manualPct > 0 && manualDays > 0 && (
              <StatChip
                label="Auto Score"
                value={manualCalc === "none" ? "Not Met" : manualCalc === "moderate" ? "Moderate" : "Significant"}
                color={manualCalc === "none" ? "#27ae60" : manualCalc === "moderate" ? "#da7f2b" : "#e74c3c"}
              />
            )}
          </div>
          <ThresholdTable />
        </div>
      )}

      {/* NA mode */}
      {s.c2_source === "na" && (
        <InfoBox color="#9b59b6">
          No UBW available within 6 months. Criterion cannot be automatically assessed — use clinical judgment.
        </InfoBox>
      )}
    </CriterionCard>
  );
}

// ── Threshold reference table ─────────────────────────────────────────────────
function ThresholdTable() {
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#718096", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Threshold Reference</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {[
          { color: "#da7f2b", text: "Moderate: ≥ 5% in ≤ 30 days" },
          { color: "#e74c3c", text: "Significant: ≥ 7.5% in ≤ 90 days (3 months)" },
          { color: "#e74c3c", text: "Significant: > 10% in ≤ 183 days (6 months)" },
          { color: "#e74c3c", text: "Significant: Linear zone — 7.5% (day 90) scaling to 10% (day 183)" },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.71rem", color: "#4a5568" }}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Local micro-components ────────────────────────────────────────────────────
function StatChip({ label, value, color = "#3498db" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: "6px", padding: "5px 10px", textAlign: "center" }}>
      <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
function InfoBox({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}40`, borderRadius: "5px", padding: "6px 10px", fontSize: "0.73rem", color: "#4a5568" }}>
      {children}
    </div>
  );
}

const fieldWrap: CSSProperties = { display: "flex", flexDirection: "column", gap: "3px" };
const fieldLabel: CSSProperties = { fontSize: "0.68rem", fontWeight: 700, color: "#718096", textTransform: "uppercase" };
const numInput: CSSProperties = { width: "90px", padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "0.85rem" };