// src/features/assessment/assess-anthro/ZScoreVelocityTable.tsx
import React, { useMemo } from "react";
import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useNoteStore } from "../../../stores/useNoteStore";
import { useCalculatedMetrics, toKg, toCm } from "../../../stores/useCalculatedMetrics";
import {
  whoWfa, whoLfa, whoWfl, whoBfa, whoHfa,
  cdcBySex, cdcWtage, cdcStatage, cdcBmiage
} from "../../../shared/data/growthStandards";
import {
  getClosestRow,
  calcLMSZScore,
  calculateZScoreDelta
} from "../../../shared/utils/growthStandardsMath";

export default function ZScoreVelocityTable() {
  const anthro = useAnthroStore((s) => s.anthro);
  const patientData = useNoteStore((s) => s.patientData);
  const calculatedMetrics = useCalculatedMetrics();

  const ageDays = calculatedMetrics.ageDays;
  const sex = patientData.sex === "F" ? "F" : "M";
  const dob = patientData.dob;
  const noteDate = patientData.noteDate;

  const data = useMemo(() => {
    if (ageDays === null || !dob || !noteDate) return null;

    const isInfant = ageDays < 730;

    const computeZ = (val: number | null, date: string | null, type: 'wt' | 'ht' | 'bmi' | 'hc' | 'wfl') => {
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
        if (type === 'hc') {
          const row = getClosestRow(whoHfa(sex), 'Day', mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === 'bmi') {
          const row = getClosestRow(whoBfa(sex), 'Day', mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === 'wfl') {
          // Weight-for-length uses length as key, not age
          // We need length at that time. If it's current, we use current ht. 
          // If it's past, we use past ht. This is tricky.
          // For now, let's assume we only do WfL if we have both wt and ht for that date.
          return null; 
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

    // Current Values
    const curWtKg = toKg(Number(anthro.wt) || 0, anthro.wtUnit);
    const curHtCm = toCm(Number(anthro.ht) || 0, anthro.htUnit);
    const curBmi = (curWtKg > 0 && curHtCm > 0) ? curWtKg / Math.pow(curHtCm / 100, 2) : null;
    const curHcCm = toCm(Number(anthro.head) || 0, anthro.circUnit);

    const curWtZ = computeZ(curWtKg, noteDate, 'wt');
    const curHtZ = computeZ(curHtCm, noteDate, 'ht');
    const curBmiZ = computeZ(curBmi, noteDate, 'bmi');
    const curHcZ = computeZ(curHcCm, noteDate, 'hc');
    
    // Wt-for-len (WHO only)
    let curWflZ: number | null = null;
    if (isInfant && curWtKg > 0 && curHtCm > 0) {
      const row = getClosestRow(whoWfl(sex), 'Length', Math.round(curHtCm * 10) / 10);
      if (row) curWflZ = calcLMSZScore(curWtKg, row.L, row.M, row.S, false);
    }

    // Past Values
    const pstWtKg = toKg(Number(anthro.past_wt) || 0, anthro.past_wtUnit);
    const pstHtCm = toCm(Number(anthro.past_ht) || 0, anthro.past_htUnit);
    const pstBmi = (pstWtKg > 0 && pstHtCm > 0) ? pstWtKg / Math.pow(pstHtCm / 100, 2) : null;
    const pstHcCm = toCm(Number(anthro.past_head) || 0, anthro.past_headUnit);

    const pstWtZ = computeZ(pstWtKg, anthro.past_wtDate, 'wt');
    const pstHtZ = computeZ(pstHtCm, anthro.past_htDate, 'ht');
    const pstBmiZ = computeZ(pstBmi, (anthro.past_wtDate && anthro.past_htDate) ? anthro.past_wtDate : null, 'bmi');
    const pstHcZ = computeZ(pstHcCm, anthro.past_headDate, 'hc');

    let pstWflZ: number | null = null;
    if (pstWtKg > 0 && pstHtCm > 0) {
      // Need to check if pstHtCm was measured when age was < 730 days
      const measurementDate = new Date(anthro.past_htDate);
      const birthDate = new Date(dob);
      const mAgeDays = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      if (mAgeDays < 730) {
        const row = getClosestRow(whoWfl(sex), 'Length', Math.round(pstHtCm * 10) / 10);
        if (row) pstWflZ = calcLMSZScore(pstWtKg, row.L, row.M, row.S, false);
      }
    }

    return {
      wt: { cur: curWtZ, pst: pstWtZ, delta: (curWtZ !== null && pstWtZ !== null) ? calculateZScoreDelta(curWtZ, pstWtZ) : null },
      ht: { cur: curHtZ, pst: pstHtZ, delta: (curHtZ !== null && pstHtZ !== null) ? calculateZScoreDelta(curHtZ, pstHtZ) : null },
      bmi: { cur: curBmiZ, pst: pstBmiZ, delta: (curBmiZ !== null && pstBmiZ !== null) ? calculateZScoreDelta(curBmiZ, pstBmiZ) : null },
      hc: { cur: curHcZ, pst: pstHcZ, delta: (curHcZ !== null && pstHcZ !== null) ? calculateZScoreDelta(curHcZ, pstHcZ) : null },
      wfl: { cur: curWflZ, pst: pstWflZ, delta: (curWflZ !== null && pstWflZ !== null) ? calculateZScoreDelta(curWflZ, pstWflZ) : null },
    };
  }, [anthro, patientData, ageDays, dob, noteDate, sex]);

  if (ageDays === null || ageDays >= 6570) return null; // Only for peds

  const isInfant = ageDays < 730;

  const rows = [
    { label: "Weight-for-age", data: data?.wt },
    { label: "Length/Stature-for-age", data: data?.ht },
    { label: "BMI-for-age", data: data?.bmi },
  ];

  if (isInfant) {
    rows.push({ label: "Head Circ-for-age", data: data?.hc });
    rows.push({ label: "Weight-for-length", data: data?.wfl });
  }

  const fmtZ = (val: number | null) => (val === null ? "—" : (val >= 0 ? "+" : "") + val.toFixed(2));

  return (
    <div className="card mt-2">
      <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--primary)" }}>
        A6.1: Z-Score Velocity Table
      </h4>
      <p style={{ margin: "2px 0 0.75rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
        Tracking Z-score shifts between current and past measurements
      </p>

      <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: "0.72rem", color: "#718096", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #e2e8f0" }}>
                Metric
              </th>
              <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, fontSize: "0.72rem", color: "#4a5568", borderBottom: "2px solid #e2e8f0" }}>
                Past Z
              </th>
              <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, fontSize: "0.72rem", color: "#4a5568", borderBottom: "2px solid #e2e8f0" }}>
                Current Z
              </th>
              <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, fontSize: "0.72rem", color: "#4a5568", borderBottom: "2px solid #e2e8f0" }}>
                Δ Z-Score
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>
                  {row.label}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid #e2e8f0", color: "#718096" }}>
                  {fmtZ(row.data?.pst ?? null)}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>
                  {fmtZ(row.data?.cur ?? null)}
                </td>
                <td style={{ 
                  padding: "8px 12px", 
                  textAlign: "center", 
                  borderBottom: "1px solid #e2e8f0", 
                  fontWeight: 700,
                  color: (row.data?.delta ?? 0) <= -1 ? "var(--danger)" : (row.data?.delta ?? 0) >= 1 ? "var(--success)" : "inherit"
                }}>
                  {fmtZ(row.data?.delta ?? null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(rows.some(r => r.data?.delta === null)) && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: "#a0aec0", fontStyle: "italic" }}>
          Ensure current and past measurements with dates are entered to calculate Δ Z-scores.
        </p>
      )}
    </div>
  );
}
