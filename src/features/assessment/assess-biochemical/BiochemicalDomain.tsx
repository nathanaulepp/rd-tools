import React, { useState } from 'react';
import { AlertBanner } from '../shared/ui/AlertBanner';
import { LAB_CATEGORIES } from '../entities/lab/model';

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