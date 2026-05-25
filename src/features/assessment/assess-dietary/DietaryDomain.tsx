import React, { useState } from 'react';
import { AlertBanner } from '../../../shared/ui/AlertBanner';
import D3NutritionAdmin from '../admin-dietary/D3NutritionAdmin';
import { DIETARY_CATEGORIES } from '../../../shared/constants/adimeSideBarCategories.ts';

export default function DietaryDomain({ dietary, setDietary, activeSubDomain }: any) {
  const [recallStep, setRecallStep] = useState(0);

  const handleUpdate = (field: string, val: any) =>
    setDietary({ ...dietary, [field]: val });

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
        return (
          <>
            <div className="card">
              <div className="flex-between mb-1">
                <h4 style={{ margin: 0 }}>D11: 24-Hour Recall / Intake Journals</h4>
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
              <h4 className="mb-1">Additional D1 Factors</h4>
              <div className="grid-2-col">
                <div className="input-group"><label>D12: Macro & Micronutrient Adequacy</label><textarea value={dietary?.macroAdequacy || ""} onChange={e => handleUpdate("macroAdequacy", e.target.value)} /></div>
                <div className="input-group"><label>D13: Meal & Snack Patterns</label><textarea value={dietary?.mealPatterns || ""} onChange={e => handleUpdate("mealPatterns", e.target.value)} /></div>
                <div className="input-group"><label>D14: Current & Previous Diets</label><textarea value={dietary?.currentDiets || ""} onChange={e => handleUpdate("currentDiets", e.target.value)} /></div>
                <div className="input-group"><label>D15: Fluid Intake</label><input type="text" value={dietary?.fluidIntake || ""} onChange={e => handleUpdate("fluidIntake", e.target.value)} /></div>
                <div className="input-group"><label>D16: Eating Environment</label><input type="text" value={dietary?.eatingEnv || ""} onChange={e => handleUpdate("eatingEnv", e.target.value)} /></div>
              </div>
            </div>
          </>
        );

      case "D2":
        return (
          <div className="card">
            <div className="grid-2-col">
              <div className="input-group"><label>D21: Religious & Spiritual Observances</label><textarea style={{ minHeight: "100px" }} value={dietary?.culturalReligious || ""} onChange={e => handleUpdate("culturalReligious", e.target.value)} /></div>
              <div className="input-group"><label>D22: Social Meal Dynamics</label><textarea style={{ minHeight: "100px" }} value={dietary?.socialDynamics || ""} onChange={e => handleUpdate("socialDynamics", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D3":
        return <D3NutritionAdmin dietary={dietary} setDietary={setDietary} />;

      case "D4":
        return (
          <div className="card">
            <AlertBanner type="warning" message="Check Domain B for potential Drug-Nutrient Interactions related to Potassium." />
            <div className="grid-2-col">
              <div className="input-group"><label>D41: Drug-Nutrient Interactions</label><textarea value={dietary?.drugInteractions || ""} onChange={e => handleUpdate("drugInteractions", e.target.value)} /></div>
              <div className="input-group"><label>D42: OTC Medication Usage</label><textarea value={dietary?.otcMeds || ""} onChange={e => handleUpdate("otcMeds", e.target.value)} /></div>
              <div className="input-group"><label>D43: Herbal/CAM Products</label><textarea value={dietary?.herbalCAM || ""} onChange={e => handleUpdate("herbalCAM", e.target.value)} /></div>
              <div className="input-group"><label>D44: Vitamin & Mineral Supplements</label><textarea value={dietary?.supplements || ""} onChange={e => handleUpdate("supplements", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D5":
        return (
          <div className="card">
            <h4 className="mb-1">Knowledge, Beliefs, & Attitudes</h4>
            <div className="grid-2-col">
              <div className="input-group"><label>D51: Understanding of Condition</label><textarea style={{ minHeight: "100px" }} value={dietary?.understanding || ""} onChange={e => handleUpdate("understanding", e.target.value)} /></div>
              <div className="input-group"><label>D53: Psychological Ties to Food</label><textarea style={{ minHeight: "100px" }} value={dietary?.psychTies || ""} onChange={e => handleUpdate("psychTies", e.target.value)} /></div>
            </div>
            <div className="input-group" style={{ maxWidth: "400px", marginTop: "1.5rem" }}>
              <label>D52: Readiness to Change</label>
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

      case "D6":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D61: Meal Prep Habits</label><textarea style={{ minHeight: "100px" }} value={dietary?.mealPrep || ""} onChange={e => handleUpdate("mealPrep", e.target.value)} /></div>
              <div className="input-group"><label>D62: Eating Out Frequency</label><textarea style={{ minHeight: "100px" }} value={dietary?.eatingOut || ""} onChange={e => handleUpdate("eatingOut", e.target.value)} /></div>
              <div className="input-group"><label>D63: Binge/Purge Tendencies</label><textarea style={{ minHeight: "100px" }} value={dietary?.bingePurge || ""} onChange={e => handleUpdate("bingePurge", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D7":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D71: Food Security</label><textarea style={{ minHeight: "100px" }} value={dietary?.foodSecurity || ""} onChange={e => handleUpdate("foodSecurity", e.target.value)} /></div>
              <div className="input-group"><label>D72: Food-Related Supplies</label><textarea style={{ minHeight: "100px" }} value={dietary?.foodSupplies || ""} onChange={e => handleUpdate("foodSupplies", e.target.value)} /></div>
              <div className="input-group"><label>D73: Transportation Access</label><textarea style={{ minHeight: "100px" }} value={dietary?.transport || ""} onChange={e => handleUpdate("transport", e.target.value)} /></div>
            </div>
          </div>
        );

      case "D8":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D81: Physical Activity Level</label><textarea style={{ minHeight: "100px" }} value={dietary?.physicalLevel || ""} onChange={e => handleUpdate("physicalLevel", e.target.value)} /></div>
              <div className="input-group"><label>D82: Functional Status (ADLs)</label><textarea style={{ minHeight: "100px" }} value={dietary?.adls || ""} onChange={e => handleUpdate("adls", e.target.value)} /></div>
              <div className="input-group"><label>D83: Physiological Feeding Tasks</label><textarea style={{ minHeight: "100px" }} value={dietary?.feedingTasks || ""} onChange={e => handleUpdate("feedingTasks", e.target.value)} /></div>
            </div>
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
      <h2 className="section-title">
        {DIETARY_CATEGORIES.find(c => c.id === activeSubDomain)?.title || "Dietary"} Detail
      </h2>
      {renderContent()}
    </div>
  );
}