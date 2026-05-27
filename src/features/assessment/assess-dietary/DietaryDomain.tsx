import React, { useState, useMemo } from 'react';
import { AlertBanner } from '../../../shared/ui/AlertBanner';
import D1NutritionRx from '../admin-dietary/D1NutritionRx';
import { DIETARY_CATEGORIES } from '../../../shared/constants/adimeSideBarCategories.ts';
import DrugNutrientInteractionTable from "./DrugNutrientInteractionTable";

import { DomainHeader } from '../../../shared/ui/DomainHeader';

export default function DietaryDomain({ dietary, setDietary, activeSubDomain, clinical }: any) {
  const [recallStep, setRecallStep] = useState(0);

  const handleUpdate = (field: string, val: any) =>
    setDietary({ ...dietary, [field]: val });

  const drugs = useMemo(() => {
    try {
      const parsed = JSON.parse(clinical?.medications || "[]");
      if (Array.isArray(parsed)) return parsed.map((d: any) => d.name).filter(Boolean);
    } catch {
      // Fallback for legacy plain text if any
      return (clinical?.medications || "").split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }, [clinical?.medications]);

  const supplements = useMemo(() => {
    const list = [
      ...(dietary?.herbalCAM || "").split(/[,;\n]+/),
      ...(dietary?.supplements || "").split(/[,;\n]+/),
    ];
    return list.map(s => s.trim()).filter(Boolean);
  }, [dietary?.herbalCAM, dietary?.supplements]);

  const updateRecallMeal = (index: number, updates: any) => {
    const newRecall = [...(dietary.recall || [])];
    newRecall[index] = { ...newRecall[index], ...updates };
    handleUpdate("recall", newRecall);
  };

  const addMeal = () => {
    const newRecall = [...(dietary.recall || [])];
    const nextIndex = newRecall.length + 1;
    newRecall.push({ label: `Meal ${nextIndex}`, value: "" });
    handleUpdate("recall", newRecall);
    setRecallStep(newRecall.length - 1);
  };

  const removeMeal = (index: number) => {
    if (dietary.recall.length <= 1) return;
    let newRecall = dietary.recall.filter((_: any, i: number) => i !== index);
    
    // Re-index labels
    newRecall = newRecall.map((meal: any, i: number) => ({
      ...meal,
      label: `Meal ${i + 1}`
    }));

    handleUpdate("recall", newRecall);
    if (recallStep >= newRecall.length) setRecallStep(newRecall.length - 1);
  };

  const renderContent = () => {
    const recall = dietary?.recall || [];
    const currentMeal = recall[recallStep] || { label: "Meal 1", value: "" };

    switch (activeSubDomain) {
      case "D1":
        return <D1NutritionRx dietary={dietary} setDietary={setDietary} />;

      case "D2":
        return (
          <>
            <div className="card">
              <div className="flex-between mb-1">
                <h4 style={{ margin: 0 }}>D21: 24-Hour Recall / Intake Journals</h4>
                <button className="btn-outline" onClick={addMeal} style={{ fontSize: '0.7rem' }}>+ Add Meal</button>
              </div>
              <div className="stepper-container">
                <div className="stepper-header" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                  {recall.map((meal: any, idx: number) => (
                    <div
                      key={idx}
                      className={`step ${recallStep === idx ? "active" : ""}`}
                      onClick={() => setRecallStep(idx)}
                    >
                      <div className="step-circle">{idx + 1}</div>
                      <span>{meal.label}</span>
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>{currentMeal.label} Details</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {recall.length > 1 && (
                        <button 
                          className="btn-outline" 
                          onClick={() => removeMeal(recallStep)}
                          style={{ fontSize: '0.65rem', padding: '2px 6px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={currentMeal.value}
                    onChange={e => updateRecallMeal(recallStep, { value: e.target.value })}
                    placeholder={`Enter details for ${currentMeal.label}...`}
                    style={{ minHeight: "150px" }}
                  />
                </div>
              </div>
            </div>
            <div className="card">
              <h4 className="mb-1">Additional D2 Factors</h4>
              <div className="grid-2-col">
                <div className="input-group">
                  <label>D22: Estimated Energy Intake (%)</label>
                  <input 
                    type="number" 
                    value={dietary?.eeiPercent || ""} 
                    onChange={e => handleUpdate("eeiPercent", e.target.value)} 
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="input-group">
                  <label>D22: Intake Timeframe (Days)</label>
                  <input 
                    type="number" 
                    value={dietary?.eeiTimeframe || ""} 
                    onChange={e => handleUpdate("eeiTimeframe", e.target.value)} 
                    placeholder="e.g. 7"
                  />
                </div>
                <div className="input-group"><label>D23: Macro & Micronutrient Adequacy</label><textarea value={dietary?.macroAdequacy || ""} onChange={e => handleUpdate("macroAdequacy", e.target.value)} /></div>
                <div className="input-group"><label>D24: Meal & Snack Patterns</label><textarea value={dietary?.mealPatterns || ""} onChange={e => handleUpdate("mealPatterns", e.target.value)} /></div>
                <div className="input-group"><label>D25: Current & Previous Diets</label><textarea value={dietary?.currentDiets || ""} onChange={e => handleUpdate("currentDiets", e.target.value)} /></div>
                <div className="input-group"><label>D26: Fluid Intake</label><input type="text" value={dietary?.fluidIntake || ""} onChange={e => handleUpdate("fluidIntake", e.target.value)} /></div>
                <div className="input-group"><label>D27: Eating Environment</label><input type="text" value={dietary?.eatingEnv || ""} onChange={e => handleUpdate("eatingEnv", e.target.value)} /></div>
              </div>
            </div>
          </>
        );

      case "D3":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D31: Physical Activity Level</label><textarea style={{ minHeight: "100px" }} value={dietary?.physicalLevel || ""} onChange={e => handleUpdate("physicalLevel", e.target.value)} /></div>
              <div className="input-group"><label>D32: Functional Status (ADLs)</label><textarea style={{ minHeight: "100px" }} value={dietary?.adls || ""} onChange={e => handleUpdate("adls", e.target.value)} /></div>
              <div className="input-group"><label>D33: Physiological Feeding Tasks</label><textarea style={{ minHeight: "100px" }} value={dietary?.feedingTasks || ""} onChange={e => handleUpdate("feedingTasks", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D4":
        return (
          <div className="card">
            <h4 className="mb-1">Knowledge, Beliefs, & Attitudes</h4>
            <div className="grid-2-col">
              <div className="input-group"><label>D41: Understanding of Condition</label><textarea style={{ minHeight: "100px" }} value={dietary?.understanding || ""} onChange={e => handleUpdate("understanding", e.target.value)} /></div>
              <div className="input-group"><label>D43: Psychological Ties to Food</label><textarea style={{ minHeight: "100px" }} value={dietary?.psychTies || ""} onChange={e => handleUpdate("psychTies", e.target.value)} /></div>
            </div>
            <div className="input-group" style={{ maxWidth: "400px", marginTop: "1.5rem" }}>
              <label>D42: Readiness to Change</label>
              <div className="slider-container">
                <input
                  type="range" min="1" max="10"
                  value={dietary?.readiness || 1}
                  onChange={e => handleUpdate("readiness", e.target.value)}
                />
                <div className="slider-labels">
                  <span>1 (Not Ready)</span>
                  <span style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "1.2rem" }}>{dietary?.readiness || 1}</span>
                  <span>10 (Very Ready)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "D5":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D51: Meal Prep Habits</label><textarea style={{ minHeight: "100px" }} value={dietary?.mealPrep || ""} onChange={e => handleUpdate("mealPrep", e.target.value)} /></div>
              <div className="input-group"><label>D52: Eating Out Frequency</label><textarea style={{ minHeight: "100px" }} value={dietary?.eatingOut || ""} onChange={e => handleUpdate("eatingOut", e.target.value)} /></div>
              <div className="input-group"><label>D53: Binge/Purge Tendencies</label><textarea style={{ minHeight: "100px" }} value={dietary?.bingePurge || ""} onChange={e => handleUpdate("bingePurge", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D6":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D61: Food Security</label><textarea style={{ minHeight: "100px" }} value={dietary?.foodSecurity || ""} onChange={e => handleUpdate("foodSecurity", e.target.value)} /></div>
              <div className="input-group"><label>D62: Food-Related Supplies</label><textarea style={{ minHeight: "100px" }} value={dietary?.foodSupplies || ""} onChange={e => handleUpdate("foodSupplies", e.target.value)} /></div>
              <div className="input-group"><label>D63: Transportation Access</label><textarea style={{ minHeight: "100px" }} value={dietary?.transport || ""} onChange={e => handleUpdate("transport", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D7":
        return (
          <div className="card">
            <div className="grid-2-col">
              <div className="input-group"><label>D71: Religious & Spiritual Observances</label><textarea style={{ minHeight: "100px" }} value={dietary?.culturalReligious || ""} onChange={e => handleUpdate("culturalReligious", e.target.value)} /></div>
              <div className="input-group"><label>D72: Social Meal Dynamics</label><textarea style={{ minHeight: "100px" }} value={dietary?.socialDynamics || ""} onChange={e => handleUpdate("socialDynamics", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D8":
        return (
          <div className="card">
            <AlertBanner
              type="warning"
              message="Check Domain B for potential Drug-Nutrient Interactions related to Potassium."
            />
      
            <div className="grid-2-col">
              <div className="input-group">
                <label>D83: Supplement Products</label>
                <textarea
                  value={dietary?.herbalCAM || ""}
                  onChange={e => handleUpdate("herbalCAM", e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>D84: Vitamin & Mineral Supplements</label>
                <textarea
                  value={dietary?.supplements || ""}
                  onChange={e => handleUpdate("supplements", e.target.value)}
                />
              </div>
            </div>

            <DrugNutrientInteractionTable
              drugs={drugs}
              supplements={supplements}
            />
          </div>
        );

      case "D9":
        return (
          <div className="card">
            <div className="grid-2-col">
              <div className="input-group"><label>D91: Perception of Intervention</label><textarea style={{ minHeight: "100px" }} value={dietary?.perception || ""} onChange={e => handleUpdate("perception", e.target.value)} /></div>
              <div className="input-group"><label>D92: Personal Goals & QoL</label><textarea style={{ minHeight: "100px" }} value={dietary?.qolGoals || ""} onChange={e => handleUpdate("qolGoals", e.target.value)} /></div>
            </div>
          </div>
        );

      default:
        return <div>Select a sub-domain from the sidebar.</div>;
    }
  };

  return (
    <div className="fade-in">
      <DomainHeader title={DIETARY_CATEGORIES.find(c => c.id === activeSubDomain)?.title || "Dietary"} />
      {renderContent()}
    </div>
  );
}