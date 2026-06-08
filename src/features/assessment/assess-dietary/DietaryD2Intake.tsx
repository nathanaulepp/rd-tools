// src/features/assessment/assess-dietary/DietaryD2Intake.tsx
// Phase 5: Reads useDietaryStore directly. No props for domain state.

import React, { useState } from "react";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import type { Dietary } from "../../../types";

export default function DietaryD2Intake() {
  const { dietary, setDietary } = useDietaryStore();
  const [recallStep, setRecallStep] = useState(0);

  const handleUpdate = (field: keyof Dietary, val: any) =>
    setDietary({ [field]: val } as Partial<Dietary>);

  const recall = dietary?.recall || [];
  const currentMeal = recall[recallStep] || { label: "Meal 1", value: "" };

  const updateRecallMeal = (index: number, updates: any) => {
    const newRecall = [...recall];
    newRecall[index] = { ...newRecall[index], ...updates };
    handleUpdate("recall", newRecall);
  };

  const addMeal = () => {
    const newRecall = [...recall];
    const nextIndex = newRecall.length + 1;
    newRecall.push({ label: `Meal ${nextIndex}`, value: "" });
    handleUpdate("recall", newRecall);
    setRecallStep(newRecall.length - 1);
  };

  const removeMeal = (index: number) => {
    if (recall.length <= 1) return;
    let newRecall = recall.filter((_: any, i: number) => i !== index);
    newRecall = newRecall.map((meal: any, i: number) => ({
      ...meal,
      label: `Meal ${i + 1}`,
    }));
    handleUpdate("recall", newRecall);
    if (recallStep >= newRecall.length) setRecallStep(newRecall.length - 1);
  };

  return (
    <>
      <div className="card">
        <div className="flex-between mb-1">
          <h4 style={{ margin: 0 }}>D21: 24-Hour Recall / Intake Journals</h4>
          <button
            className="btn-outline"
            onClick={addMeal}
            style={{ fontSize: "0.7rem" }}
          >
            + Add Meal
          </button>
        </div>
        <div className="stepper-container">
          <div
            className="stepper-header"
            style={{ overflowX: "auto", paddingBottom: "10px" }}
          >
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
            <div className="flex-between" style={{ marginBottom: "4px" }}>
              <label style={{ margin: 0 }}>{currentMeal.label} Details</label>
              {recall.length > 1 && (
                <button
                  className="btn-outline"
                  onClick={() => removeMeal(recallStep)}
                  style={{
                    fontSize: "0.65rem",
                    padding: "2px 6px",
                    borderColor: "var(--danger)",
                    color: "var(--danger)",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            <textarea
              value={currentMeal.value}
              onChange={(e) =>
                updateRecallMeal(recallStep, { value: e.target.value })
              }
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
              onChange={(e) => handleUpdate("eeiPercent", e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          <div className="input-group">
            <label>D22: Intake Timeframe (Days)</label>
            <input
              type="number"
              value={dietary?.eeiTimeframe || ""}
              onChange={(e) => handleUpdate("eeiTimeframe", e.target.value)}
              placeholder="e.g. 7"
            />
          </div>
          <div className="input-group">
            <label>D26: Fluid Intake</label>
            <input
              type="text"
              value={dietary?.fluidIntake || ""}
              onChange={(e) => handleUpdate("fluidIntake", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D24: Meal & Snack Patterns</label>
            <textarea
              value={dietary?.mealPatterns || ""}
              onChange={(e) => handleUpdate("mealPatterns", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D25: Current & Previous Diets</label>
            <textarea
              value={dietary?.currentDiets || ""}
              onChange={(e) => handleUpdate("currentDiets", e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
}