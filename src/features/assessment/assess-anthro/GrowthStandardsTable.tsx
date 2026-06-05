// src/features/assessment/assess-anthro/GrowthStandardsTable.tsx
// Reactive: no generate button — table populates automatically as inputs are entered.
// Columns: Measure | Patient Value | Z-Score | Percentile | 50th %ile Ref | Expected +/mo | Expected +/yr

import { useMemo } from 'react';
import { formatAge } from '../../../shared/utils/date';
import { useAnthroStore } from '../../../stores/useAnthroStore';
import { useNoteStore } from '../../../stores/useNoteStore';
import { useCalculatedMetrics, toKg, toCm } from '../../../stores/useCalculatedMetrics';

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface GrowthRow {
  measure: string;          // e.g. "Weight-for-age"
  patientValue: string;     // formatted patient measurement
  patientValueAlt: string;  // imperial/metric alternate
  zScore: number | null;
  percentile: number | null;
  p50: number | null;       // 50th %ile reference value
  p50Formatted: string;
  monthly: number | null;   // expected gain/month to maintain percentile
  yearly: number | null;    // expected gain/year to maintain percentile
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtMetric(measure: string, val: number): string {
  if (measure.startsWith('Weight') || measure === 'Wt-for-len') return `${val.toFixed(2)} kg`;
  if (measure.startsWith('Length') || measure === 'Head') return `${val.toFixed(1)} cm`;
  if (measure === 'BMI') return `${val.toFixed(1)} kg/m²`;
  return val.toFixed(2);
}

function fmtImperial(measure: string, val: number): string {
  if (measure.startsWith('Weight') || measure === 'Wt-for-len') return `${(val * 2.2046).toFixed(2)} lbs`;
  if (measure.startsWith('Length') || measure === 'Head') return `${(val / 2.54).toFixed(1)} in`;
  return '';
}

function fmtDelta(measure: string, val: number | null, imp: boolean): string {
  if (val === null) return '—';
  const sign = val >= 0 ? '+' : '';
  if (imp) {
    const s = fmtImperial(measure, Math.abs(val));
    return s ? `${sign}${val < 0 ? '-' : ''}${s}` : '—';
  }
  return `${sign}${fmtMetric(measure, val)}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GrowthStandardsTable({ units = 'metric' }: { units?: 'metric' | 'imperial' }) {
  const anthro = useAnthroStore((s) => s.anthro);
  const patientData = useNoteStore((s) => s.patientData);
  const calculatedMetrics = useCalculatedMetrics();

  const { ageDays } = calculatedMetrics;
  const imp = units === 'imperial';

  const rows = useMemo<GrowthRow[]>(() => {
    if (ageDays === null || ageDays < 0) return [];

    const sex: 'M' | 'F' = patientData.sex === 'F' ? 'F' : 'M';
    const dob = patientData.dob;
    const noteDate = patientData.noteDate;
    if (!dob || !noteDate || !patientData.sex) return [];

    const htCm  = toCm(Number(anthro.ht)   || 0, anthro.htUnit   || 'cm');
    const wtKg  = toKg(Number(anthro.wt)   || 0, anthro.wtUnit   || 'kg');
    const headCm = toCm(Number(anthro.head) || 0, anthro.circUnit || 'cm');
    const bmi   = htCm > 0 && wtKg > 0 ? wtKg / Math.pow(htCm / 100, 2) : null;

    const ageMos = ageDays / 30.4375;
    const isInfant = ageDays <= 730;

    const result: GrowthRow[] = [];

    // ── WHO infant path (0–730 days) ─────────────────────────────────────────
    if (isInfant) {
      const buildWHO = (
        measureName: string,
        data: any[],
        keyCol: string,
        keyVal: number | null,
        rawVal: number | null,
        lfaData: any[]
      ): GrowthRow | null => {
        if (!keyVal || !rawVal || rawVal <= 0) return null;
        const row = getClosestRow(data, keyCol, keyVal);
        if (!row) return null;

        const z = calcLMSZScore(rawVal, row.L, row.M, row.S, false);
        const p = stdNormCDF(z) * 100;
        const p50val = row.SD0 ?? null;

        let monthly: number | null = null;
        let yearly: number | null = null;

        if (keyCol === 'Day') {
          if (ageDays <= 699) {
            const fRow = getClosestRow(data, 'Day', ageDays + 31);
            if (fRow) monthly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, false) - rawVal;
          }
          if (ageDays <= 365) {
            const fRow = getClosestRow(data, 'Day', ageDays + 365);
            if (fRow) yearly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, false) - rawVal;
          } else {
            // Cross-table projection to CDC for 12-24 month olds
            const targetAgeMos = (ageDays + 365) / 30.4375;
            let cdcData = null;
            if (measureName === 'Weight-for-age') cdcData = cdcBySex(cdcWtage, sex);
            else if (measureName === 'Length-for-age') cdcData = cdcBySex(cdcStatage, sex);
            else if (measureName === 'BMI-for-age') cdcData = cdcBySex(cdcBmiage, sex);
            
            if (cdcData) {
              const cdcRow = getClosestRow(cdcData, 'Agemos', targetAgeMos);
              if (cdcRow) {
                yearly = calcLMSValue(z, cdcRow.L, cdcRow.M, cdcRow.S, true) - rawVal;
              }
            }
          }
        }
        if (keyCol === 'Length' && htCm > 0) {
          const lRow = getClosestRow(lfaData, 'Day', ageDays);
          if (lRow) {
            const zHt = calcLMSZScore(htCm, lRow.L, lRow.M, lRow.S, false);
            if (ageDays <= 699) {
              const fLRow = getClosestRow(lfaData, 'Day', ageDays + 31);
              if (fLRow) {
                const futLen = calcLMSValue(zHt, fLRow.L, fLRow.M, fLRow.S, false);
                const futWfl = getClosestRow(data, 'Length', Math.round(futLen * 10) / 10);
                if (futWfl) monthly = calcLMSValue(z, futWfl.L, futWfl.M, futWfl.S, false) - rawVal;
              }
            }
            if (ageDays <= 365) {
              const fLRow = getClosestRow(lfaData, 'Day', ageDays + 365);
              if (fLRow) {
                const futLen = calcLMSValue(zHt, fLRow.L, fLRow.M, fLRow.S, false);
                const futWfl = getClosestRow(data, 'Length', Math.round(futLen * 10) / 10);
                if (futWfl) yearly = calcLMSValue(z, futWfl.L, futWfl.M, futWfl.S, false) - rawVal;
              }
            }
          }
        }

        return {
          measure: measureName,
          patientValue: fmtMetric(measureName, rawVal),
          patientValueAlt: fmtImperial(measureName, rawVal),
          zScore: Math.round(z * 100) / 100,
          percentile: Math.round(p * 10) / 10,
          p50: p50val,
          p50Formatted: p50val !== null ? fmtMetric(measureName, p50val) : '—',
          monthly,
          yearly,
        };
      };

      const lfaData = whoLfa(sex);

      if (wtKg > 0) {
        const r = buildWHO('Weight-for-age', whoWfa(sex), 'Day', ageDays, wtKg, lfaData);
        if (r) result.push(r);
      }
      if (htCm > 0) {
        const r = buildWHO('Length-for-age', lfaData, 'Day', ageDays, htCm, lfaData);
        if (r) result.push(r);
      }
      if (wtKg > 0 && htCm > 0) {
        const r = buildWHO('Wt-for-len', whoWfl(sex), 'Length', Math.round(htCm * 10) / 10, wtKg, lfaData);
        if (r) result.push(r);
      }
      if (bmi !== null) {
        const r = buildWHO('BMI-for-age', whoBfa(sex), 'Day', ageDays, bmi, lfaData);
        if (r) result.push(r);
      }
      if (headCm > 0) {
        const r = buildWHO('Head-for-age', whoHfa(sex), 'Day', ageDays, headCm, lfaData);
        if (r) result.push(r);
      }

    // ── CDC child/adolescent path (>730 days, <6570 days) ────────────────────
    } else {
      const buildCDC = (
        measureName: string,
        data: any[],
        rawVal: number | null
      ): GrowthRow | null => {
        if (!rawVal || rawVal <= 0) return null;
        const row = getClosestRow(data, 'Agemos', ageMos);
        if (!row) return null;

        const z = calcLMSZScore(rawVal, row.L, row.M, row.S, true);
        const p = stdNormCDF(z) * 100;
        const p50val = row.P50 ?? null;

        let monthly: number | null = null;
        let yearly: number | null = null;

        if (ageMos <= 239) {
          const fRow = getClosestRow(data, 'Agemos', ageMos + 1);
          if (fRow) monthly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, true) - rawVal;
        }
        if (ageMos <= 228) {
          const fRow = getClosestRow(data, 'Agemos', ageMos + 12);
          if (fRow) yearly = calcLMSValue(z, fRow.L, fRow.M, fRow.S, true) - rawVal;
        }

        return {
          measure: measureName,
          patientValue: fmtMetric(measureName, rawVal),
          patientValueAlt: fmtImperial(measureName, rawVal),
          zScore: Math.round(z * 100) / 100,
          percentile: Math.round(p * 10) / 10,
          p50: p50val,
          p50Formatted: p50val !== null ? fmtMetric(measureName, p50val) : '—',
          monthly,
          yearly,
        };
      };

      const wtData  = cdcBySex(cdcWtage,  sex);
      const htData  = cdcBySex(cdcStatage, sex);
      const bmiData = cdcBySex(cdcBmiage,  sex);

      if (wtKg > 0) {
        const r = buildCDC('Weight-for-age', wtData, wtKg);
        if (r) result.push(r);
      }
      if (htCm > 0) {
        const r = buildCDC('Stature-for-age', htData, htCm);
        if (r) result.push(r);
      }
      if (bmi !== null) {
        const r = buildCDC('BMI-for-age', bmiData, bmi);
        if (r) result.push(r);
      }
    }

    return result;
  }, [
    ageDays, patientData.sex, patientData.dob, patientData.noteDate,
    anthro.ht, anthro.htUnit, anthro.wt, anthro.wtUnit,
    anthro.head, anthro.circUnit,
  ]);

  // Only render for pediatric patients
  if (ageDays === null || ageDays >= 6570) return null;

  const isInfant = ageDays <= 730;
  const missingInputs: string[] = [];
  if (!patientData.sex) missingInputs.push('Patient Sex');
  if (!patientData.dob) missingInputs.push('Date of Birth');
  if (!patientData.noteDate) missingInputs.push('Note Date');
  if (!anthro.wt) missingInputs.push('Weight');
  if (!anthro.ht) missingInputs.push('Height/Length');

  const zColor = (z: number | null): string => {
    if (z === null) return 'inherit';
    const abs = Math.abs(z);
    if (abs >= 3) return '#c0392b';
    if (abs >= 2) return '#b7770d';
    return '#27ae60';
  };

  const rowBg = (z: number | null): string => {
    if (z === null) return 'transparent';
    const abs = Math.abs(z);
    if (abs >= 3) return '#fdf2f8';
    if (abs >= 2) return '#fefcbf';
    return 'transparent';
  };

  return (
    <div className="card mt-2">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)' }}>
            A7: Growth Standards Projection
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Populates automatically as measurements are entered above · Updates live
          </p>
        </div>
        {ageDays !== null && patientData.sex && (
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
            {formatAge(ageDays)}, {patientData.sex === 'F' ? 'Female' : 'Male'} —{' '}
            {isInfant ? 'WHO 0–24mo' : 'CDC 2–18y'}
          </span>
        )}
      </div>

      {missingInputs.length > 0 && rows.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
          Enter the following to populate: <strong>{missingInputs.join(', ')}</strong>
        </p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
          No measurements available yet — enter Height and Weight above.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {(['Measure', 'Patient Value', 'Z-Score', 'Percentile', '50th %ile Ref', 'Expected +/mo*', 'Expected +/yr*'] as const).map(col => (
                    <th key={col} style={{
                      padding: '8px 12px',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: '#4a5568',
                      borderBottom: '2px solid #e2e8f0',
                      whiteSpace: 'nowrap',
                      textAlign: col === 'Measure' ? 'left' : 'center',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.measure} style={{ background: rowBg(row.zScore), borderBottom: '1px solid #e2e8f0' }}>
                    {/* Measure name */}
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      {row.measure}
                    </td>
                    {/* Patient Value */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>
                        {imp ? row.patientValueAlt || row.patientValue : row.patientValue}
                      </span>
                      {row.patientValueAlt && (
                        <span style={{ fontSize: '0.7rem', color: '#718096', marginLeft: '4px' }}>
                          ({imp ? row.patientValue : row.patientValueAlt})
                        </span>
                      )}
                    </td>
                    {/* Z-Score */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: zColor(row.zScore), whiteSpace: 'nowrap' }}>
                      {row.zScore !== null ? `${row.zScore >= 0 ? '+' : ''}${row.zScore.toFixed(2)}` : '—'}
                    </td>
                    {/* Percentile */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {row.percentile !== null ? `${row.percentile.toFixed(1)}th` : '—'}
                    </td>
                    {/* 50th %ile Ref */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#718096', whiteSpace: 'nowrap' }}>
                      {row.p50Formatted}
                    </td>
                    {/* Expected +/mo */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#4a5568', whiteSpace: 'nowrap' }}>
                      {fmtDelta(row.measure, row.monthly, imp)}
                    </td>
                    {/* Expected +/yr */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#4a5568', whiteSpace: 'nowrap' }}>
                      {fmtDelta(row.measure, row.yearly, imp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.68rem', color: '#a0aec0', marginTop: '0.5rem', marginBottom: 0 }}>
            *Expected monthly/yearly increase to maintain current percentile. Z highlighted:
            <span style={{ color: '#b7770d', fontWeight: 700 }}> yellow = ±2</span>,
            <span style={{ color: '#c0392b', fontWeight: 700 }}> red = ±3</span>.
          </p>
        </>
      )}
    </div>
  );
}