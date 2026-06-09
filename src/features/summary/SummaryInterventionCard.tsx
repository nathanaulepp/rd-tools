import React from "react";
import { useInterventionStore } from "../../stores/useInterventionStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryInterventionCard() {
  const { intervention } = useInterventionStore();

  if (!intervention) {
    return (
      <SummaryCard title="I. Nutrition Intervention" color="#27ae60">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No intervention data recorded.</p>
      </SummaryCard>
    );
  }

  const npActiveModes = intervention.npActiveModes || [];

  return (
    <SummaryCard title="I. Nutrition Intervention" color="#27ae60">
      <SummaryRow label="Intervention Goal" value={intervention.goalStatement} />
      <div style={{ marginBottom: "0.5rem" }} />
      <SummaryRow label="Education Purpose" value={(intervention as any).ed_purpose} />
      <SummaryRow label="Counseling Approach" value={(intervention as any).c_theory} />
      <SummaryRow label="Referrals" value={(intervention as any).cc_referrals} />
      <SummaryRow label="Discharge Recs" value={(intervention as any).cc_dischargeRecommendations} />
      <SummaryRow label="Follow-Up Plan" value={(intervention as any).cc_followUpPlan} />

      {npActiveModes.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <SummaryRow label="Active Support Modes" value={npActiveModes.join(", ")} />
        </div>
      )}

      {npActiveModes.includes("oral") && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>Oral Nutrition</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <SummaryRow label="Oral Energy Target" value={intervention?.npOral?.energyKcal} unit="kcal" />
              <SummaryRow label="Texture Modification" value={intervention?.npOral?.textureModification} />
              <SummaryRow label="Oral Supplements" value={intervention?.npOral?.oralSupplements} />
            </div>
            <div>
              <SummaryRow label="NPO Status" value={intervention?.npOral?.isNpo ? "Yes" : null} />
              <SummaryRow label="Foods & Patterns" value={intervention?.npOral?.foodsAndPatterns?.join(", ")} />
            </div>
          </div>
        </div>
      )}

      {npActiveModes.includes("enteral") && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>Enteral Nutrition</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <SummaryRow label="EN Formula" value={intervention?.npEnteral?.formulaName} />
              <SummaryRow label="EN Energy Target" value={
                intervention?.npEnteral?.kcalLow && intervention?.npEnteral?.kcalHigh
                  ? `${intervention.npEnteral.kcalLow}–${intervention.npEnteral.kcalHigh}`
                  : null
              } unit="kcal" />
              <SummaryRow label="EN Admin Method" value={intervention?.npEnteral?.adminMethod} />
            </div>
            <div>
              <SummaryRow label="EN Daily Volume" value={intervention?.npEnteral?.dailyVolumeMl} unit="mL" />
              <SummaryRow label="EN Infusion Rate" value={intervention?.npEnteral?.infusionRateMlHr} unit="mL/hr" />
            </div>
          </div>
        </div>
      )}

      {npActiveModes.includes("parenteral") && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>Parenteral Nutrition</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <SummaryRow label="PN Energy" value={intervention?.npParenteral?.energyKcal} unit="kcal" />
              <SummaryRow label="PN Amino Acids" value={intervention?.npParenteral?.aminoAcidsG} unit="g" />
              <SummaryRow label="PN Dextrose" value={intervention?.npParenteral?.dextroseG} unit="g" />
            </div>
            <div>
              <SummaryRow label="PN Lipids" value={intervention?.npParenteral?.lipidsG} unit="g" />
              <SummaryRow label="PN Solution Type" value={intervention?.npParenteral?.solutionType} />
              <SummaryRow label="PN Total Volume" value={intervention?.npParenteral?.totalFluidVolumeMl} unit="mL" />
            </div>
          </div>
        </div>
      )}

      {intervention?.ndImplementation?.selected && intervention.ndImplementation.selected.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <SummaryRow label="Interventions Selected" value={intervention.ndImplementation.selected.join("; ")} />
        </div>
      )}
    </SummaryCard>
  );
}

const styles = {
  subGroup: { fontSize: "0.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569", textTransform: "uppercase" as any },
};
