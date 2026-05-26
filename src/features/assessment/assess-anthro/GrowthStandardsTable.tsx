// src/components/create_adime/assessment/GrowthStandardsTable.tsx
import React, { useState } from 'react';
import { formatAge } from '../../../shared/utils/date';

// WHO (0-730 Days)
import wfaBoysRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/weight_for_age-boys-zscore-expanded-tables.csv?raw';
import wfaGirlsRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/weight_for_age-girls-zscore-expanded-tables.csv?raw';
import lfaBoysRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/lengthheight_for_age-boys-zscore-expanded-tables.csv?raw';
import lfaGirlsRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/lengthheight_for_age-girls-zscore-expanded-tables.csv?raw';
import wflBoysRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/weight_for_length-boys-zscore-expanded-table.csv?raw';
import wflGirlsRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/weight_for_length-girls-zscore-expanded-table.csv?raw';
import bfaBoysRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/bmi_for_age-boys-zscore-expanded-tables.csv?raw';
import bfaGirlsRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/bmi_for_age-girls-zscore-expanded-tables.csv?raw';
import hfaBoysRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/headcircumference_for_age-boys-zscore-expanded-tables.csv?raw';
import hfaGirlsRaw from '../../../shared/assets/datafiles_cleaned_csv/0_730_days/headcircumference_for_age-girls-zscore-expanded-tables.csv?raw';

// CDC (24-240 Months)
import wtageRaw from '../../../shared/assets/datafiles_cleaned_csv/24_240_months/wtage.csv?raw';
import statageRaw from '../../../shared/assets/datafiles_cleaned_csv/24_240_months/statage.csv?raw';
import bmiageRaw from '../../../shared/assets/datafiles_cleaned_csv/24_240_months/bmiagerev.csv?raw';

// Utility to parse standard CSV string into JS Objects
function parseCSV(raw: string) {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = lines[i].split(',');
    const obj: any = {};
    headers.forEach((h, j) => {
      obj[h] = parseFloat(values[j]);
    });
    parsed.push(obj);
  }
  return parsed;
}

// Approximation of Standard Normal CDF
function stdNormCDF(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423;
  const p = 1 - d * Math.exp(-x * x / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? p : 1 - p;
}

// Compute Initial & Adjusted Z-Score via LMS 
function computeZ(y: number, L: number, M: number, S: number, measure: string, isCDC: boolean) {
  const z_initial = (Math.pow(y / M, L) - 1) / (S * L);
  if (isCDC || measure === 'Length/height') return z_initial;
  
  if (Math.abs(z_initial) <= 3) return z_initial;
  
  const SD3pos = M * Math.pow(1 + L * S * 3, 1 / L);
  const SD3neg = M * Math.pow(1 + L * S * -3, 1 / L);
  const SD2pos = M * Math.pow(1 + L * S * 2, 1 / L);
  const SD2neg = M * Math.pow(1 + L * S * -2, 1 / L);
  const SD23pos = SD3pos - SD2pos;
  const SD23neg = SD2neg - SD3neg;
  
  if (z_initial > 3) return 3 + (y - SD3pos) / SD23pos;
  return -3 + (y - SD3neg) / SD23neg;
}

// Reverse LMS calculation to find Y value target
function computeY(z: number, L: number, M: number, S: number, measure: string, isCDC: boolean) {
  if (isCDC || measure === 'Length/height' || Math.abs(z) <= 3) {
    return M * Math.pow(1 + L * S * z, 1 / L);
  }
  
  const SD3pos = M * Math.pow(1 + L * S * 3, 1 / L);
  const SD3neg = M * Math.pow(1 + L * S * -3, 1 / L);
  const SD2pos = M * Math.pow(1 + L * S * 2, 1 / L);
  const SD2neg = M * Math.pow(1 + L * S * -2, 1 / L);
  const SD23pos = SD3pos - SD2pos;
  const SD23neg = SD2neg - SD3neg;
  
  if (z > 3) return SD3pos + (z - 3) * SD23pos;
  return SD3neg + (z + 3) * SD23neg;
}

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

export default function GrowthStandardsTable({ anthro, patientData, calculatedMetrics }: any) {
  const [results, setResults] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);

  const handleGenerate = () => {
    // Pull from the global Patient Header state via calculatedMetrics
    const ageDays = calculatedMetrics?.ageDays;
    const rawSex = patientData?.sex;

    if (ageDays === null || ageDays === undefined) return alert("Please set both Patient DOB and Note Date in the Patient Header to calculate age.");
    if (!rawSex) return alert("Please specify the patient's Sex in the Patient Header.");

    // Map 'M'/'F' to WHO/CDC file standard '1'/'2'
    const sex = rawSex === 'F' ? "2" : "1";
    
    if (ageDays < 0) return alert("Note Date must be after Patient DOB");

    const isInfant = ageDays <= 730;
    const ageMos = Math.round((ageDays / 30.5) * 2) / 2;

    const htCm = anthro.ht ? (anthro.htUnit === 'in' ? Number(anthro.ht) * 2.54 : Number(anthro.ht)) : null;
    const wtKg = anthro.wt ? (anthro.wtUnit === 'lbs' ? Number(anthro.wt) / 2.205 : Number(anthro.wt)) : null;
    const headCm = anthro.head ? (anthro.circUnit === 'in' ? Number(anthro.head) * 2.54 : Number(anthro.head)) : null;
    const bmi = (htCm && wtKg && htCm > 0) ? (wtKg / Math.pow(htCm / 100, 2)) : null;

    const res: any[] = [];

    const getRow = (data: any[], keyCol: string, keyVal: number) => {
      let closest = data[0];
      let minDiff = Infinity;
      for (const row of data) {
        const diff = Math.abs(row[keyCol] - keyVal);
        if (diff < minDiff) { minDiff = diff; closest = row; }
      }
      return closest;
    };

    if (isInfant) {
      // Load 0-730 datasets
      const wfaData = parseCSV(sex === "1" ? wfaBoysRaw : wfaGirlsRaw);
      const lfaData = parseCSV(sex === "1" ? lfaBoysRaw : lfaGirlsRaw);
      const wflData = parseCSV(sex === "1" ? wflBoysRaw : wflGirlsRaw);
      const bfaData = parseCSV(sex === "1" ? bfaBoysRaw : bfaGirlsRaw);
      const hfaData = parseCSV(sex === "1" ? hfaBoysRaw : hfaGirlsRaw);

      const computeRowWHO = (measureName: string, data: any[], keyCol: string, keyVal: number | null, yVal: number | null, isLength = false) => {
        if (keyVal === null || yVal === null) return null;
        const row = getRow(data, keyCol, keyVal);
        if (!row) return null;

        const z = computeZ(yVal, row.L, row.M, row.S, measureName, false);
        const p = stdNormCDF(z) * 100;
        const p50 = row.SD0;

        let monthly = null;
        let yearly = null;

        // Future Trajectory for standard columns (Day)
        if (keyCol === 'Day') {
          if (ageDays <= 699) {
            const fRow = getRow(data, 'Day', ageDays + 31);
            if (fRow) monthly = computeY(z, fRow.L, fRow.M, fRow.S, measureName, false) - yVal;
          }
          if (ageDays <= 365) {
            const fRow = getRow(data, 'Day', ageDays + 365);
            if (fRow) yearly = computeY(z, fRow.L, fRow.M, fRow.S, measureName, false) - yVal;
          }
        } 
        // Future Trajectory for wt-for-len (Length key dependent on future length projection)
        else if (keyCol === 'Length' && htCm !== null) {
          const lRow = getRow(lfaData, 'Day', ageDays);
          const zHt = computeZ(htCm, lRow.L, lRow.M, lRow.S, 'Length/height', false);

          if (ageDays <= 699) {
            const fLRow = getRow(lfaData, 'Day', ageDays + 31);
            const futLength = computeY(zHt, fLRow.L, fLRow.M, fLRow.S, 'Length/height', false);
            const futWflRow = getRow(data, 'Length', Math.round(futLength * 10) / 10);
            if (futWflRow) monthly = computeY(z, futWflRow.L, futWflRow.M, futWflRow.S, measureName, false) - yVal;
          }
          if (ageDays <= 365) {
            const fLRow = getRow(lfaData, 'Day', ageDays + 365);
            const futLength = computeY(zHt, fLRow.L, fLRow.M, fLRow.S, 'Length/height', false);
            const futWflRow = getRow(data, 'Length', Math.round(futLength * 10) / 10);
            if (futWflRow) yearly = computeY(z, fLRow.L, fLRow.M, fLRow.S, measureName, false) - yVal;
          }
        }

        return { measure: measureName, value: yVal, z, p, p50, monthly, yearly };
      };

      const rWt = computeRowWHO('Weight', wfaData, 'Day', ageDays, wtKg);
      if (rWt) res.push(rWt);
      const rHt = computeRowWHO('Length/height', lfaData, 'Day', ageDays, htCm, true);
      if (rHt) res.push(rHt);
      const rWfl = computeRowWHO('Wt-for-len', wflData, 'Length', htCm ? Math.round(htCm * 10) / 10 : null, wtKg);
      if (rWfl) res.push(rWfl);
      const rBmi = computeRowWHO('BMI', bfaData, 'Day', ageDays, bmi);
      if (rBmi) res.push(rBmi);
      const rHead = computeRowWHO('Head', hfaData, 'Day', ageDays, headCm);
      if (rHead) res.push(rHead);

    } else {
      // Load 24-240 datasets
      const wtageData = parseCSV(wtageRaw);
      const statageData = parseCSV(statageRaw);
      const bmiageData = parseCSV(bmiageRaw);

      const getCDCRow = (data: any[], aMos: number) => {
        const filtered = data.filter(d => String(d.Sex) === sex);
        return getRow(filtered, 'Agemos', aMos);
      };

      const computeRowCDC = (measureName: string, data: any[], yVal: number | null) => {
        if (yVal === null) return null;
        const row = getCDCRow(data, ageMos);
        if (!row) return null;

        const z = computeZ(yVal, row.L, row.M, row.S, measureName, true);
        const p = stdNormCDF(z) * 100;
        const p50 = row.P50;

        let monthly = null;
        let yearly = null;

        // Bounded strictly to prevent looking past the CDC maximum (240 mos / 20 yrs)
        if (ageMos <= 239) {
          const fRow = getCDCRow(data, ageMos + 1);
          if (fRow) monthly = computeY(z, fRow.L, fRow.M, fRow.S, measureName, true) - yVal;
        }
        if (ageMos <= 228) {
          const fRow = getCDCRow(data, ageMos + 12);
          if (fRow) yearly = computeY(z, fRow.L, fRow.M, fRow.S, measureName, true) - yVal;
        }

        return { measure: measureName, value: yVal, z, p, p50, monthly, yearly };
      };

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
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{row.measure}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {formatMetric(row.measure, row.value)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                        ({formatImperial(row.measure, row.value)})
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: zColor }}>
                      {row.z >= 0 ? '+' : ''}{row.z.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: zColor }}>
                      {row.p < 0.1 ? '<0.1' : row.p > 99.9 ? '>99.9' : row.p.toFixed(1)}th
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                      {formatMetric(row.measure, row.p50)}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {row.monthly !== null
                        ? `${row.monthly >= 0 ? '+' : ''}${formatMetric(row.measure, row.monthly)}`
                        : '—'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {row.yearly !== null 
                        ? `${row.yearly >= 0 ? '+' : ''}${formatMetric(row.measure, row.yearly)}`
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
