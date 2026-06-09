import React from "react";
import { useMonitorEvalStore } from "../../stores/useMonitorEvalStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryMonitorEvalCard() {
  const { monitorEval } = useMonitorEvalStore();

  if (!monitorEval) {
    return (
      <SummaryCard title="ME. Monitor & Evaluate" color="#8e44ad">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No monitoring/evaluation data recorded.</p>
      </SummaryCard>
    );
  }

  const progressLabel: Record<string, string> = {
    improved: "✅ Improved", "no-change": "→ No Change", worsened: "⚠ Worsened",
    met: "✓ Goal Met", "not-met": "✗ Goal Not Met",
  };

  return (
    <SummaryCard title="ME. Monitor & Evaluate" color="#8e44ad">
      {Array.isArray(monitorEval.monitoredIndicators) && monitorEval.monitoredIndicators.length > 0 && (
        <SummaryRow label="Monitored Indicators" value={monitorEval.monitoredIndicators.join(", ")} />
      )}
      <SummaryRow label="Monitoring Frequency" value={monitorEval.monitorFrequency} />
      <SummaryRow label="Anthropometric Targets" value={monitorEval.criteria_anthropo} />
      <SummaryRow label="Biochemical Targets" value={monitorEval.criteria_labs} />
      <SummaryRow label="Dietary Targets" value={monitorEval.criteria_dietary} />
      <SummaryRow label="Clinical Targets" value={monitorEval.criteria_clinical} />
      <SummaryRow label="Functional Targets" value={monitorEval.criteria_functional} />
      
      {monitorEval.outcome_progress && <SummaryRow label="Progress" value={progressLabel[monitorEval.outcome_progress] || monitorEval.outcome_progress} />}
      <SummaryRow label="Outcome Narrative" value={monitorEval.outcome_narrative} />
      <SummaryRow label="Next Steps" value={monitorEval.outcome_nextSteps} />
      <SummaryRow label="Discharge Recommendations" value={monitorEval.dischargeRecs} />
      <SummaryRow label="Transition Plan" value={monitorEval.transitionPlan} />
    </SummaryCard>
  );
}
