// src/components/create_adime/assessment/GrowthStandardsTable.tsx
import { useState } from 'react';
import { formatAge } from '../../../shared/utils/date';

import {
  whoWfa, whoLfa, whoWfl, whoBfa, whoHfa,
  cdcWtage, cdcStatage, cdcBmiage, cdcBySex,
} from '../../../shared/data/growthStandards';
import {
  getClosestRow,
  calcLMSZScore,
  calcLMSValue,
  stdNormCDF,
} from '../../../shared/utils/growthStandardsMath';


const formatMetric = (measure: string, val: number) => {
  if (measure === 'Weight' || measure === 'Wt-for-len') return `${val.toFixed(2)} kg`;
  if (measure === 'Length/height' || measure === 'Head') return `${val.toFixed(1)} cm`;
  if (measure === 'BMI') return `${val.toFixed(1)} kg/m²`;
  return val.toFixed(2);
};

const formatImperial = (measure: string, val: number) => {
  if (measure === 'Weight' || measure === 'Wt-for-len') return `${(val * 2.205).toFixed(2)} lbs`;
  if (measure === 'Length/height' || measure === 'Head') return `${(val / 2.54).toFixed(1)} in`;
  return '--';
};

export default function GrowthStandardsTable({ anthro, patientData, calculatedMetrics, units = "metric" }: any) {
  const [results, setResults] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const imp = units === "imperial";

  const handleGenerate = () => {
    const ageDays = calculatedMetrics?.ageDays;
    const rawSex = patientData?.sex;

    if (ageDays === null || ageDays === undefined) return alert("Please set both Patient DOB and Note Date in the Patient Header to calculate age.");
    if (!rawSex) return alert("Please specify the patient's Sex in the Patient Header.");

    const sex = rawSex === 'F' ? "2" : "1";
    
    if (ageDays < 0) return alert("Note Date must be after Patient DOB");

    const isInfant = ageDays <= 730;
    const ageMos = Math.round((ageDays / 30.5) * 2) / 2;

    const htCm = anthro.ht ? (anthro.htUnit === 'in' ? Number(anthro.ht) * 2.54 : Number(anthro.ht)) : null;
    const wtKg = anthro.wt ? (anthro.wtUnit === 'lbs' ? Number(anthro.wt) / 2.205 : Number(anthro.wt)) : null;
    const headCm = anthro.head ? (anthro.circUnit === 'in' ? Number(anthro.head) * 2.54 : Number(anthro.head)) : null;
    const bmi = (htCm && wtKg && htCm > 0) ? (wtKg / Math.pow(htCm / 100, 2)) : null;

    const res: any[] = [];
    const getRow = getClosestRow;

    if (isInfant) {
      const sexTyped = sex === "1" ? "M" : "F";
      const wfaData = whoWfa(sexTyped);
      const lfaData = whoLfa(sexTyped);
      const wflData = whoWfl(sexTyped);
      const bfaData = whoBfa(sexTyped);
      const hfaData = whoHfa(sexTyped);

      // ADDED measureName to parameter list
      const computeRowWHO = (measureName: string, data: any[], keyCol: string, keyVal: number | null, yVal: number | null) => {
        if (keyVal === null || yVal === null) return null;
        const row = getRow(data, keyCol, keyVal);
        if (!row) return null;

        const z = calcLMSZScore(yVal, row.L, row.M, row.S, false);
        const p = stdNormCDF(z) * 100;
        const p50 = row.SD0;

        let monthly = null;
        let yearly = null;

        if (keyCol === 'Day') {
          if (ageDays <= 699) {
            const fRow = getRow(data, 'Day', ageDays + 31);
            if (fRow) monthly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, false) - yVal;
          }
          if (ageDays <= 365) {
            const fRow = getRow(data, 'Day', ageDays + 365);
            if (fRow) yearly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, false) - yVal;
          }
        } 
        else if (keyCol === 'Length' && htCm !== null) {
          const lRow = getRow(lfaData, 'Day', ageDays);
          
          // Added safe guard check for lRow existence & fixed signature mismatch (removed string argument)
          if (lRow) {
            const zHt = calcLMSZScore(htCm, lRow.L, lRow.M, lRow.S, false);

            if (ageDays <= 699) {
              const fLRow = getRow(lfaData, 'Day', ageDays + 31);
              if (fLRow) {
                const futLength = calcLMSValue(zHt, fLRow.L, fLRow.M, fLRow.S, false);
                const futWflRow = getRow(data, 'Length', Math.round(futLength * 10) / 10);
                if (futWflRow) monthly = calcLMSValue(z, futWflRow.L, futWflRow.M, futWflRow.S, false) - yVal;
              }
            }
            if (ageDays <= 365) {
              const fLRow = getRow(lfaData, 'Day', ageDays + 365);
              if (fLRow) {
                const futLength = calcLMSValue(zHt, fLRow.L, fLRow.M, fLRow.S, false);
                const futWflRow = getRow(data, 'Length', Math.round(futLength * 10) / 10);
                if (futWflRow) yearly = calcLMSValue(z, fLRow.L, fLRow.M, fLRow.S, false) - yVal;
              }
            }
          }
        }

        return { measure: measureName, value: yVal, z, p, p50, monthly, yearly };
      };

      const rWt = computeRowWHO('Weight', wfaData, 'Day', ageDays, wtKg);
      if (rWt) res.push(rWt);
      const rHt = computeRowWHO('Length/height', lfaData, 'Day', ageDays, htCm);
      if (rHt) res.push(rHt);
      const rWfl = computeRowWHO('Wt-for-len', wflData, 'Length', htCm ? Math.round(htCm * 10) / 10 : null, wtKg);
      if (rWfl) res.push(rWfl);
      const rBmi = computeRowWHO('BMI', bfaData, 'Day', ageDays, bmi);
      if (rBmi) res.push(rBmi);
      const rHead = computeRowWHO('Head', hfaData, 'Day', ageDays, headCm);
      if (rHead) res.push(rHead);

    } else {
      const sexTyped = sex === "1" ? "M" : "F";
      const wtageData = cdcBySex(cdcWtage, sexTyped);
      const statageData = cdcBySex(cdcStatage, sexTyped);
      const bmiageData = cdcBySex(cdcBmiage, sexTyped);

      const getCDCRow = (data: any[], aMos: number) => getClosestRow(data, 'Agemos', aMos);

      const computeRowCDC = (measureName: string, data: any[], yVal: number | null) => {
        if (yVal === null) return null;
        const row = getCDCRow(data, ageMos);
        if (!row) return null;

        const z = calcLMSZScore(yVal, row.L, row.M, row.S, true);
        const p = stdNormCDF(z) * 100;
        const p50 = row.P50;

        let monthly = null;
        let yearly = null;

        if (ageMos <= 239) {
          const fRow = getCDCRow(data, ageMos + 1);
          if (fRow) monthly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, true) - yVal;
        }
        if (ageMos <= 228) {
          const fRow = getCDCRow(data, ageMos + 12);
          if (fRow) yearly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, true) - yVal;
        }

        return { measure: measureName, value: yVal, z, p, p50, monthly, yearly };
      };

      // Fixed: passed 'measureName' explicitly as the first argument
      const rWt = computeRowCDC('Weight', wtageData, wtKg);
      if (rWt) res.push(rWt);
      const rHt = computeRowCDC('Length/height', statageData, htCm);
      if (rHt) res.push(rHt);
      const rBmi = computeRowCDC('BMI', bmiageData, bmi);
      if (rBmi) res.push(rBmi);
    }

    setResults(res);
    setShowTable(true);
  };

  return (
    <div className="card mt-2">
      <h4 className="mb-1 flex-between" style={{ alignItems: 'center' }}>
        A7: Growth Standards Projection
        <button className="btn-primary" onClick={handleGenerate}>Calculate Z-Scores</button>
      </h4>

      {showTable && results.length > 0 && (
        <div className="mt-2">
          <h5 className="mb-1 text-center">
            {formatAge(calculatedMetrics.ageDays)}, {patientData?.sex === "F" ? "Female" : "Male"}
          </h5>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Measure</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Value</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Z-Score</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Percentile</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>50th %ile Ref</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Expected +/mo*</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Expected +/yr*</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => {
                  const zAbs = Math.abs(row.z);
                  const rowColor =
                    zAbs >= 3 ? '#fdf2f8' :
                    zAbs >= 2 ? '#fefcbf' :
                    'transparent';
                  const zColor =
                    zAbs >= 3 ? 'var(--danger)' :
                    zAbs >= 2 ? 'var(--warning-border)' :
                    'inherit';

                  return (
                    <tr key={i} style={{ background: rowColor, borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {imp ? formatImperial(row.measure, row.value) : formatMetric(row.measure, row.value)}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          ({imp ? formatMetric(row.measure, row.value) : formatImperial(row.measure, row.value)})
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                        {imp ? formatImperial(row.measure, row.p50) : formatMetric(row.measure, row.p50)}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {row.monthly !== null
                          ? `${row.monthly >= 0 ? '+' : ''}${imp ? formatImperial(row.measure, row.monthly) : formatMetric(row.measure, row.monthly)}`
                          : '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {row.yearly !== null
                          ? `${row.yearly >= 0 ? '+' : ''}${imp ? formatImperial(row.measure, row.yearly) : formatMetric(row.measure, row.yearly)}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            *Expected monthly/yearly increase to maintain current percentile. Rows highlighted yellow = Z ±2, red = Z ±3.
          </p>
        </div>
      )}

      {showTable && results.length === 0 && (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          No measurements available to calculate. Please enter height and/or weight in A1–A3.
        </p>
      )}
    </div>
  );
}