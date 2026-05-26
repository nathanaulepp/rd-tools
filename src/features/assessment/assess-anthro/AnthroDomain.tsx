// src/features/assessment/assess-anthro/AnthroDomain.tsx
import React, { useMemo } from 'react';
import { AlertBanner } from '../../../shared/ui/AlertBanner';
import GrowthStandardsTable from '../assess-anthro/GrowthStandardsTable';
import { ASSESSMENT_CATEGORIES } from '../../../shared/constants/adimeSideBarCategories';
import GrowthVelocityTable from '../assess-anthro/GrowthVelocityTable';
import NutritionStandardsDomain from '../assess-standards/NutritionStandardsDomain';

import { DomainHeader } from '../../../shared/ui/DomainHeader';
import { formatAge } from '../../../shared/utils/date';

export default function AnthroDomain({ anthro, setAnthro, dexaScans, setDexaScans, calculatedMetrics, patientData, dietary, activeSubDomain }: any) {
  const handleUpdate = (field: string, val: string) => setAnthro({ ...anthro, [field]: val });

  const addDexaScan = () => setDexaScans([...dexaScans, { id: Date.now(), date: "", bmd: "", fatMass: "", leanMass: "", bodyFatPct: "" }]);
  const updateDexa = (id: number, field: string, val: string) => {
    setDexaScans(dexaScans.map((scan:any) => scan.id === id ? { ...scan, [field]: val } : scan));
  };

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
                    <span className="chip active">
                      Δ Wt: {wtChangeDetails.pctString}%
                    </span>
                  )}
                  
                  {wtChangeDetails?.isLoss && (
                    <span className={`chip ${wtChangeDetails.isSevere ? "active-danger" : "active-warning"}`}>
                      Wt Loss: {wtChangeDetails.absPctString}% {wtChangeDetails.timeStr ? `(${wtChangeDetails.timeStr})` : ""}
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
      case "A9":
        return (
          <NutritionStandardsDomain 
            anthro={anthro} 
            patientData={patientData} 
            calculatedMetrics={calculatedMetrics} 
            dietary={dietary} 
          />
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