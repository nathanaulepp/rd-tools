import React, { useState } from 'react';
import { AlertBanner } from '../../../shared/ui/AlertBanner';
import { LAB_CATEGORIES } from '../../../shared/constants/labCategories';

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
          <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden' }}>

            <div
              onClick={() => toggleCategory(idx)}
              style={{
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                userSelect: 'none',
                borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
              }}
            >
              <h4 className="flex-between" style={{ margin: 0 }}>
                {category.title}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {isCollapsed ? '▼' : '▲'}
                </span>
              </h4>
            </div>

            {!isCollapsed && (
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
                            <td><strong>{field}</strong></td>
                            <td>
                              <input
                                type="text"
                                placeholder="--"
                                value={historicalVal}
                                onChange={e => updateLab(field, 'historical', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="--"
                                value={currentVal}
                                onChange={e => updateLab(field, 'current', e.target.value)}
                              />
                            </td>
                          </tr>
                        );
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