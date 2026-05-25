import React, { useState } from 'react';
import { AlertBanner } from '../shared/AlertBanner';
import D3NutritionAdmin from '../shared/D3NutritionAdmin'; // <-- This import is correct!

export default function DietaryDomain({ dietary, setDietary, activeSubDomain }: any) {
  const [recallStep, setRecallStep] = useState(0);
  const handleUpdate = (field: string, val: string) => setDietary({ ...dietary, [field]: val });
  
  const updateRecall = (field: string, val: string) => setDietary({ 
    ...dietary, 
    recall: { ...(dietary?.recall || {}), [field]: val } 
  });

  const renderContent = () => {
    const steps = ["breakfast", "lunch", "dinner", "snacks"] as const;
    const currentStepField = steps[recallStep];

    switch (activeSubDomain) {
      case "D1":
        return (
          <>
            <div className="card">
              <h4 className="mb-1">D11: 24-Hour Recall / Intake Journals</h4>
              <div className="stepper-container">
                <div className="stepper-header">
                  {["Breakfast", "Lunch", "Dinner", "Snacks"].map((step, idx) => (
                    <div key={step} className={`step ${recallStep === idx ? 'active' : ''}`} onClick={() => setRecallStep(idx)}>
                      <div className="step-circle">{idx + 1}</div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <textarea 
                    value={dietary?.recall?.[currentStepField] || ""} 
                    onChange={e => updateRecall(currentStepField, e.target.value)}
                    placeholder={`Enter details for ${["Breakfast", "Lunch", "Dinner", "Snacks"][recallStep]}...`}
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>
            </div>
            <div className="card">
              <h4 className="mb-1">Additional D1 Factors</h4>
              <div className="grid-2-col">
                <div className="input-group"><label>D12: Macro & Micronutrient Adequacy</label><textarea value={dietary?.macroAdequacy || ""} onChange={e=>handleUpdate("macroAdequacy", e.target.value)}/></div>
                <div className="input-group"><label>D13: Meal & Snack Patterns</label><textarea value={dietary?.mealPatterns || ""} onChange={e=>handleUpdate("mealPatterns", e.target.value)}/></div>
                <div className="input-group"><label>D14: Current & Previous Diets</label><textarea value={dietary?.currentDiets || ""} onChange={e=>handleUpdate("currentDiets", e.target.value)}/></div>
                <div className="input-group"><label>D15: Fluid Intake</label><input type="text" value={dietary?.fluidIntake || ""} onChange={e=>handleUpdate("fluidIntake", e.target.value)}/></div>
                <div className="input-group"><label>D16: Eating Environment</label><input type="text" value={dietary?.eatingEnv || ""} onChange={e=>handleUpdate("eatingEnv", e.target.value)}/></div>
              </div>
            </div>
          </>
        );

      // Fixed: Properly caught under the "D3" case condition
      case "D3":
        return <D3NutritionAdmin dietary={dietary} setDietary={setDietary} />;

      case "D5":
        return (
          <div className="card">
            <h4 className="mb-1">Knowledge, Beliefs, & Attitudes</h4>
            <div className="grid-2-col">
              <div className="input-group"><label>D51: Understanding of Condition</label><textarea value={dietary?.understanding || ""} onChange={e=>handleUpdate("understanding", e.target.value)}/></div>
              <div className="input-group"><label>D53: Psychological Ties to Food</label><textarea value={dietary?.psychTies || ""} onChange={e=>handleUpdate("psychTies", e.target.value)}/></div>
            </div>
            <div className="input-group" style={{ maxWidth: '400px', marginTop: '1.5rem' }}>
              <label>D52: Readiness to Change</label>
              <div className="slider-container">
                <input 
                  type="range" min="1" max="10" 
                  value={dietary?.readiness || 1} 
                  onChange={e => handleUpdate("readiness", e.target.value)} 
                />
                <div className="slider-labels">
                  <span>1 (Not Ready)</span>
                  <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.2rem' }}>{dietary?.readiness || 1}</span>
                  <span>10 (Very Ready)</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "D4":
        return (
          <div className="card">
            <AlertBanner type="warning" message="Check Domain B for potential Drug-Nutrient Interactions related to Potassium." />
            <div className="grid-2-col">
              <div className="input-group">
                <label className="flex-between">D41: Drug-Nutrient Interactions <button className="context-btn" title="Flag for review">⋮</button></label>
                <textarea value={dietary?.drugInteractions || ""} onChange={e=>handleUpdate("drugInteractions", e.target.value)}/>
              </div>
              <div className="input-group"><label>D42: OTC Medication Usage</label><textarea value={dietary?.otcMeds || ""} onChange={e=>handleUpdate("otcMeds", e.target.value)}/></div>
              <div className="input-group"><label>D43: Herbal/CAM Products</label><textarea value={dietary?.herbalCAM || ""} onChange={e=>handleUpdate("herbalCAM", e.target.value)}/></div>
              <div className="input-group"><label>D44: Vitamin & Mineral Supplements</label><textarea value={dietary?.supplements || ""} onChange={e=>handleUpdate("supplements", e.target.value)}/></div>
            </div>
          </div>
        );
      case "D2":
        return (
          <div className="card">
            <div className="grid-2-col">
              <div className="input-group"><label>D21: Religious & Spiritual Observances</label><textarea value={dietary?.culturalReligious || ""} onChange={e=>handleUpdate("culturalReligious", e.target.value)}/></div>
              <div className="input-group"><label>D22: Social Meal Dynamics</label><textarea value={dietary?.socialDynamics || ""} onChange={e=>handleUpdate("socialDynamics", e.target.value)}/></div>
            </div>
          </div>
        );
      case "D6":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D61: Meal Prep Habits</label><textarea value={dietary?.mealPrep || ""} onChange={e=>handleUpdate("mealPrep", e.target.value)}/></div>
              <div className="input-group"><label>D62: Eating Out Frequency</label><textarea value={dietary?.eatingOut || ""} onChange={e=>handleUpdate("eatingOut", e.target.value)}/></div>
              <div className="input-group"><label>D63: Binge/Purge Tendencies</label><textarea value={dietary?.bingePurge || ""} onChange={e=>handleUpdate("bingePurge", e.target.value)}/></div>
            </div>
          </div>
        );
      case "D7":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D71: Food Security</label><textarea value={dietary?.foodSecurity || ""} onChange={e=>handleUpdate("foodSecurity", e.target.value)}/></div>
              <div className="input-group"><label>D72: Food-Related Supplies</label><textarea value={dietary?.foodSupplies || ""} onChange={e=>handleUpdate("foodSupplies", e.target.value)}/></div>
              <div className="input-group"><label>D73: Transportation Access</label><textarea value={dietary?.transport || ""} onChange={e=>handleUpdate("transport", e.target.value)}/></div>
            </div>
          </div>
        );
      case "D8":
        return (
          <div className="card">
            <div className="grid-3-col">
              <div className="input-group"><label>D81: Physical Activity Level</label><textarea value={dietary?.physicalLevel || ""} onChange={e=>handleUpdate("physicalLevel", e.target.value)}/></div>
              <div className="input-group"><label>D82: Functional Status (ADLs)</label><textarea value={dietary?.adls || ""} onChange={e=>handleUpdate("adls", e.target.value)}/></div>
              <div className="input-group"><label>D83: Physiological Feeding Tasks</label><textarea value={dietary?.feedingTasks || ""} onChange={e=>handleUpdate("feedingTasks", e.target.value)}/></div>
            </div>
          </div>
        );
      case "D9":
        return (
          <div className="card">
            <div className="grid-2-col">
              <div className="input-group"><label>D91: Perception of Intervention</label><textarea value={dietary?.perception || ""} onChange={e=>handleUpdate("perception", e.target.value)}/></div>
              <div className="input-group"><label>D92: Personal Goals & QoL</label><textarea value={dietary?.qolGoals || ""} onChange={e=>handleUpdate("qolGoals", e.target.value)}/></div>
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