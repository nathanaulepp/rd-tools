import React from "react";
import { useNoteStore } from "../../stores/useNoteStore";
import { useAnthroStore } from "../../stores/useAnthroStore";
import { useClinicalStore } from "../../stores/useClinicalStore";
import { useRefeedingStore } from "../../stores/useRefeedingStore";
import { useCalculatedMetrics } from "../../stores/useCalculatedMetrics";
import { SummaryCard, SummaryRow } from "./SummaryShared";
import { 
  scoreBMI, scoreWeightLoss, deriveWeightLoss, scoreEnergyOption1, 
  scoreEnergyOption2, scoreEnergyOption3,
  scoreElectrolytes, scoreFatLoss, scoreMuscLoss,
  scoreComorbidities, computeOverallRisk 
} from "../../shared/utils/refeedingScreenLogic";
import { CriterionResult } from "../../types/refeedingScreen";

export default function SummaryRefeedingCard() {
  const { activeNote: note } = useNoteStore();
  const { anthro } = useAnthroStore();
  const { clinical } = useClinicalStore();
  const { refeedingScreen } = useRefeedingStore();
  const calculatedMetrics = useCalculatedMetrics();

  if (!refeedingScreen?.screenedAt) return null;

  const refeedingRiskLabel = (() => {
    if (!refeedingScreen?.screenedAt) return null;

    // 1. BMI
    const bmiNum = parseFloat(calculatedMetrics.bmi) || 0;
    const c1Auto = scoreBMI({
      bmiNum,
      isPediatric: calculatedMetrics.isPediatric,
      bmiZ: calculatedMetrics.bmiZ
    });
    const c1Risk = refeedingScreen.c1_override ? refeedingScreen.c1_manualRisk : c1Auto;

    // 2. Weight Loss
    const derivedWt = deriveWeightLoss(
      calculatedMetrics.wtKg,
      anthro.ubw,
      anthro.wtUnit,
      anthro.ubwDate,
      note?.note_date || ""
    );
    const c2AutoRisk = (() => {
      if (refeedingScreen.c2_source === "na") return "none";
      if (calculatedMetrics.isPediatric) return "none";
      if (refeedingScreen.c2_source === "manual") {
        const pct = parseFloat(refeedingScreen.c2_manualPct) || 0;
        const days = parseFloat(refeedingScreen.c2_manualDays) || 0;
        return scoreWeightLoss({ pct, days, isPediatric: false });
      }
      if (!derivedWt) return "none";
      return scoreWeightLoss({ pct: derivedWt.pct, days: derivedWt.days, isPediatric: false });
    })();
    const c2PediatricManualRisk = calculatedMetrics.isPediatric && refeedingScreen.c2_source === "manual"
      ? scoreWeightLoss({
          isPediatric: true,
          pediatricExpectedGainPct: parseFloat(refeedingScreen.c2_manualPct) || 0
        })
      : "none";
    const c2Risk = refeedingScreen.c2_override 
      ? refeedingScreen.c2_manualRisk 
      : (calculatedMetrics.isPediatric && refeedingScreen.c2_source === "manual") 
        ? c2PediatricManualRisk 
        : c2AutoRisk;

    // 3. Energy Intake
    const c3AutoRisk = (() => {
      const pct = parseFloat(refeedingScreen.c3_intakePct) || 0;
      const days = parseFloat(refeedingScreen.c3_intakeDays) || 0;
      if (refeedingScreen.c3_option === "option1") return scoreEnergyOption1(days);
      if (refeedingScreen.c3_option === "option2") return scoreEnergyOption2(pct, days);
      if (refeedingScreen.c3_option === "option3") return scoreEnergyOption3(pct, days);
      return "none";
    })();
    const c3Risk = refeedingScreen.c3_override ? refeedingScreen.c3_manualRisk : c3AutoRisk;

    // 4. Electrolytes
    const c4Risk = scoreElectrolytes(refeedingScreen.c4_electrolytes);

    // 5. Fat Loss
    const c5Auto = scoreFatLoss(
      clinical.orbital,
      clinical.cheek,
      clinical.tricepsFat,
      clinical.midAxillary
    );
    const c5Risk = refeedingScreen.c5_override ? refeedingScreen.c5_manualRisk : c5Auto;

    // 6. Muscle Loss
    const c6Auto = scoreMuscLoss(
      clinical.temples,
      clinical.clavicles,
      clinical.shoulders,
      clinical.scapula,
      clinical.interosseous,
      clinical.thighs,
      clinical.calves
    );
    const c6Risk = refeedingScreen.c6_override ? refeedingScreen.c6_manualRisk : c6Auto;

    // 7. Comorbidities
    const c7Auto = scoreComorbidities(refeedingScreen.c7_selected);
    const c7Risk = refeedingScreen.c7_override ? refeedingScreen.c7_manualRisk : c7Auto;

    const criteria: CriterionResult[] = [
      { label: "BMI", risk: c1Risk, source: "auto" },
      { label: "Weight Loss", risk: c2Risk, source: "auto" },
      { label: "Energy Intake", risk: c3Risk, source: "auto" },
      { label: "Electrolytes", risk: c4Risk, source: "auto" },
      { label: "Fat Loss", risk: c5Risk, source: "auto" },
      { label: "Muscle Loss", risk: c6Risk, source: "auto" },
      { label: "Comorbidities", risk: c7Risk, source: "auto" },
    ];

    const overall = computeOverallRisk(criteria);
    if (overall.level === "significant") return "Significant Risk";
    if (overall.level === "moderate") return "Moderate Risk";
    return "Low / Not at Risk";
  })();

  return (
    <SummaryCard title="RF. Refeeding Syndrome Risk Screen" color="#c0392b">
      <SummaryRow label="Overall Risk" value={refeedingRiskLabel} />
      <SummaryRow label="Screened At" value={new Date(refeedingScreen.screenedAt).toLocaleString()} />
      <SummaryRow label="C1: BMI Risk" value={refeedingScreen.c1_manualRisk} />
      <SummaryRow label="C2: Weight Loss Risk" value={refeedingScreen.c2_manualRisk} />
      <SummaryRow label="C3: Energy Intake Risk" value={refeedingScreen.c3_manualRisk} />
      <SummaryRow label="C4: Potassium" value={refeedingScreen.c4_electrolytes?.potassium} />
      <SummaryRow label="C4: Phosphorus" value={refeedingScreen.c4_electrolytes?.phosphorus} />
      <SummaryRow label="C4: Magnesium" value={refeedingScreen.c4_electrolytes?.magnesium} />
      <SummaryRow label="C5: Fat Loss Risk" value={refeedingScreen.c5_manualRisk} />
      <SummaryRow label="C6: Muscle Loss Risk" value={refeedingScreen.c6_manualRisk} />
      <SummaryRow label="C7: Comorbidities" value={refeedingScreen.c7_selected?.join(", ")} />
      {refeedingScreen.screenNotes && <SummaryRow label="Screen Notes" value={refeedingScreen.screenNotes} />}
    </SummaryCard>
  );
}
