// src/features/assessment/assess-refeeding/RefeedingDomain.tsx
// Container for the RD2B Refeeding Risk Screen.
// Reads from multiple stores; passes no props down to children.

import { useMemo } from "react";
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import {
  scoreBMI,
  scoreWeightLoss,
  deriveWeightLoss,
  scoreEnergyOption1,
  scoreEnergyOption2,
  scoreEnergyOption3,
  scoreElectrolytes,
  scoreFatLoss,
  scoreMuscLoss,
  scoreComorbidities,
  computeOverallRisk,
  riskColor,
} from "../../../shared/utils/refeedingScreenLogic";
import type { CriterionResult, RiskLevel } from "../../../types/refeedingScreen";

import { C1_BMI }            from "./C1_BMI";
import { C2_WeightLoss }     from "./C2_WeightLoss";
import { C3_EnergyIntake }   from "./C3_EnergyIntake";
import { C4_Electrolytes }   from "./C4_Electrolytes";
import { C5_FatLoss }        from "./C5_FatLoss";
import { C6_MuscleLoss }     from "./C6_MuscleLoss";
import { C7_Comorbidities }  from "./C7_Comorbidities";
import { RefeedingResult }   from "./RefeedingResult";
import { RefeedingRecommendations } from "./RefeedingRecommendations";

export default function RefeedingDomain() {
  const screen     = useRefeedingStore((s) => s.refeedingScreen);
  const anthro     = useAnthroStore((s) => s.anthro);
  const clinical   = useClinicalStore((s) => s.clinical);
  const dietary    = useDietaryStore((s) => s.dietary);
  const metrics    = useCalculatedMetrics();

  // ── C1: BMI ──────────────────────────────────────────────────────────────
  const bmiNum     = parseFloat(metrics.bmi) || 0;
  const c1Auto: RiskLevel = scoreBMI(bmiNum);
  const c1Risk: RiskLevel = screen.c1_override ? screen.c1_manualRisk : c1Auto;

  // ── C2: Weight Loss ───────────────────────────────────────────────────────
  const derivedWt  = useMemo(
    () =>
      deriveWeightLoss(
        metrics.wtKg,
        anthro.ubw,
        anthro.wtUnit,
        anthro.ubwDate,
        metrics.ageDays !== null ? "" : "" // handled inside via noteDate from store
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics.wtKg, anthro.ubw, anthro.wtUnit, anthro.ubwDate]
  );

  // We pass the derived values down to C2 which reads noteDate from noteStore directly
  const c2AutoRisk: RiskLevel = (() => {
    if (screen.c2_source === "na") return "none";
    if (screen.c2_source === "manual") {
      const pct  = parseFloat(screen.c2_manualPct) || 0;
      const days = parseFloat(screen.c2_manualDays) || 0;
      return scoreWeightLoss(pct, days);
    }
    // auto
    if (!derivedWt) return "none";
    return scoreWeightLoss(derivedWt.pct, derivedWt.days);
  })();
  const c2Risk: RiskLevel = screen.c2_override ? screen.c2_manualRisk : c2AutoRisk;

  // ── C3: Energy Intake ─────────────────────────────────────────────────────
  const c3AutoRisk: RiskLevel = (() => {
    const pct  = parseFloat(screen.c3_intakePct) || 0;
    const days = parseFloat(screen.c3_intakeDays) || 0;
    if (screen.c3_option === "option1") return scoreEnergyOption1(days);
    if (screen.c3_option === "option2") return scoreEnergyOption2(pct, days);
    if (screen.c3_option === "option3") return scoreEnergyOption3(pct, days);
    return "none";
  })();
  const c3Risk: RiskLevel = screen.c3_override ? screen.c3_manualRisk : c3AutoRisk;

  // ── C4: Electrolytes ──────────────────────────────────────────────────────
  const c4Risk: RiskLevel = scoreElectrolytes(screen.c4_electrolytes);

  // ── C5: Fat Loss ──────────────────────────────────────────────────────────
  const c5Auto: RiskLevel = scoreFatLoss(
    clinical.orbital,
    clinical.cheek,
    clinical.tricepsFat,
    clinical.midAxillary
  );
  const c5Risk: RiskLevel = screen.c5_override ? screen.c5_manualRisk : c5Auto;

  // ── C6: Muscle Loss ───────────────────────────────────────────────────────
  const c6Auto: RiskLevel = scoreMuscLoss(
    clinical.temples,
    clinical.clavicles,
    clinical.shoulders,
    clinical.scapula,
    clinical.interosseous,
    clinical.thighs,
    clinical.calves
  );
  const c6Risk: RiskLevel = screen.c6_override ? screen.c6_manualRisk : c6Auto;

  // ── C7: Comorbidities ─────────────────────────────────────────────────────
  const c7Risk: RiskLevel = scoreComorbidities(screen.c7_selected);

  // ── Overall ───────────────────────────────────────────────────────────────
  const criteria: CriterionResult[] = [
    { label: "BMI",             risk: c1Risk, source: screen.c1_override ? "manual" : "auto" },
    { label: "Weight Loss",     risk: c2Risk, source: screen.c2_source === "manual" || screen.c2_override ? "manual" : "auto" },
    { label: "Energy Intake",   risk: c3Risk, source: screen.c3_override ? "manual" : "manual" },
    { label: "Electrolytes",    risk: c4Risk, source: "clinical_judgment" },
    { label: "Fat Loss",        risk: c5Risk, source: screen.c5_override ? "manual" : "auto" },
    { label: "Muscle Loss",     risk: c6Risk, source: screen.c6_override ? "manual" : "auto" },
    { label: "Comorbidities",   risk: c7Risk, source: "clinical_judgment" },
  ];

  const overall = computeOverallRisk(criteria);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

      {/* Header */}
      <div className="card" style={{ borderLeft: "4px solid #e74c3c", padding: "0.6rem 0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--primary)" }}>
              Refeeding Syndrome Risk Screen
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              ASPEN Consensus Recommendations · 7 criteria · Auto-populated where available
            </div>
          </div>
          <RiskBadge level={overall.level} />
        </div>
      </div>

      {/* Criterion cards */}
      <C1_BMI   bmiNum={bmiNum} computedRisk={c1Risk} />
      <C2_WeightLoss computedRisk={c2Risk} />
      <C3_EnergyIntake  computedRisk={c3Risk} eeiPctFromDietary={dietary.eeiPercent} eeiDaysFromDietary={dietary.eeiTimeframe} />
      <C4_Electrolytes />
      <C5_FatLoss computedRisk={c5Risk} orbital={clinical.orbital} cheek={clinical.cheek} tricepsFat={clinical.tricepsFat} midAxillary={clinical.midAxillary} />
      <C6_MuscleLoss computedRisk={c6Risk} temples={clinical.temples} clavicles={clinical.clavicles} shoulders={clinical.shoulders} scapula={clinical.scapula} interosseous={clinical.interosseous} thighs={clinical.thighs} calves={clinical.calves} />
      <C7_Comorbidities />

      {/* Summary + Recommendations */}
      <RefeedingResult overall={overall} criteria={criteria} />
      <RefeedingRecommendations overall={overall} />
    </div>
  );
}

// ── Risk badge ────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const color = riskColor(level);
  const label = level === "none"
    ? "Low / Not at Risk"
    : level === "moderate"
    ? "Moderate Risk"
    : "Significant Risk";

  return (
    <div
      style={{
        background: `${color}18`,
        border: `1.5px solid ${color}`,
        borderRadius: "8px",
        padding: "4px 14px",
        fontSize: "0.78rem",
        fontWeight: 700,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}