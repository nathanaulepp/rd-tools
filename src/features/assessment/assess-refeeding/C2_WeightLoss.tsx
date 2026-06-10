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
      ? scoreWeightLoss({ 
          pct: manualPct, 
          days: manualDays, 
          isPediatric: metrics.isPediatric,
          pediatricExpectedGainPct: manualPct 
        })
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
        {(["auto", "manual", "na"] as WtLossSource[]).map((src) => {
          // Hide "auto" for pediatric since we don't have automated expected gain math yet
          if (src === "auto" && metrics.isPediatric) return null;
          return (
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
          );
        })}
      </div>

      {/* Auto mode (Adult only for now) */}
      {s.c2_source === "auto" && !metrics.isPediatric && (
        <div>
          {derived ? (
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              <StatChip label="% Lost" value={`${derived.pct.toFixed(1)}%`} />
              <StatChip label="Over" value={`${derived.days} days`} />
              <StatChip label="Current Wt" value={`${metrics.wtKg.toFixed(1)} kg`} />
              <StatChip label="UBW" value={`${anthro.ubw} ${anthro.wtUnit}`} />
            </div>
          ) : !anthro.ubw ? (
            <InfoBox color="#a0aec0">No UBW entered in Anthropometrics.</InfoBox>
          ) : !anthro.ubwDate ? (
            <InfoBox color="#a0aec0">UBW date not entered. Please add it in Anthropometrics.</InfoBox>
          ) : derived === null ? (
            <ActionRequiredBanner
              icon="⚠️"
              title="UBW Date Outside 6-Month Window"
              body="Automatic scoring is unavailable. Switch to Manual Entry and document percent weight loss based on clinical judgment or available records."
              accentColor="#da7f2b"
            />
          ) : (
            <InfoBox color="#a0aec0">Unable to calculate weight loss.</InfoBox>
          )}
          <ThresholdTable isPediatric={false} />
        </div>
      )}

      {/* Manual mode */}
      {s.c2_source === "manual" && (
        <div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {metrics.isPediatric ? (
              <div style={fieldWrap}>
                <label style={fieldLabel}>% Expected Weight Gain Achieved</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={s.c2_manualPct}
                  onChange={(e) => setRefeedingScreen({ c2_manualPct: e.target.value })}
                  placeholder="e.g. 40"
                  style={{ ...numInput, width: "180px" }}
                />
              </div>
            ) : (
              <>
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
              </>
            )}
            
            {manualPct > 0 && (metrics.isPediatric || manualDays > 0) && (
              <StatChip
                label="Auto Score"
                value={manualCalc === "none" ? "Not Met" : manualCalc === "moderate" ? "Moderate" : "Significant"}
                color={manualCalc === "none" ? "#27ae60" : manualCalc === "moderate" ? "#da7f2b" : "#e74c3c"}
              />
            )}
          </div>
          <ThresholdTable isPediatric={metrics.isPediatric} />
        </div>
      )}

      {/* NA mode or fallback */}
      {(s.c2_source === "na" || (s.c2_source === "auto" && metrics.isPediatric)) && (
        <InfoBox color="#9b59b6">
          {metrics.isPediatric 
            ? "Pediatric weight gain thresholds require manual entry of '% of expected weight gain achieved'."
            : "No UBW available within 6 months. Criterion cannot be automatically assessed — use clinical judgment."}
        </InfoBox>
      )}
    </CriterionCard>
  );
}

function ActionRequiredBanner({
  icon, title, body, accentColor,
}: {
  icon: string; title: string; body: string; accentColor: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "14px",
      background: `${accentColor}14`,
      border: `2px solid ${accentColor}`,
      borderLeft: `6px solid ${accentColor}`,
      borderRadius: "8px", padding: "14px 16px", marginBottom: "0.5rem",
    }}>
      <span style={{ fontSize: "1.75rem", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{
          fontSize: "0.88rem", fontWeight: 800, color: accentColor,
          textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px",
        }}>{title}</div>
        <div style={{ fontSize: "0.82rem", color: "#4a5568", lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

// ── Threshold reference table ─────────────────────────────────────────────────
function ThresholdTable({ isPediatric }: { isPediatric: boolean }) {
  const lines = isPediatric 
    ? [
        { color: "#3498db", text: "Mild: < 75% of normal for expected weight gain" },
        { color: "#da7f2b", text: "Moderate: < 50% of normal for expected weight gain" },
        { color: "#e74c3c", text: "Significant: < 25% of normal for expected weight gain" },
      ]
    : [
        { color: "#da7f2b", text: "Moderate: ≥ 5% in ≤ 30 days" },
        { color: "#e74c3c", text: "Significant: ≥ 7.5% in ≤ 90 days (3 months)" },
        { color: "#e74c3c", text: "Significant: > 10% in ≤ 183 days (6 months)" },
        { color: "#e74c3c", text: "Significant: Linear zone — 7.5% (day 90) scaling to 10% (day 183)" },
      ];

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#718096", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Threshold Reference</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {lines.map((t, i) => (
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