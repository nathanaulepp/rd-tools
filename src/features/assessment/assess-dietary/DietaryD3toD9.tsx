// src/features/assessment/assess-dietary/DietaryD3toD9.tsx
// Phase: D3–D9 consolidated into one continuous scrollable view.
// The sidebar sub-nav for D3–D9 is collapsed; this component renders all sections.

import React from "react";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import type { Dietary } from "../../../types";

export default function DietaryD3toD9() {
  const { dietary, setDietary } = useDietaryStore();

  const handleUpdate = (field: keyof Dietary, val: any) =>
    setDietary({ [field]: val } as Partial<Dietary>);

  const textareaStyle: React.CSSProperties = { minHeight: "100px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

      {/* ── D3: Physical Activity & Function ── */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", color: "var(--primary)" }}>
          D3: Physical Activity &amp; Functional Status
        </h4>
        <div className="grid-3-col">
          <div className="input-group">
            <label>D31: Physical Activity Level</label>
            <textarea
              style={textareaStyle}
              value={dietary?.physicalLevel || ""}
              onChange={(e) => handleUpdate("physicalLevel", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D32: Functional Status (ADLs)</label>
            <textarea
              style={textareaStyle}
              value={dietary?.adls || ""}
              onChange={(e) => handleUpdate("adls", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D33: Physiological Feeding Tasks</label>
            <textarea
              style={textareaStyle}
              value={dietary?.feedingTasks || ""}
              onChange={(e) => handleUpdate("feedingTasks", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── D4: Knowledge, Beliefs & Attitudes ── */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", color: "var(--primary)" }}>
          D4: Knowledge, Beliefs &amp; Attitudes
        </h4>
        <div className="grid-2-col">
          <div className="input-group">
            <label>D41: Understanding of Condition</label>
            <textarea
              style={textareaStyle}
              value={dietary?.understanding || ""}
              onChange={(e) => handleUpdate("understanding", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D43: Psychological Ties to Food</label>
            <textarea
              style={textareaStyle}
              value={dietary?.psychTies || ""}
              onChange={(e) => handleUpdate("psychTies", e.target.value)}
            />
          </div>
        </div>
        <div className="input-group" style={{ maxWidth: "400px", marginTop: "0.75rem" }}>
          <label>D42: Readiness to Change</label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="10"
              value={dietary?.readiness || 1}
              onChange={(e) => handleUpdate("readiness", e.target.value)}
            />
            <div className="slider-labels">
              <span>1 (Not Ready)</span>
              <span style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "1.2rem" }}>
                {dietary?.readiness || 1}
              </span>
              <span>10 (Very Ready)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── D5: Behavior ── */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", color: "var(--primary)" }}>
          D5: Behavior
        </h4>
        <div className="grid-3-col">
          <div className="input-group">
            <label>D51: Meal Prep &amp; Shopping Habits</label>
            <textarea
              style={textareaStyle}
              value={dietary?.mealPrep || ""}
              onChange={(e) => handleUpdate("mealPrep", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D52: Eating Out Frequency</label>
            <textarea
              style={textareaStyle}
              value={dietary?.eatingOut || ""}
              onChange={(e) => handleUpdate("eatingOut", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D53: Binge/Purge Tendencies</label>
            <textarea
              style={textareaStyle}
              value={dietary?.bingePurge || ""}
              onChange={(e) => handleUpdate("bingePurge", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── D6: Access Factors ── */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", color: "var(--primary)" }}>
          D6: Food Access Factors
        </h4>
        <div className="grid-3-col">
          <div className="input-group">
            <label>D61: Food Security</label>
            <textarea
              style={textareaStyle}
              value={dietary?.foodSecurity || ""}
              onChange={(e) => handleUpdate("foodSecurity", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D62: Food-Related Supplies</label>
            <textarea
              style={textareaStyle}
              value={dietary?.foodSupplies || ""}
              onChange={(e) => handleUpdate("foodSupplies", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D63: Transportation Access</label>
            <textarea
              style={textareaStyle}
              value={dietary?.transport || ""}
              onChange={(e) => handleUpdate("transport", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── D7: Cultural & Social Food Context ── */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", color: "var(--primary)" }}>
          D7: Cultural &amp; Social Food Context
        </h4>
        <div className="grid-3-col">
          <div className="input-group">
            <label>D71: Religious &amp; Spiritual Observances</label>
            <textarea
              style={textareaStyle}
              value={dietary?.culturalReligious || ""}
              onChange={(e) => handleUpdate("culturalReligious", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D72: Social Meal Dynamics</label>
            <textarea
              style={textareaStyle}
              value={dietary?.socialDynamics || ""}
              onChange={(e) => handleUpdate("socialDynamics", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D73: Eating Environment</label>
            <textarea
              style={textareaStyle}
              value={dietary?.eatingEnv || ""}
              onChange={(e) => handleUpdate("eatingEnv", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── D9: Patient-Centered Measures ── */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", color: "var(--primary)" }}>
          D9: Patient-Centered Measures
        </h4>
        <div className="grid-2-col">
          <div className="input-group">
            <label>D91: Perception of Intervention</label>
            <textarea
              style={textareaStyle}
              value={dietary?.perception || ""}
              onChange={(e) => handleUpdate("perception", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>D92: Personal Goals &amp; QoL</label>
            <textarea
              style={textareaStyle}
              value={dietary?.qolGoals || ""}
              onChange={(e) => handleUpdate("qolGoals", e.target.value)}
            />
          </div>
        </div>
      </div>

    </div>
  );
}