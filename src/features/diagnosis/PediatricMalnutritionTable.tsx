// src/features/diagnosis/PediatricMalnutritionTable.tsx
import React, { useMemo } from "react";
import { useAnthroStore } from "../../stores/useAnthroStore";
import { useDietaryStore } from "../../stores/useDietaryStore";
import { useCalculatedMetrics, toKg, toCm } from "../../stores/useCalculatedMetrics";
import { useNoteStore } from "../../stores/useNoteStore";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import {
  diagnosePediatricMalnutrition,
  PediatricMalnutritionCriteria,
  evaluateZScoreSeverity,
  evaluateLengthHtZ
} from "./pediatricMalnutritionEngine";
import {
  whoWfa, whoLfa, whoWfl, whoBfa,
  cdcBySex, cdcWtage, cdcStatage, cdcBmiage
} from "../../shared/data/growthStandards";
import {
  getClosestRow,
  calcLMSZScore,
  calculateZScoreDelta
} from "../../shared/utils/growthStandardsMath";
import { Severity } from "./malnutritionEngine";

export default function PediatricMalnutritionTable() {
  const { anthro } = useAnthroStore();
  const { dietary } = useDietaryStore();
  const calculatedMetrics = useCalculatedMetrics();
  const patientData = useNoteStore((s) => s.patientData);

  const ageDays = calculatedMetrics.ageDays;
  const sex = patientData.sex === "F" ? "F" : "M";
  const dob = patientData.dob;
  const noteDate = patientData.noteDate;

  const criteriaData = useMemo(() => {
    if (ageDays === null || !dob || !noteDate) return null;

    const isInfant = ageDays < 730;

    const computeZ = (val: number | null, date: string | null, type: 'wt' | 'ht' | 'bmi' | 'wfl') => {
      if (val === null || val <= 0 || !date || !dob) return null;
      const measurementDate = new Date(date);
      const birthDate = new Date(dob);
      const mAgeDays = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      if (mAgeDays < 0) return null;

      const mIsInfant = mAgeDays < 730;
      if (mIsInfant) {
        if (type === 'wt') {
          const row = getClosestRow(whoWfa(sex), 'Day', mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === 'ht') {
          const row = getClosestRow(whoLfa(sex), 'Day', mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === 'bmi') {
          const row = getClosestRow(whoBfa(sex), 'Day', mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
      } else {
        const ageMos = mAgeDays / 30.4375;
        if (type === 'wt') {
          const row = getClosestRow(cdcBySex(cdcWtage, sex), 'Agemos', ageMos);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, true) : null;
        }
        if (type === 'ht') {
          const row = getClosestRow(cdcBySex(cdcStatage, sex), 'Agemos', ageMos);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, true) : null;
        }
        if (type === 'bmi') {
          const row = getClosestRow(cdcBySex(cdcBmiage, sex), 'Agemos', ageMos);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, true) : null;
        }
      }
      return null;
    };

    // Current Metrics
    const curWtKg = toKg(Number(anthro.wt) || 0, anthro.wtUnit);
    const curHtCm = toCm(Number(anthro.ht) || 0, anthro.htUnit);
    const curBmi = (curWtKg > 0 && curHtCm > 0) ? curWtKg / Math.pow(curHtCm / 100, 2) : null;

    const curWtZ = computeZ(curWtKg, noteDate, 'wt');
    const curHtZ = computeZ(curHtCm, noteDate, 'ht');
    const curBmiZ = computeZ(curBmi, noteDate, 'bmi');
    
    let curWflZ: number | null = null;
    if (isInfant && curWtKg > 0 && curHtCm > 0) {
      const row = getClosestRow(whoWfl(sex), 'Length', Math.round(curHtCm * 10) / 10);
      if (row) curWflZ = calcLMSZScore(curWtKg, row.L, row.M, row.S, false);
    }

    // Past Metrics for Delta Z
    const pstWtKg = toKg(Number(anthro.past_wt) || 0, anthro.past_wtUnit);
    const pstHtCm = toCm(Number(anthro.past_ht) || 0, anthro.past_htUnit);
    const pstWtZ = computeZ(pstWtKg, anthro.past_wtDate, 'wt');
    const pstHtZ = computeZ(pstHtCm, anthro.past_htDate, 'ht');
    
    let pstWflZ: number | null = null;
    if (pstWtKg > 0 && pstHtCm > 0) {
      const measurementDate = new Date(anthro.past_htDate);
      const birthDate = new Date(dob);
      const mAgeDays = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      if (mAgeDays < 730) {
        const row = getClosestRow(whoWfl(sex), 'Length', Math.round(pstHtCm * 10) / 10);
        if (row) pstWflZ = calcLMSZScore(pstWtKg, row.L, row.M, row.S, false);
      }
    }

    const wtAgeDeltaZ = (curWtZ !== null && pstWtZ !== null) ? calculateZScoreDelta(curWtZ, pstWtZ) : null;
    const wflDeltaZ = (curWflZ !== null && pstWflZ !== null) ? calculateZScoreDelta(curWflZ, pstWflZ) : null;

    // Weight Loss % (2-20 years)
    const ubw = Number(anthro.ubw) || 0;
    const wt = Number(anthro.wt) || 0;
    const wtLossPct = (ubw > 0 && wt > 0 && ubw > wt) ? ((ubw - wt) / ubw) * 100 : 0;

    // Nutrient Intake
    const intakePct = Number(dietary.eeiPercent) || 100;

    // Physical & Functional (placeholder logic based on NFPE fields if they existed)
    // For now, let's look for any non-normal NFPE fields in useAnthroStore/useClinicalStore
    // (Assuming they are in clinical store based on MalnutritionTable implementation)
    
    return {
      curWtZ, curHtZ, curBmiZ, curWflZ,
      wtAgeDeltaZ, wflDeltaZ,
      wtLossPct,
      intakePct
    };
  }, [anthro, dietary, calculatedMetrics, patientData, ageDays, dob, noteDate, sex]);

  const criteria: PediatricMalnutritionCriteria = useMemo(() => {
    if (!criteriaData) return {
      wtForLengthZ: "None", bmiForAgeZ: "None", lengthHtZ: "None", muacZ: "None",
      wtForAgeDeltaZ: "None", wtGainVelocityZ: "None", wtGainVelocityPct: "None", decelerationZ: "None",
      weightLossPct: "None", nutrientIntake: "None", physicalAssessment: "None", functionalCapacity: "None"
    };

    const { curWflZ, curBmiZ, curHtZ, wtAgeDeltaZ, wflDeltaZ, wtLossPct, intakePct } = criteriaData;

    // Delta Z evaluation
    const evaluateDeltaZ = (delta: number | null): Severity => {
      if (delta === null) return "None";
      if (delta <= -3) return "Severe";
      if (delta <= -2) return "Moderate";
      if (delta <= -1) return "Mild" as any;
      return "None";
    };

    // Weight Loss (2-20 years)
    const evaluateWtLoss = (pct: number): Severity => {
      if (ageDays === null || ageDays < 730) return "None";
      if (pct >= 10) return "Severe";
      if (pct >= 7.5) return "Moderate";
      if (pct >= 5) return "Mild" as any;
      return "None";
    };

    // Intake evaluation
    const evaluateIntake = (pct: number): Severity => {
      if (pct <= 25) return "Severe";
      if (pct <= 50) return "Moderate";
      if (pct <= 75) return "Mild" as any;
      return "None";
    };

    return {
      wtForLengthZ: evaluateZScoreSeverity(curWflZ),
      bmiForAgeZ: evaluateZScoreSeverity(curBmiZ),
      lengthHtZ: evaluateLengthHtZ(curHtZ),
      muacZ: "None", // MUAC not currently tracked in store
      wtForAgeDeltaZ: evaluateDeltaZ(wtAgeDeltaZ),
      wtGainVelocityZ: "None", // Velocity Z requires complex tables
      wtGainVelocityPct: "None",
      decelerationZ: evaluateDeltaZ(wflDeltaZ),
      weightLossPct: evaluateWtLoss(wtLossPct),
      nutrientIntake: evaluateIntake(intakePct),
      physicalAssessment: "None",
      functionalCapacity: "None"
    };
  }, [criteriaData, ageDays]);

  const diagnosisResult = diagnosePediatricMalnutrition(criteria);

  const getCellColor = (sev: Severity) => {
    if (sev === "Severe") return "#fee2e2";
    if (sev === "Moderate") return "#fef3c7";
    if (sev === "Mild" as any) return "#f0fdf4";
    return "#fff";
  };

  const getTextColor = (sev: Severity) => {
    if (sev === "Severe") return "#991b1b";
    if (sev === "Moderate") return "#92400e";
    if (sev === "Mild" as any) return "#166534";
    return "#475569";
  };

  const isInfant = ageDays !== null && ageDays < 730;

  return (
    <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
      <SectionHeader
        title="Pediatric Malnutrition Diagnostic Engine"
        subtitle="WHO/CDC Z-Score & Velocity Criteria"
        color="#1e293b"
      />

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", marginBottom: "1rem", marginTop: "1rem" }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#f8fafc" }}>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Indicator</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Mild (Z -1)</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Mod (Z -2)</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Sev (Z -3)</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Patient</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: "Wt-for-length Z", mild: "-1 to -1.9", mod: "-2 to -2.9", sev: "≤ -3", val: criteriaData?.curWflZ?.toFixed(2) ?? "—", outcome: criteria.wtForLengthZ, show: isInfant },
            { label: "BMI-for-age Z", mild: "-1 to -1.9", mod: "-2 to -2.9", sev: "≤ -3", val: criteriaData?.curBmiZ?.toFixed(2) ?? "—", outcome: criteria.bmiForAgeZ, show: true },
            { label: "Length/Ht-for-age Z", mild: "N/A", mod: "-2 to -2.9", sev: "≤ -3", val: criteriaData?.curHtZ?.toFixed(2) ?? "—", outcome: criteria.lengthHtZ, show: true },
            { label: "Δ Wt-for-age Z", mild: "-1Z decline", mod: "-2Z decline", sev: "-3Z decline", val: criteriaData?.wtAgeDeltaZ?.toFixed(2) ?? "—", outcome: criteria.wtForAgeDeltaZ, show: true },
            { label: "Wt Loss (2-20y)", mild: "5%", mod: "7.5%", sev: "10%", val: `${criteriaData?.wtLossPct.toFixed(1)}%`, outcome: criteria.weightLossPct, show: !isInfant },
            { label: "Energy Intake", mild: "< 75%", mod: "< 50%", sev: "≤ 25%", val: `${criteriaData?.intakePct}%`, outcome: criteria.nutrientIntake, show: true },
          ].filter(r => r.show).map((row) => (
            <tr key={row.label}>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: 600 }}>{row.label}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", color: "#64748b" }}>{row.mild}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", color: "#64748b" }}>{row.mod}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", color: "#64748b" }}>{row.sev}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0" }}>{row.val}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", background: getCellColor(row.outcome), color: getTextColor(row.outcome), fontWeight: 700 }}>
                {row.outcome}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        padding: "1rem",
        background: diagnosisResult.diagnosis === "None" ? "#f8fafc" : diagnosisResult.diagnosis.includes("Severe") ? "#fef2f2" : "#fffbeb",
        border: "1px solid",
        borderColor: diagnosisResult.diagnosis === "None" ? "#e2e8f0" : diagnosisResult.diagnosis.includes("Severe") ? "#fecaca" : "#fef3c7",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Automated Pediatric Diagnosis</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: diagnosisResult.diagnosis === "None" ? "#334155" : diagnosisResult.diagnosis.includes("Severe") ? "#991b1b" : "#92400e" }}>
              {diagnosisResult.diagnosis}
            </div>
          </div>
        </div>
        {diagnosisResult.reasoning.length > 0 && (
          <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "#475569", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px" }}>
            <strong>Reasoning:</strong>
            <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
              {diagnosisResult.reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
