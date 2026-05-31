// src/features/assessment/assess-anthro/AnthroDomain.tsx
import React, { useMemo } from 'react';
import { AlertBanner } from '../../../shared/ui/AlertBanner';
import GrowthStandardsTable from '../assess-anthro/GrowthStandardsTable';
import { ASSESSMENT_CATEGORIES } from '../../../shared/constants/adimeSideBarCategories';
import GrowthVelocityTable from '../assess-anthro/GrowthVelocityTable';

import { DomainHeader } from '../../../shared/ui/DomainHeader';
import { formatAge } from '../../../shared/utils/date';

const AMPUTATION_DATA = [
  { label: "Hand", pct: 0.7 },
  { label: "Forearm", pct: 2.3 },
  { label: "Entire Arm", pct: 5.0 },
  { label: "Foot", pct: 1.5 },
  { label: "BKA (Below Knee)", pct: 5.9 },
  { label: "AKA (Above Knee)", pct: 11.0 },
  { label: "Entire Leg", pct: 16.0 }
];

export default function AnthroDomain({ anthro, setAnthro, dexaScans, setDexaScans, calculatedMetrics, patientData, activeSubDomain }: any) {
  const handleUpdate = (field: string, val: any) => setAnthro({ ...anthro, [field]: val });

  const addDexaScan = () => setDexaScans([...dexaScans, { id: Date.now(), date: "", bmd: "", fatMass: "", leanMass: "", bodyFatPct: "" }]);
  const updateDexa = (id: number, field: string, val: string) => {
    setDexaScans(dexaScans.map((scan:any) => scan.id === id ? { ...scan, [field]: val } : scan));
  };

  const toggleAmputation = (label: string) => {
    const current = anthro.amputations || [];
    if (current.includes(label)) {
      handleUpdate("amputations", current.filter((l: string) => l !== label));
    } else {
      handleUpdate("amputations", [...current, label]);
    }
  };

  const adjIbw = calculatedMetrics?.adjIbw;

// --- NEW: Dynamic Weight Change Percentage Calculation ---
  const wtChangeDetails = useMemo(() => {
    if (!anthro.wt || !anthro.ubw) return null;
    
    const current = Number(anthro.wt);
    const usual = Number(anthro.ubw);
    if (usual <= 0) return null; 

    const diff = current - usual;
    const pct = (diff / usual) * 100;
    const isLoss = diff < 0;
    const isSevere = isLoss && Math.abs(pct) >= 5.0; // Flags red if weight loss is >= 5%

    const timeStr = calculatedMetrics?.ubwTimeframeDays !== null 
      ? formatAge(calculatedMetrics.ubwTimeframeDays)
      : null;
    
    return {
      pctString: pct.toFixed(1),
      absPctString: Math.abs(pct).toFixed(1),
      isLoss,
      isSevere,
      timeStr
    };
  }, [anthro.wt, anthro.ubw, calculatedMetrics?.ubwTimeframeDays]);

  const renderContent = () => {
    switch (activeSubDomain) {
      case "A1-A5":
        return (
          <>
            <div className="card">
              <h4 className="mb-1 flex-between">
                A1-A3: Height/Length, Weight, BMI, UBW

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`chip ${calculatedMetrics?.bmi !== "--" && Number(calculatedMetrics?.bmi) < 18.5 ? "active-danger" : "active"}`}>
                    BMI: {calculatedMetrics?.bmi || "--"}
                  </span>
                  
                  {wtChangeDetails && (
                    <span className={`chip ${wtChangeDetails.isLoss ? (wtChangeDetails.isSevere ? "active-danger" : "active-warning") : "active"}`}>
                      Δ Wt: {wtChangeDetails.pctString}% {wtChangeDetails.timeStr ? `(${wtChangeDetails.timeStr})` : ""}
                    </span>
                  )}
                </div>
              </h4>

              <div className="grid-4-col">
                <div className="input-group">
                  <label>Height/Length</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="number" value={anthro.ht} onChange={e => handleUpdate("ht", e.target.value)} />
                    <select value={anthro.htUnit} onChange={e => handleUpdate("htUnit", e.target.value)} style={{ width: '80px' }}>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Weight</label>
                  <div className="input-group-row">
                    <input type="number" value={anthro.wt} onChange={e => handleUpdate("wt", e.target.value)} />
                    <select style={{width: '70px'}} value={anthro.wtUnit} onChange={e => handleUpdate("wtUnit", e.target.value)}>
                      <option>kg</option><option>lbs</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>UBW</label>
                  <input type="number" placeholder="Adult Patients Only" value={anthro.ubw} onChange={e => handleUpdate("ubw", e.target.value)} />
                </div>

                <div className="input-group">
                  <label>UBW Date (for timeframe)</label>
                  <input 
                    type="date" 
                    value={anthro.ubwDate} 
                    onChange={e => handleUpdate("ubwDate", e.target.value)} 
                  />
                </div>
              </div>

              {/* NEW: Fluid Shift & Amputation Support */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '300px' }}>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox" 
                        id="fluidShift" 
                        checked={anthro.isFluidShift} 
                        onChange={e => handleUpdate("isFluidShift", e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <label htmlFor="fluidShift" style={{ margin: 0, fontWeight: 700, cursor: 'pointer' }}>[x] Fluid Shift / Renal Patient</label>
                    </div>

                    {anthro.isFluidShift && (
                      <div className="fade-in" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                          Estimated Dry Weight (EDW) / Target Weight
                        </label>
                        <div className="input-group-row">
                          <input 
                            type="number" 
                            value={anthro.edw} 
                            onChange={e => handleUpdate("edw", e.target.value)} 
                            placeholder="Target weight"
                          />
                          <select style={{width: '70px'}} value={anthro.edwUnit} onChange={e => handleUpdate("edwUnit", e.target.value)}>
                            <option>kg</option><option>lbs</option>
                          </select>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>
                          Overrides "Current Weight" for nutrition calculations (kcal/kg).
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: '2', minWidth: '400px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                      Amputation / Body Segment Loss
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {AMPUTATION_DATA.map(amp => (
                        <button
                          key={amp.label}
                          onClick={() => toggleAmputation(amp.label)}
                          className={`chip ${anthro.amputations?.includes(amp.label) ? 'active' : ''}`}
                          style={{ cursor: 'pointer', border: '1px solid #e2e8f0', background: anthro.amputations?.includes(amp.label) ? 'var(--primary)' : 'white' }}
                        >
                          {amp.label} ({amp.pct}%)
                        </button>
                      ))}
                    </div>
                    {adjIbw && (
                      <div className="mt-1" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                        Estimated/Adjusted IBW: <span style={{ color: '#2ab3a3' }}>{adjIbw}kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="mb-1 flex-between">
                A4: Circumferences
                <select style={{ width: "80px", padding: '4px' }} value={anthro.circUnit} onChange={e => handleUpdate("circUnit", e.target.value)}>
                  <option>cm</option><option>in</option>
                </select>
              </h4>
              <div className="grid-4-col">
                <div className="input-group"><label>Waist</label><input type="text" value={anthro.waist} onChange={e=>handleUpdate("waist", e.target.value)}/></div>
                <div className="input-group"><label>Mid-Arm (MAC)</label><input type="text" value={anthro.mac} onChange={e=>handleUpdate("mac", e.target.value)}/></div>
                <div className="input-group"><label>Calf</label><input type="text" value={anthro.calf} onChange={e=>handleUpdate("calf", e.target.value)}/></div>
                <div className="input-group"><label>Head</label><input type="text" value={anthro.head} onChange={e=>handleUpdate("head", e.target.value)}/></div>
              </div>
            </div>

            <div className="card">
              <h4 className="mb-1 flex-between">
                A5: Skinfold Thickness
                <select style={{ width: "80px", padding: '4px' }} value={anthro.skinfoldUnit} onChange={e => handleUpdate("skinfoldUnit", e.target.value)}>
                  <option>mm</option><option>cm</option>
                </select>
              </h4>
              <div className="grid-4-col">
                <div className="input-group"><label>Triceps</label><input type="text" value={anthro.triceps} onChange={e=>handleUpdate("triceps", e.target.value)}/></div>
                <div className="input-group"><label>Subscapular</label><input type="text" value={anthro.subscapular} onChange={e=>handleUpdate("subscapular", e.target.value)}/></div>
                <div className="input-group"><label>Suprailiac</label><input type="text" value={anthro.suprailiac} onChange={e=>handleUpdate("suprailiac", e.target.value)}/></div>
                <div className="input-group"><label>Thigh</label><input type="text" value={anthro.thigh} onChange={e=>handleUpdate("thigh", e.target.value)}/></div>
              </div>
            </div>
          </>
        );
      case "A6-A7":
        return (
          <>
            <div className="card">
              <h4 className="mb-1">A6: Growth Velocity (Pediatrics)</h4>
              <div className="grid-3-col">
                <div className="input-group">
                  <label>Past Height/Length</label>
                  <div className="input-group-row" style={{ marginBottom: "0.5rem" }}>
                    <input type="number" value={anthro.past_ht} onChange={e => handleUpdate("past_ht", e.target.value)} />
                    <select style={{ width: '70px' }} value={anthro.past_htUnit} onChange={e => handleUpdate("past_htUnit", e.target.value)}>
                      <option>cm</option><option>in</option>
                    </select>
                  </div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Measured</label>
                  <input type="date" value={anthro.past_htDate} onChange={e => handleUpdate("past_htDate", e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Past Weight</label>
                  <div className="input-group-row" style={{ marginBottom: "0.5rem" }}>
                    <input type="number" value={anthro.past_wt} onChange={e => handleUpdate("past_wt", e.target.value)} />
                    <select style={{ width: '70px' }} value={anthro.past_wtUnit} onChange={e => handleUpdate("past_wtUnit", e.target.value)}>
                      <option>g</option><option>oz</option><option>kg</option><option>lbs</option>
                    </select>
                  </div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Measured</label>
                  <input type="date" value={anthro.past_wtDate} onChange={e => handleUpdate("past_wtDate", e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Past Head Circ.</label>
                  <div className="input-group-row" style={{ marginBottom: "0.5rem" }}>
                    <input type="number" value={anthro.past_head} onChange={e => handleUpdate("past_head", e.target.value)} />
                    <select style={{ width: '70px' }} value={anthro.past_headUnit} onChange={e => handleUpdate("past_headUnit", e.target.value)}>
                      <option>cm</option><option>in</option>
                    </select>
                  </div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Measured</label>
                  <input type="date" value={anthro.past_headDate} onChange={e => handleUpdate("past_headDate", e.target.value)} />
                </div>
              </div>
              <GrowthVelocityTable anthro={anthro} patientData={patientData} calculatedMetrics={calculatedMetrics}/>
            </div>
            <GrowthStandardsTable anthro={anthro} patientData={patientData} calculatedMetrics={calculatedMetrics} />
          </>
        );
      case "A8":
        return (
          <div className="card">
            <h4 className="mb-1">A8: Body Composition (DEXA)</h4>
            <div className="mt-1">
              {dexaScans.length >= 2 && (
                <AlertBanner type="warning" message={`Trend Alert: Lean Delta is ${Number(dexaScans[dexaScans.length-1].leanMass) - Number(dexaScans[dexaScans.length-2].leanMass)} kg`} />
              )}
              {dexaScans.map((scan:any, i:number) => (
                <div key={scan.id} style={{background: 'white', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '1rem'}}>
                  <h5>Scan #{i + 1}</h5>
                  <div className="grid-4-col">
                    <div className="input-group"><label>Date</label><input type="date" value={scan.date} onChange={e => updateDexa(scan.id, "date", e.target.value)} /></div>
                    <div className="input-group"><label>Total Fat Mass (kg)</label><input type="number" value={scan.fatMass} onChange={e => updateDexa(scan.id, "fatMass", e.target.value)} /></div>
                    <div className="input-group"><label>Total Lean Mass (kg)</label><input type="number" value={scan.leanMass} onChange={e => updateDexa(scan.id, "leanMass", e.target.value)} /></div>
                    <div className="input-group"><label>Whole-body BMD</label><input type="number" value={scan.bmd} onChange={e => updateDexa(scan.id, "bmd", e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <button className="btn-outline" onClick={addDexaScan}>+ Add DEXA Scan</button>
            </div>
          </div>
        );
      default:
        return <div>Select a sub-domain from the sidebar.</div>;
    }
  };

  return (
    <div className="fade-in">
      <DomainHeader title={ASSESSMENT_CATEGORIES.find(c => c.id === activeSubDomain)?.title || "Anthropometrics"} />
      {renderContent()}
    </div>
  );
}