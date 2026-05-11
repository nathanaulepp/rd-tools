import React, { useState } from 'react';
import { AlertBanner } from '../shared/AlertBanner';

export const LAB_CATEGORIES = [
  { title: "1. General Chemistry & Electrolytes", fields: ["Sodium", "Potassium", "Chloride", "Bicarbonate (Total CO2)", "Calcium (Total)", "Ionized Calcium", "Magnesium", "Phosphorus", "Osmolality", "Anion Gap"] },
  { title: "2. Renal & Urinary Assessment", fields: ["Urine Sodium", "Urine Potassium", "Urine Chloride", "Microalbumin/Cr Ratio", "BUN", "Creatinine", "eGFR", "Uric Acid", "Cystatin C"] },
  { title: "3. Blood Gas Panels", fields: ["ABG pH", "ABG PaCO2", "ABG PaO2", "ABG HCO3", "VBG pH", "VBG PvCO2", "VBG PvO2", "VBG HCO3"] },
  { title: "4. Hematology & Iron Studies", fields: ["WBC", "RBC", "Hgb", "Hct", "MCV", "Platelets", "Serum Iron", "Ferritin", "TIBC", "Transferrin Saturation %"] },
  { title: "5. Hepatobiliary & Specialty Proteins", fields: ["Total Bilirubin", "Albumin", "Total Protein", "AST", "ALT", "GGT", "Alk Phos", "Ammonia", "Prothrombin Time (PT/INR)", "Serum Copper"] },
  { title: "6. Digestive, Pancreatic & Stool", fields: ["Serum Lipase", "Serum Amylase", "Fecal Elastase-1", "Fecal Calprotectin", "Fecal Lactoferrin", "H. pylori Antigen"] },
  { title: "7. Metabolic, Endocrine & Cardio", fields: ["Fasting Glucose", "HbA1c", "Fasting Insulin", "Total Cholesterol", "LDL-C", "HDL-C", "Triglycerides", "hs-CRP", "TSH", "Free T4"] },
  { title: "8. Micronutrient Status", fields: ["Vitamin D (25-OH)", "Vitamin B1 (TDP)", "Vitamin B12", "Folate", "Zinc", "Selenium", "Vitamin A", "Vitamin C"] }
];

export default function BiochemicalDomain({ labs, setLabs }: any) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<number, boolean>>({});

  const updateLab = (field: string, type: 'current' | 'historical', val: string) => {
    setLabs({
      ...labs,
      [field]: { ...labs[field], [type]: val }
    });
  };

  const toggleCategory = (idx: number) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="fade-in">
      <h2 className="section-title">B. Biochemical Data & Medical Tests</h2>
      <AlertBanner type="danger" message="Potassium levels are critically low (< 3.5 mEq/L). Review immediately." />
      
      {LAB_CATEGORIES.map((category, idx) => {
        const isCollapsed = collapsedCategories[idx];
        
        return (
          // 1. Padding set to 0 here so the inner header can stretch edge-to-edge
          // overflow: 'hidden' keeps your border-radius corners looking sharp
          <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            
            {/* 2. The Edge-to-Edge Clickable Header */}
            <div 
              onClick={() => toggleCategory(idx)}
              style={{ 
                padding: '1.25rem 1.5rem', // Moved the padding here!
                cursor: 'pointer', 
                userSelect: 'none',
                // Adds a subtle border line below the header when the table is open
                borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                // Feel free to add a class here if you want to give it a specific hover color!
              }}
            >
              <h4 className="flex-between" style={{ margin: 0 }}>
                {category.title}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {isCollapsed ? '▼' : '▲'}
                </span>
              </h4>
            </div>
            
            {/* 3. The Padded Content Wrapper */}
            {!isCollapsed && (
              // This restores the padding for the table so it perfectly matches the rest of your app
              <div style={{ padding: '1.5rem' }}>
                <div className="table-container">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Test Name</th>
                        <th style={{ width: '30%' }}>Historical Value</th>
                        <th style={{ width: '30%' }}>Current Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.fields.map(field => {
                        const currentVal = labs[field]?.current || "";
                        const historicalVal = labs[field]?.historical || "";
                        return (
                          <tr key={field}>
                            <td>
                              <strong>{field}</strong>
                              {field === "Potassium" && <span className="context-menu-wrapper" style={{float: 'right'}}><button className="context-btn" title="Options">⋮</button></span>}
                            </td>
                            <td>
                              <input type="text" placeholder="--" value={historicalVal} onChange={e => updateLab(field, 'historical', e.target.value)} />
                            </td>
                            <td style={{ background: field === "Potassium" ? '#fdf2f8' : 'transparent' }}>
                              <input 
                                type="text" 
                                placeholder="--" 
                                value={currentVal} 
                                onChange={e => updateLab(field, 'current', e.target.value)} 
                                style={{ color: field === "Potassium" ? 'red' : 'inherit', fontWeight: field === "Potassium" ? 'bold' : 'normal' }}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}