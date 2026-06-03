// src/features/assessment/assess-dietary/DietaryD3toD9.tsx
// Phase 5: Reads useDietaryStore and useUIStore directly. No props for domain state.

import React from "react";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import { useUIStore } from "../../../stores/useUIStore";
import type { Dietary } from "../../../types";

export default function DietaryD3toD9() {
  const { dietary, setDietary } = useDietaryStore();
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  const handleUpdate = (field: keyof Dietary, val: any) =>
    setDietary({ [field]: val } as Partial<Dietary>);

  switch (activeSubDomain) {
    case "D3":
      return (
        <div className="card">
          <div className="grid-3-col">
            <div className="input-group">
              <label>D31: Physical Activity Level</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.physicalLevel || ""}
                onChange={(e) => handleUpdate("physicalLevel", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D32: Functional Status (ADLs)</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.adls || ""}
                onChange={(e) => handleUpdate("adls", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D33: Physiological Feeding Tasks</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.feedingTasks || ""}
                onChange={(e) => handleUpdate("feedingTasks", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "D4":
      return (
        <div className="card">
          <h4 className="mb-1">Knowledge, Beliefs, & Attitudes</h4>
          <div className="grid-2-col">
            <div className="input-group">
              <label>D41: Understanding of Condition</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.understanding || ""}
                onChange={(e) => handleUpdate("understanding", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D43: Psychological Ties to Food</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.psychTies || ""}
                onChange={(e) => handleUpdate("psychTies", e.target.value)}
              />
            </div>
          </div>
          <div
            className="input-group"
            style={{ maxWidth: "400px", marginTop: "1.5rem" }}
          >
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
                <span
                  style={{
                    fontWeight: "bold",
                    color: "#2c3e50",
                    fontSize: "1.2rem",
                  }}
                >
                  {dietary?.readiness || 1}
                </span>
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
            <div className="input-group">
              <label>D51: Meal Prep & Shopping Habits</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.mealPrep || ""}
                onChange={(e) => handleUpdate("mealPrep", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D52: Eating Out Frequency</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.eatingOut || ""}
                onChange={(e) => handleUpdate("eatingOut", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D53: Binge/Purge Tendencies</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.bingePurge || ""}
                onChange={(e) => handleUpdate("bingePurge", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "D6":
      return (
        <div className="card">
          <div className="grid-3-col">
            <div className="input-group">
              <label>D61: Food Security</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.foodSecurity || ""}
                onChange={(e) => handleUpdate("foodSecurity", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D62: Food-Related Supplies</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.foodSupplies || ""}
                onChange={(e) => handleUpdate("foodSupplies", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D63: Transportation Access</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.transport || ""}
                onChange={(e) => handleUpdate("transport", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "D7":
      return (
        <div className="card">
          <div className="grid-3-col">
            <div className="input-group">
              <label>D71: Religious & Spiritual Observances</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.culturalReligious || ""}
                onChange={(e) =>
                  handleUpdate("culturalReligious", e.target.value)
                }
              />
            </div>
            <div className="input-group">
              <label>D72: Social Meal Dynamics</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.socialDynamics || ""}
                onChange={(e) => handleUpdate("socialDynamics", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D73: Eating Environment</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.eatingEnv || ""}
                onChange={(e) => handleUpdate("eatingEnv", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "D9":
      return (
        <div className="card">
          <div className="grid-2-col">
            <div className="input-group">
              <label>D91: Perception of Intervention</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.perception || ""}
                onChange={(e) => handleUpdate("perception", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>D92: Personal Goals & QoL</label>
              <textarea
                style={{ minHeight: "100px" }}
                value={dietary?.qolGoals || ""}
                onChange={(e) => handleUpdate("qolGoals", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}